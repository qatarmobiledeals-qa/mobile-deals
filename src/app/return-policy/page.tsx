import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings, getCategories } from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { CategoryNav } from "@/components/store/category-nav";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import {
  RotateCcw,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Phone,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Return Policy | Mobile Deals Qatar",
  description:
    "Official Return Policy for Mobile Deals Qatar. Learn about our 7-day return guidelines and special return conditions for mobile phones.",
  alternates: {
    canonical: "https://mobiledealsqa.com/return-policy",
  },
};

export const revalidate = 60;

export default async function ReturnPolicyPage() {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  const whatsappCleanNumber = (settings.whatsapp_number || "")
    .replace(/[^0-9]/g, "")
    .replace(/^0+/, "");

  const whatsappUrl = `https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
    "Hello Mobile Deals Qatar, I need assistance with a return request."
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <AnnouncementBar items={settings.announcement_bar?.items} />
      <MainNavbar
        whatsappNumber={settings.whatsapp_number}
        currency={settings.currency}
      />
      <CategoryNav categories={categories} />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:py-12 md:py-16 w-full">
        {/* Header */}
        <div className="mb-8 text-left">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-1.5 h-7 bg-[#8A1538] rounded-full inline-block" />
            <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Return Policy
            </h1>
          </div>
          <p className="text-neutral-600 text-xs sm:text-sm mt-2 leading-relaxed max-w-2xl">
            We want you to have a smooth and satisfactory shopping experience. Please review our return policy before placing your order.
          </p>
        </div>

        {/* Content Container */}
        <div className="space-y-6">
          {/* SECTION 1: GENERAL RETURN POLICY */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                1. General Return Policy
              </h2>
            </div>
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed pl-0 sm:pl-13">
              Products are eligible for return within <strong>7 days</strong> from the date of delivery, subject to the applicable return conditions and product-specific restrictions.
            </p>
          </div>

          {/* SECTION 2: SPECIAL RETURN CONDITIONS FOR MOBILE PHONES */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                2. Special Return Conditions for Mobile Phones
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sealed Products Only */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sealed Products Only</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Mobile phones are eligible for return only if they are in their original packaging with the manufacturer’s seal completely intact and unbroken.
                </p>
              </div>

              {/* Opened or Unsealed Products */}
              <div className="bg-rose-50/60 border border-rose-200/80 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs sm:text-sm">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Opened or Unsealed Products</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Mobile phones with opened, broken, or tampered seals, including open-box products, are not eligible for return.
                </p>
              </div>

              {/* Product Condition */}
              <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                  <PackageCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Product Condition</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Eligible products must be returned in their original packaging, with all accessories and included items, in their original condition.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: RETURN ELIGIBILITY & ASSISTANCE */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A1538]/10 text-[#8A1538] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                3. Return Eligibility
              </h2>
            </div>
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
              All return requests are subject to verification and approval in accordance with this policy. Products that do not meet the applicable return conditions may not be accepted.
            </p>

            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                <HelpCircle className="w-4 h-4 text-[#8A1538] shrink-0" />
                <span>For assistance with a return request, please contact our customer support team.</span>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Customer Support WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer
        whatsappNumber={settings.whatsapp_number}
        storeEmail={settings.store_email}
        categories={categories}
      />
      <MobileBottomNav whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}
