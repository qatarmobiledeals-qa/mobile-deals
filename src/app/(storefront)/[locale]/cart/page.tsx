"use client";

import React, { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { generateCartWhatsAppUrl } from "@/lib/whatsapp";
import { resolveTextField } from "@/lib/i18n/content-resolver";
import { formatPrice } from "@/lib/formatters";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export default function CartPage() {
  const locale = useLocale();
  const tCart = useTranslations("cart");

  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    deliveryFee,
    total,
    totalItems,
    whatsappNumber,
    currency,
    isHydrated,
  } = useCart();

  const whatsAppOrderUrl = generateCartWhatsAppUrl({
    storeNumber: whatsappNumber || "+97455000000",
    items,
    total,
    currency: currency || "QAR",
    locale,
  });

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50/60">
        <header className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="md" />
            <Suspense fallback={null}>
              <LanguageSwitcher variant="subtle" />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#8A1538] mx-auto mb-3" />
            <p className="text-xs font-semibold text-neutral-500">{tCart("loadingCart")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Logo size="md" />
          <div className="flex items-center gap-3 sm:gap-4">
            <Suspense fallback={null}>
              <LanguageSwitcher variant="subtle" />
            </Suspense>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-[#8A1538] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 shrink-0" />
              <span>{tCart("continueShopping")}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 md:py-12 w-full">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-1.5 h-6 bg-[#8A1538] rounded-full inline-block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {tCart("title")}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium">
              {tCart("itemsInCart", { count: totalItems })}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-3xl bg-white border border-neutral-200 shadow-2xs">
            <ShoppingBag className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800">{tCart("emptyTitle")}</h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mt-2 mb-6">
              {tCart("emptySubtitle")}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8A1538] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:bg-[#720e2c] transition-all"
            >
              <span>{tCart("startShopping")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 shrink-0" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs divide-y divide-neutral-100 overflow-hidden">
                {items.map((item) => {
                  const displayName = resolveTextField(
                    item.productName,
                    item.productNameAr,
                    locale
                  ).value;
                  const displayVariant = resolveTextField(
                    item.variantName,
                    item.variantNameAr,
                    locale,
                    { optional: true }
                  ).resolvedValue;

                  return (
                    <div
                      key={`${item.productId}-${item.variantId || "default"}`}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Item Image + Details */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl border border-neutral-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={displayName}
                              fill
                              sizes="96px"
                              className="object-contain p-1"
                            />
                          ) : (
                            <span className="text-2xl">📱</span>
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="font-bold text-sm text-neutral-900 hover:text-[#8A1538] transition-colors line-clamp-2"
                          >
                            {displayName}
                          </Link>
                          {displayVariant && (
                            <p className="text-xs text-neutral-500 font-medium">
                              {tCart("variant", { name: displayVariant })}
                            </p>
                          )}
                          <p className="text-sm font-black text-[#8A1538]">
                            {formatPrice(item.price, locale, currency)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Selector & Remove */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                        <div className="flex items-center border border-neutral-300 rounded-xl bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1, item.variantId)
                            }
                            className="p-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                            aria-label={tCart("decreaseQuantity")}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-bold text-xs sm:text-sm text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1, item.variantId)
                            }
                            className="p-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                            aria-label={tCart("increaseQuantity")}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Total Item Price */}
                        <span className="text-sm sm:text-base font-black text-neutral-900 min-w-24 text-end font-mono">
                          {formatPrice(item.price * item.quantity, locale, currency)}
                        </span>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-2 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={tCart("removeItem")}
                          aria-label={tCart("removeItem")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Qatar Delivery Promise */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 flex items-center gap-3 text-xs text-neutral-600">
                <Truck className="w-5 h-5 text-[#8A1538] shrink-0" />
                <span>
                  <strong>{tCart("deliveryPromiseTitle")}</strong>{" "}
                  {tCart("deliveryPromiseDesc")}
                </span>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs space-y-5 lg:sticky lg:top-24">
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                {tCart("orderSummary")}
              </h2>

              <div className="space-y-3 text-xs sm:text-sm divide-y divide-neutral-100">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-neutral-500">
                    {tCart("subtotalWithCount", { count: totalItems })}
                  </span>
                  <span className="font-bold text-neutral-900 font-mono">
                    {formatPrice(subtotal, locale, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-neutral-500">{tCart("deliveryFee")}</span>
                  <span
                    className={`font-bold font-mono ${
                      deliveryFee === 0 ? "text-emerald-600" : "text-neutral-900"
                    }`}
                  >
                    {deliveryFee === 0
                      ? tCart("free")
                      : formatPrice(deliveryFee, locale, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 text-base sm:text-lg">
                  <span className="font-bold text-neutral-900">{tCart("total")}</span>
                  <span className="font-black text-[#8A1538] font-mono">
                    {formatPrice(total, locale, currency)}
                  </span>
                </div>
              </div>

              {/* Checkout CTAs */}
              <div className="space-y-3 pt-2">
                <Link
                  href="/checkout"
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#8A1538] hover:bg-[#700f2c] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <span>{tCart("proceedToCheckout")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180 shrink-0" />
                </Link>

                <a
                  href={whatsAppOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                  <span>{tCart("orderOnWhatsApp")}</span>
                </a>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{tCart("safeTransaction")}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
