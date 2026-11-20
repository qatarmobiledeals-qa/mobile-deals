import React, { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/data";
import { formatPrice } from "@/lib/formatters";
import { resolveTextField } from "@/lib/i18n/content-resolver";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  CheckCircle2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Package,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ClearCartOnSuccess } from "@/components/store/clear-cart-on-success";

const AREA_KEY_BY_VALUE: Record<string, string> = {
  "Doha - Al Sadd": "dohaAlSadd",
  "Doha - West Bay": "dohaWestBay",
  "Doha - The Pearl Qatar": "dohaThePearl",
  "Lusail City": "lusailCity",
  "Doha - Al Dafna": "dohaAlDafna",
  "Al Rayyan": "alRayyan",
  "Al Wakrah": "alWakrah",
  "Al Khor": "alKhor",
  "Doha - Al Mansoura": "dohaAlMansoura",
  "Doha - Al Hilal": "dohaAlHilal",
  "Doha - Madinat Khalifa": "dohaMadinatKhalifa",
  "Doha - Abu Hamour": "dohaAbuHamour",
  "Doha - Al Waab": "dohaAlWaab",
  "Doha - Bin Mahmoud": "dohaBinMahmoud",
  "Umm Salal": "ummSalal",
  "Al Shahaniya": "alShahaniya",
};

const VALID_ORDER_STATUSES = new Set([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

interface OrderSuccessPageProps {
  params: Promise<{
    locale: string;
    ref: string;
  }>;
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { locale, ref } = await params;
  setRequestLocale(locale);

  const [settings, tSuccess, tStatus, tCheckout] = await Promise.all([
    getSiteSettings(),
    getTranslations({ locale, namespace: "orderSuccess" }),
    getTranslations({ locale, namespace: "orderStatus" }),
    getTranslations({ locale, namespace: "checkout" }),
  ]);

  const currency = settings.currency || "QAR";
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_reference", ref)
    .maybeSingle();

  // Optional best-effort Arabic product name lookup for display in Arabic locale
  const productArNameMap = new Map<string, string>();
  if (locale === "ar" && order?.order_items?.length) {
    const productIds = Array.from(
      new Set(
        order.order_items
          .map((it: { product_id?: string | null }) => it.product_id)
          .filter((id: string | null | undefined): id is string => Boolean(id))
      )
    );
    if (productIds.length > 0) {
      const { data: productsAr } = await supabase
        .from("products")
        .select("id, name_ar")
        .in("id", productIds);
      if (Array.isArray(productsAr)) {
        for (const p of productsAr) {
          if (p.id && typeof p.name_ar === "string" && p.name_ar.trim()) {
            productArNameMap.set(p.id, p.name_ar.trim());
          }
        }
      }
    }
  }

  const whatsappCleanNumber = (settings.whatsapp_number || "+97455000000").replace(
    /[^\d]/g,
    ""
  );

  const whatsappConfirmUrl = `https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
    tSuccess("whatsappConfirmMessage", { ref })
  )}`;

  const statusKey = order?.status && VALID_ORDER_STATUSES.has(order.status) ? order.status : "pending";
  const localizedStatus = tStatus(statusKey);

  const areaKey = order?.area ? AREA_KEY_BY_VALUE[order.area] : undefined;
  const localizedArea = areaKey ? tCheckout(`areas.${areaKey}`) : order?.area;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60">
      <Suspense fallback={null}>
        <ClearCartOnSuccess />
      </Suspense>
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Logo size="md" />
          <div className="flex items-center gap-3 sm:gap-4">
            <Suspense fallback={null}>
              <LanguageSwitcher variant="subtle" />
            </Suspense>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-[#8A1538]"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 shrink-0" />
              <span>{tSuccess("returnToStore")}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 md:py-16 w-full">
        {/* Success Header Card */}
        <div className="text-center bg-white rounded-3xl border border-neutral-200/90 p-8 sm:p-10 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {tSuccess("title")}
            </h1>
            <p className="text-base text-neutral-700 font-semibold">
              {tSuccess("subtitle")}
            </p>
          </div>

          <div className="inline-block px-4 py-2 rounded-xl bg-neutral-100 border border-neutral-200 font-mono text-xs sm:text-sm font-bold text-neutral-800">
            {tSuccess("orderRef")}: <span className="text-[#8A1538]" dir="ltr">{ref}</span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            {tSuccess("whatsappNotice")}
          </p>

          {/* WhatsApp Fast Confirmation CTA */}
          <div className="pt-2">
            <a
              href={whatsappConfirmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
              <span>{tSuccess("trackWhatsApp")}</span>
            </a>
          </div>
        </div>

        {/* Order Details */}
        {order ? (
          <div className="mt-8 bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-[#8A1538] shrink-0" />
                <span>{tSuccess("orderSummary")}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  {tSuccess("orderStatusLabel")}: {localizedStatus}
                </span>
                <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 font-semibold">
                  {tSuccess("paymentStatusLabel")}: {tSuccess("paymentCod")}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
              {order.order_items?.map(
                (item: {
                  id: string;
                  product_id?: string | null;
                  product_name: string;
                  variant_name: string | null;
                  quantity: number;
                  price: number;
                  total_price: number;
                }) => {
                  const displayName = resolveTextField(
                    item.product_name,
                    item.product_id ? productArNameMap.get(item.product_id) : null,
                    locale
                  ).value;

                  return (
                    <div key={item.id} className="py-3 flex justify-between items-center gap-4">
                      <div className="min-w-0">
                        <span className="font-bold text-neutral-800 block">
                          {displayName}
                        </span>
                        {item.variant_name && (
                          <span className="text-neutral-400 text-xs block">
                            {tSuccess("variant", { name: item.variant_name })}
                          </span>
                        )}
                        <span className="text-neutral-500 text-xs block">
                          {tSuccess("qtyPrice", {
                            qty: item.quantity,
                            price: formatPrice(item.price, locale, currency),
                          })}
                        </span>
                      </div>
                      <span className="font-bold text-neutral-900 shrink-0 font-mono">
                        {formatPrice(item.total_price, locale, currency)}
                      </span>
                    </div>
                  );
                }
              )}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>{tSuccess("subtotal")}</span>
                <span className="font-mono">{formatPrice(order.subtotal, locale, currency)}</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>{tSuccess("qatarDelivery")}</span>
                  <span className="text-neutral-900 font-mono font-semibold">
                    {formatPrice(Number(order.delivery_fee), locale, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#8A1538] pt-2 border-t border-neutral-100">
                <span>{tSuccess("totalDueCod")}</span>
                <span className="font-mono">{formatPrice(order.total, locale, currency)}</span>
              </div>
            </div>

            {/* Customer & Address */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-neutral-800">
                <MapPin className="w-4 h-4 text-[#8A1538] shrink-0" />
                <span>{tSuccess("deliveryRecipient")}</span>
              </div>
              <p className="text-neutral-700">
                <strong>{order.customer_name}</strong>{" "}
                <span dir="ltr">({order.customer_phone})</span>
              </p>
              <p className="text-neutral-600">
                {[
                  localizedArea,
                  order.zone ? tSuccess("zoneLabel", { zone: order.zone }) : null,
                  order.street ? tSuccess("streetLabel", { street: order.street }) : null,
                  order.building ? tSuccess("buildingLabel", { building: order.building }) : null,
                ]
                  .filter(Boolean)
                  .join(locale === "ar" ? "، " : ", ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs text-center space-y-2">
            <h2 className="text-base font-bold text-neutral-800">
              {tSuccess("orderNotFoundTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              {tSuccess("orderNotFoundDesc", { ref })}
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8A1538] hover:underline"
          >
            <span>{tSuccess("continueShopping")}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 shrink-0" />
          </Link>
        </div>
      </main>
    </div>
  );
}
