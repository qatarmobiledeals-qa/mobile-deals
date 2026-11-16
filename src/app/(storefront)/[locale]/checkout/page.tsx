"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/types/database";
import { createCodOrder } from "@/app/actions/order";
import { resolveTextField } from "@/lib/i18n/content-resolver";
import { formatPrice } from "@/lib/formatters";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  ShieldCheck,
  Truck,
  Banknote,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Mail,
  Zap,
} from "lucide-react";

const QATAR_AREA_OPTIONS = [
  { value: "Doha - Al Sadd", key: "dohaAlSadd" },
  { value: "Doha - West Bay", key: "dohaWestBay" },
  { value: "Doha - The Pearl Qatar", key: "dohaThePearl" },
  { value: "Lusail City", key: "lusailCity" },
  { value: "Doha - Al Dafna", key: "dohaAlDafna" },
  { value: "Al Rayyan", key: "alRayyan" },
  { value: "Al Wakrah", key: "alWakrah" },
  { value: "Al Khor", key: "alKhor" },
  { value: "Doha - Al Mansoura", key: "dohaAlMansoura" },
  { value: "Doha - Al Hilal", key: "dohaAlHilal" },
  { value: "Doha - Madinat Khalifa", key: "dohaMadinatKhalifa" },
  { value: "Doha - Abu Hamour", key: "dohaAbuHamour" },
  { value: "Doha - Al Waab", key: "dohaAlWaab" },
  { value: "Doha - Bin Mahmoud", key: "dohaBinMahmoud" },
  { value: "Umm Salal", key: "ummSalal" },
  { value: "Al Shahaniya", key: "alShahaniya" },
] as const;

const CHECKOUT_DRAFT_KEY = "mobile_deals_checkout_draft_v1";

interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  area: string;
  zone: string;
  street: string;
  building: string;
  deliveryNotes: string;
}

const DEFAULT_FORM_DATA: CheckoutFormData = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  area: QATAR_AREA_OPTIONS[0].value,
  zone: "",
  street: "",
  building: "",
  deliveryNotes: "",
};

function CheckoutContent() {
  const router = useRouter();
  const locale = useLocale();
  const tCheckout = useTranslations("checkout");
  const searchParams = useSearchParams();
  const isDirect = searchParams.get("direct") === "1";

  const { items: cartItems, deliveryFee, currency, isHydrated } = useCart();
  const [directItems, setDirectItems] = useState<CartItem[]>([]);
  const [directLoaded, setDirectLoaded] = useState(!isDirect);

  // Load direct single-item buy payload from sessionStorage
  useEffect(() => {
    if (!isDirect) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = sessionStorage.getItem("direct_checkout_item");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDirectItems(parsed);
          }
        }
      } catch (e) {
        console.warn("Could not load direct checkout item", e);
      } finally {
        setDirectLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [isDirect]);

  // Determine active items for this checkout session
  const activeItems: CartItem[] = isDirect ? directItems : cartItems;
  const isReady = isDirect ? directLoaded : isHydrated;

  const subtotal = activeItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + deliveryFee;

  const [formData, setFormData] = useState<CheckoutFormData>(DEFAULT_FORM_DATA);
  const [draftHydrated, setDraftHydrated] = useState(false);

  // Restore checkout form draft so locale switching never loses typed details
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<CheckoutFormData>;
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // ignore storage errors
      } finally {
        setDraftHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    try {
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(formData));
    } catch {
      // ignore storage errors
    }
  }, [formData, draftHydrated]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSuccess) return;
    setErrorMessage(null);

    if (activeItems.length === 0) {
      setErrorMessage(
        isDirect ? tCheckout("errors.noDirectProduct") : tCheckout("errors.emptyCart")
      );
      return;
    }

    if (!formData.customerName.trim()) {
      setErrorMessage(tCheckout("errors.nameRequired"));
      return;
    }

    const phoneDigits = formData.customerPhone.replace(/\D/g, "");
    if (!phoneDigits) {
      setErrorMessage(tCheckout("errors.phoneRequired"));
      return;
    }
    if (phoneDigits.length < 8) {
      setErrorMessage(tCheckout("errors.invalidPhone"));
      return;
    }

    const trimmedEmail = formData.customerEmail.trim();
    if (!trimmedEmail) {
      setErrorMessage(tCheckout("errors.emailRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage(tCheckout("errors.invalidEmail"));
      return;
    }

    if (!formData.area.trim()) {
      setErrorMessage(tCheckout("errors.areaRequired"));
      return;
    }

    if (!formData.zone.trim()) {
      setErrorMessage(tCheckout("errors.zoneRequired"));
      return;
    }

    if (!formData.street.trim()) {
      setErrorMessage(tCheckout("errors.streetRequired"));
      return;
    }

    if (!formData.building.trim()) {
      setErrorMessage(tCheckout("errors.buildingRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCodOrder({
        customerName: formData.customerName.trim(),
        customerPhone: phoneDigits,
        customerEmail: trimmedEmail || undefined,
        area: formData.area.trim(),
        zone: formData.zone.trim() || undefined,
        street: formData.street.trim() || undefined,
        building: formData.building.trim() || undefined,
        deliveryNotes: formData.deliveryNotes.trim() || undefined,
        items: activeItems,
        locale,
      });

      if (result.success && result.orderReference) {
        setIsSuccess(true);
        try {
          sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          if (isDirect) {
            sessionStorage.removeItem("direct_checkout_item");
          }
        } catch {}

        if (isDirect) {
          router.push(`/order-success/${result.orderReference}?direct=1`);
        } else {
          router.push(`/order-success/${result.orderReference}`);
        }
      } else {
        setErrorMessage(result.error || tCheckout("errors.orderFailed"));
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage(tCheckout("errors.connectionError"));
      setIsSubmitting(false);
    }
  };

  // While hydration/loading is pending or while order redirection is in-flight, show loading state
  if (!isReady || ((isSubmitting || isSuccess) && activeItems.length === 0)) {
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
            <p className="text-xs font-semibold text-neutral-500">
              {isSuccess ? tCheckout("redirectingToOrder") : tCheckout("preparingCheckout")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Empty State
  if (activeItems.length === 0 && !isSubmitting && !isSuccess) {
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
          <div className="text-center max-w-md p-8 bg-white rounded-3xl border border-neutral-200 shadow-xs">
            <Banknote className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-800">
              {isDirect ? tCheckout("emptyDirectTitle") : tCheckout("emptyCartTitle")}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 mb-6">
              {isDirect ? tCheckout("emptyDirectDesc") : tCheckout("emptyCartDesc")}
            </p>
            <Link
              href="/"
              className="inline-flex px-6 py-3 rounded-xl bg-[#8A1538] text-white text-xs font-semibold hover:bg-[#700f2c]"
            >
              {tCheckout("browseDealsNow")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60">
      {/* Checkout Navbar */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Suspense fallback={null}>
              <LanguageSwitcher variant="subtle" />
            </Suspense>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{tCheckout("secureBadge")}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 md:py-12 w-full">
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Start Column: Customer & Delivery Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Information Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-[#8A1538] shrink-0" />
                <span>{tCheckout("customerInfoTitle")}</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                    {tCheckout("fullName")} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    placeholder={tCheckout("fullNamePlaceholder")}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      {tCheckout("phone")} <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        dir="ltr"
                        required
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerPhone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder={tCheckout("phonePlaceholder")}
                        className="w-full ps-4 pe-10 py-3 rounded-xl border border-neutral-300 text-sm rtl:text-right focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/10"
                      />
                      <Phone className="w-4 h-4 text-neutral-400 absolute end-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      {tCheckout("email")} <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        dir="ltr"
                        required
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, customerEmail: e.target.value })
                        }
                        placeholder={tCheckout("emailPlaceholder")}
                        className="w-full ps-4 pe-10 py-3 rounded-xl border border-neutral-300 text-sm rtl:text-right focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/10"
                      />
                      <Mail className="w-4 h-4 text-neutral-400 absolute end-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Card (Qatar Standard) */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#8A1538] shrink-0" />
                <span>{tCheckout("deliveryDetails")}</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                    {tCheckout("area")} <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538] bg-white"
                  >
                    {QATAR_AREA_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {tCheckout(`areas.${opt.key}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      {tCheckout("zone")} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zone}
                      onChange={(e) =>
                        setFormData({ ...formData, zone: e.target.value })
                      }
                      placeholder={tCheckout("zonePlaceholder")}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      {tCheckout("street")} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.street}
                      onChange={(e) =>
                        setFormData({ ...formData, street: e.target.value })
                      }
                      placeholder={tCheckout("streetPlaceholder")}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      {tCheckout("building")} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.building}
                      onChange={(e) =>
                        setFormData({ ...formData, building: e.target.value })
                      }
                      placeholder={tCheckout("buildingPlaceholder")}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                    {tCheckout("notes")}{" "}
                    <span className="text-neutral-400 font-normal lowercase">
                      {tCheckout("optional")}
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.deliveryNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryNotes: e.target.value })
                    }
                    placeholder={tCheckout("notesPlaceholder")}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Info */}
            <div className="p-5 rounded-2xl bg-[#8A1538]/5 border border-[#8A1538]/20 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#8A1538] text-white flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-900">
                  {tCheckout("codTitle")}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {tCheckout("codDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* End Column: Order Review & Submit */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs space-y-5 lg:sticky lg:top-8">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                  {tCheckout("orderReviewCount", { count: activeItems.length })}
                </h2>
                {isDirect && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                    <span>{tCheckout("directBuy")}</span>
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto pe-1">
                {activeItems.map((it) => {
                  const displayName = resolveTextField(
                    it.productName,
                    it.productNameAr,
                    locale
                  ).value;
                  const displayVariant = resolveTextField(
                    it.variantName,
                    it.variantNameAr,
                    locale,
                    { optional: true }
                  ).resolvedValue;

                  return (
                    <div
                      key={`${it.productId}-${it.variantId || "default"}`}
                      className="py-3 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex-1 pe-2 min-w-0">
                        <p className="font-bold text-neutral-800 line-clamp-1">
                          {displayName}
                        </p>
                        <p className="text-neutral-500 text-[11px]">
                          {displayVariant ? `${displayVariant} × ` : ""}
                          {tCheckout("qtyLabel", { count: it.quantity })}
                        </p>
                      </div>
                      <span className="font-bold text-neutral-900 shrink-0 font-mono">
                        {formatPrice(it.price * it.quantity, locale, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-neutral-100 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">{tCheckout("subtotal")}</span>
                  <span className="font-bold text-neutral-900 font-mono">
                    {formatPrice(subtotal, locale, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">{tCheckout("deliveryFee")}</span>
                  <span
                    className={`font-bold font-mono ${
                      deliveryFee === 0 ? "text-emerald-600" : "text-neutral-900"
                    }`}
                  >
                    {deliveryFee === 0
                      ? tCheckout("free")
                      : formatPrice(deliveryFee, locale, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-base sm:text-lg">
                  <span className="font-bold text-neutral-900">
                    {tCheckout("totalPayable")}
                  </span>
                  <span className="font-black text-[#8A1538] font-mono">
                    {formatPrice(total, locale, currency)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Order Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-[#8A1538] hover:bg-[#700f2c] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <span>{tCheckout("placingOrder")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{tCheckout("placeOrder")}</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>{tCheckout("deliveryEta")}</span>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function CheckoutLoadingFallback() {
  const tCheckout = useTranslations("checkout");
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Logo size="md" />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#8A1538] mx-auto mb-3" />
          <p className="text-xs font-semibold text-neutral-500">
            {tCheckout("preparingCheckout")}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoadingFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}
