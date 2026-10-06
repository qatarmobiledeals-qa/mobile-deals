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
}

export async function createCodOrder(data: CreateOrderInput): Promise<{
  success: boolean;
  orderReference?: string;
  error?: string;
}> {
  try {
    // 1. Validate required fields
    if (!data.customerName || data.customerName.trim().length < 2) {
      return { success: false, error: "Please enter your full name." };
    }

    if (!data.customerPhone || data.customerPhone.trim().length < 6) {
      return { success: false, error: "Please provide a valid Qatar mobile number." };
    }

    if (!data.area || data.area.trim().length < 2) {
      return { success: false, error: "Please specify your delivery area / district in Qatar." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Your order has no items selected." };
    }

    // 2. Fetch site settings to get active Qatar fixed delivery charge
    const settings = await getSiteSettings();
    const deliveryFee =
      typeof settings.shipping_charge === "number" && settings.shipping_charge >= 0
        ? settings.shipping_charge
        : 0;

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
        delivery_notes: data.deliveryNotes?.trim() || null,
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
        error: "Unable to process order at this moment. Please try again or order directly on WhatsApp.",
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
      revalidatePath("/");
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
      error: "An unexpected error occurred. Please contact support via WhatsApp.",
    };
  }
}
