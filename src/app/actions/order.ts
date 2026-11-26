"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/data";
import { sendOrderEmails } from "@/lib/brevo";
import { CartItem, Order, OrderItem } from "@/types/database";

interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  area: string;
  zone?: string;
  street?: string;
  building?: string;
  deliveryNotes?: string;
  items: CartItem[];
  locale?: string;
  deliveryFee?: number;
  customerLat?: number;
  customerLng?: number;
}

const ORDER_ERROR_MESSAGES = {
  en: {
    nameRequired: "Please enter your full name.",
    invalidPhone: "Please provide a valid Qatar mobile number.",
    areaRequired: "Please specify your delivery area / district in Qatar.",
    emptyItems: "Your order has no items selected.",
    insertFailed:
      "Unable to process order at this moment. Please try again or order directly on WhatsApp.",
    unexpected: "An unexpected error occurred. Please contact support via WhatsApp.",
  },
  ar: {
    nameRequired: "يرجى إدخال الاسم الكامل.",
    invalidPhone: "يرجى إدخال رقم جوال قطري صالح.",
    areaRequired: "يرجى تحديد منطقة التوصيل في قطر.",
    emptyItems: "لم يتم اختيار أي منتجات في طلبك.",
    insertFailed:
      "تعذر إتمام الطلب في الوقت الحالي. يرجى المحاولة مرة أخرى أو الطلب مباشرة عبر واتساب.",
    unexpected: "حدث خطأ غير متوقع. يرجى التواصل مع الدعم عبر واتساب.",
  },
} as const;

export async function createCodOrder(data: CreateOrderInput): Promise<{
  success: boolean;
  orderReference?: string;
  error?: string;
}> {
  const errMsgs = data.locale === "ar" ? ORDER_ERROR_MESSAGES.ar : ORDER_ERROR_MESSAGES.en;

  try {
    // 1. Validate required fields
    if (!data.customerName || data.customerName.trim().length < 2) {
      return { success: false, error: errMsgs.nameRequired };
    }

    if (!data.customerPhone || data.customerPhone.trim().length < 6) {
      return { success: false, error: errMsgs.invalidPhone };
    }

    if (!data.area || data.area.trim().length < 2) {
      return { success: false, error: errMsgs.areaRequired };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: errMsgs.emptyItems };
    }

    // 2. Calculate distance-based delivery fee (Free <= 15km, 1 QAR/km beyond 15km from Duhail shop)
    const STORE_LAT = 25.35706;
    const STORE_LNG = 51.474236;

    let deliveryFee = 0;
    let locationNote = "";

    if (
      typeof data.customerLat === "number" &&
      typeof data.customerLng === "number" &&
      !isNaN(data.customerLat) &&
      !isNaN(data.customerLng)
    ) {
      // Haversine distance in km
      const R = 6371;
      const dLat = ((data.customerLat - STORE_LAT) * Math.PI) / 180;
      const dLon = ((data.customerLng - STORE_LNG) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((STORE_LAT * Math.PI) / 180) *
          Math.cos((data.customerLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;

      if (distanceKm <= 15) {
        deliveryFee = 0;
      } else {
        const extraKm = Math.ceil(distanceKm - 15);
        deliveryFee = extraKm * 1;
      }

      locationNote = `📍 GPS: https://maps.google.com/?q=${data.customerLat},${data.customerLng} (~${distanceKm.toFixed(1)} km from Duhail shop)`;
    } else if (typeof data.deliveryFee === "number" && data.deliveryFee >= 0) {
      deliveryFee = data.deliveryFee;
    } else {
      const settings = await getSiteSettings();
      deliveryFee =
        typeof settings.shipping_charge === "number" && settings.shipping_charge >= 0
          ? settings.shipping_charge
          : 0;
    }

    // 3. Calculate subtotal and final total
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal + deliveryFee;

    // 4. Generate human-readable order reference: MD-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderReference = `MD-${dateStr}-${randomHex}`;

    const mergedDeliveryNotes = [data.deliveryNotes?.trim(), locationNote]
      .filter(Boolean)
      .join("\n");

    const supabase = createAdminClient();

    // 5. Insert into orders table with persistent delivery_fee
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_reference: orderReference,
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone.trim(),
        customer_email: data.customerEmail?.trim() || null,
        area: data.area.trim(),
        zone: data.zone?.trim() || null,
        street: data.street?.trim() || null,
        building: data.building?.trim() || null,
        delivery_notes: mergedDeliveryNotes || null,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: total,
        status: "pending",
        payment_method: "COD",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("[OrderAction] Order insert failed:", orderError);
      return {
        success: false,
        error: errMsgs.insertFailed,
      };
    }

    const orderId = orderData.id;

    // 6. Batch insert order items
    const orderItemsToInsert = data.items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      variant_name: item.variantName || null,
      price: item.price,
      quantity: item.quantity,
      total_price: item.price * item.quantity,
      product_image_url: item.imageUrl || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error("[OrderAction] Order items insert error:", itemsError);
    }

    // 7. Trigger transactional confirmation emails via Brevo
    try {
      const orderRecord: Order = {
        id: orderId,
        order_reference: orderReference,
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone.trim(),
        customer_email: data.customerEmail?.trim() || null,
        area: data.area.trim(),
        zone: data.zone?.trim() || null,
        street: data.street?.trim() || null,
        building: data.building?.trim() || null,
        delivery_notes: data.deliveryNotes?.trim() || null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "pending",
        payment_method: "COD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const orderItemsRecord: OrderItem[] = orderItemsToInsert.map((it) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        variant_name: it.variant_name,
        price: it.price,
        quantity: it.quantity,
        total_price: it.total_price,
        product_image_url: it.product_image_url,
      }));

      // Async email trigger (won't block user response)
      sendOrderEmails({
        order: orderRecord,
        items: orderItemsRecord,
      }).catch((e) => console.warn("[Brevo] Background email failed:", e));
    } catch (e) {
      console.warn("[OrderAction] Email notification skipped:", e);
    }

    // 8. Invalidate admin caches so dashboard is updated instantly
    try {
      revalidatePath("/admin");
      revalidatePath("/admin/orders");
    } catch (e) {
      console.warn("[OrderAction] Cache revalidation skipped:", e);
    }

    return {
      success: true,
      orderReference,
    };
  } catch (err: unknown) {
    console.error("[OrderAction] Unexpected error:", err);
    return {
      success: false,
      error: errMsgs.unexpected,
    };
  }
}
