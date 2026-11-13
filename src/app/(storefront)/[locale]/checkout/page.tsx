"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/types/database";
import { createCodOrder } from "@/app/actions/order";
import { Logo } from "@/components/ui/logo";
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

const POPULAR_QATAR_AREAS = [
  "Doha - Al Sadd",
  "Doha - West Bay",
  "Doha - The Pearl Qatar",
  "Lusail City",
  "Doha - Al Dafna",
  "Al Rayyan",
  "Al Wakrah",
  "Al Khor",
  "Doha - Al Mansoura",
  "Doha - Al Hilal",
  "Doha - Madinat Khalifa",
  "Doha - Abu Hamour",
  "Doha - Al Waab",
  "Doha - Bin Mahmoud",
  "Umm Salal",
  "Al Shahaniya",
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDirect = searchParams.get("direct") === "1";

  const { items: cartItems, deliveryFee, isHydrated } = useCart();
  const [directItems, setDirectItems] = useState<CartItem[]>([]);
  const [directLoaded, setDirectLoaded] = useState(!isDirect);

  // Load direct single-item buy payload from sessionStorage
  useEffect(() => {
    if (isDirect) {
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
    }
  }, [isDirect]);

  // Determine active items for this checkout session
  const activeItems: CartItem[] = isDirect ? directItems : cartItems;
  const isReady = isDirect ? directLoaded : isHydrated;

  const subtotal = activeItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + deliveryFee;

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    area: POPULAR_QATAR_AREAS[0],
    zone: "",
    street: "",
    building: "",
    deliveryNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeItems.length === 0) {
      setErrorMessage(
        isDirect
          ? "No product selected for direct checkout."
          : "Your cart is empty. Please add products first."
      );
      return;
    }

    if (!formData.customerName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!formData.customerPhone.trim()) {
      setErrorMessage("Please enter your mobile phone number.");
      return;
    }

    if (!formData.customerEmail.trim()) {
      setErrorMessage("Please enter your email address for order confirmation.");
      return;
    }

    if (!formData.area.trim()) {
      setErrorMessage("Please select your municipality/area.");
      return;
    }

    if (!formData.zone.trim()) {
      setErrorMessage("Please enter your Zone number.");
      return;
    }

    if (!formData.street.trim()) {
      setErrorMessage("Please enter your Street or Road name.");
      return;
    }

    if (!formData.building.trim()) {
      setErrorMessage("Please enter your Building or Villa number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCodOrder({
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        area: formData.area.trim(),
        zone: formData.zone.trim() || undefined,
        street: formData.street.trim() || undefined,
        building: formData.building.trim() || undefined,
        deliveryNotes: formData.deliveryNotes.trim() || undefined,
        items: activeItems,
      });

      if (result.success && result.orderReference) {
        setIsSuccess(true);
        if (isDirect) {
          try {
            sessionStorage.removeItem("direct_checkout_item");
          } catch {}
          router.push(`/order-success/${result.orderReference}?direct=1`);
        } else {
          router.push(`/order-success/${result.orderReference}`);
        }
      } else {
        setErrorMessage(
          result.error || "Unable to place order. Please check your details."
        );
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage("Connection error. Please try again.");
      setIsSubmitting(false);
    }
  };

  // While hydration/loading is pending or while order redirection is in-flight, show loading state
  if (!isReady || ((isSubmitting || isSuccess) && activeItems.length === 0)) {
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
              {isSuccess ? "Redirecting to your order confirmation..." : "Preparing secure checkout..."}
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
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Logo size="md" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md p-8 bg-white rounded-3xl border border-neutral-200 shadow-xs">
            <Banknote className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-800">
              {isDirect ? "No Direct Product Selected" : "Your Cart is Empty"}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 mb-6">
              {isDirect
                ? "Please choose a product to purchase with Cash on Delivery."
                : "You cannot proceed to checkout with an empty cart."}
            </p>
            <Link
              href="/"
              className="inline-flex px-6 py-3 rounded-xl bg-[#8A1538] text-white text-xs font-semibold hover:bg-[#700f2c]"
            >
              Browse Deals Now
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Cash on Delivery Checkout</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 md:py-12 w-full">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer & Delivery Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Information Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-[#8A1538]" />
                Customer Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    placeholder="e.g. Mohammed Al-Kuwari"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      Qatar Phone Number <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerPhone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="e.g. 55000000 or 33000000"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/10"
                      />
                      <Phone className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, customerEmail: e.target.value })
                        }
                        placeholder="receipt@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538] focus:ring-2 focus:ring-[#8A1538]/10"
                      />
                      <Mail className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Card (Qatar Standard) */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#8A1538]" />
                Delivery Address (Qatar)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                    Municipality / Area <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538] bg-white"
                  >
                    {POPULAR_QATAR_AREAS.map((ar) => (
                      <option key={ar} value={ar}>
                        {ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      Zone No. <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zone}
                      onChange={(e) =>
                        setFormData({ ...formData, zone: e.target.value })
                      }
                      placeholder="e.g. Zone 24"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      Street / Road <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.street}
                      onChange={(e) =>
                        setFormData({ ...formData, street: e.target.value })
                      }
                      placeholder="e.g. Suhaim Bin Hamad"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                      Building / Villa No. <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.building}
                      onChange={(e) =>
                        setFormData({ ...formData, building: e.target.value })
                      }
                      placeholder="e.g. Villa 12"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-[#8A1538]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 tracking-wider mb-1.5">
                    Delivery Instructions / Landmark Notes <span className="text-neutral-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.deliveryNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryNotes: e.target.value })
                    }
                    placeholder="Near landmark, call before arrival, gate code, etc."
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
                  Cash on Delivery (COD)
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Pay securely with cash or card upon receiving your package directly at your door in Qatar. No upfront online card payment required.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Submit */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs space-y-5 lg:sticky lg:top-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                  Order Review ({activeItems.length} {activeItems.length === 1 ? "item" : "items"})
                </h2>
                {isDirect && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                    Direct Buy
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto pr-1">
                {activeItems.map((it) => (
                  <div
                    key={`${it.productId}-${it.variantId || "default"}`}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-neutral-800 line-clamp-1">
                        {it.productName}
                      </p>
                      <p className="text-neutral-500 text-[11px]">
                        {it.variantName ? `${it.variantName} × ` : ""}Qty: {it.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-neutral-900 shrink-0 font-mono">
                      QAR {(it.price * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-neutral-100 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-bold text-neutral-900 font-mono">QAR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-base sm:text-lg">
                  <span className="font-bold text-neutral-900">Total Payable</span>
                  <span className="font-black text-[#8A1538] font-mono">
                    QAR {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Order Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-[#8A1538] hover:bg-[#700f2c] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirming Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm Cash on Delivery Order</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Delivered anywhere in Qatar within 24 to 48 hours</span>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
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
                Preparing secure checkout...
              </p>
            </div>
          </main>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
