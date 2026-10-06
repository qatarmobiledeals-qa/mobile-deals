import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings, getCategories } from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { CategoryNav } from "@/components/store/category-nav";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { Lock, Shield, Eye, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Mobile Deals Qatar",
  description:
    "Privacy Policy for Mobile Deals Qatar. Learn how we protect your personal information, contact data, and order details.",
  alternates: {
    canonical: "https://mobiledealsqa.com/privacy-policy",
  },
};

export const revalidate = 60;

export default async function PrivacyPolicyPage() {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar items={settings.announcement_bar?.items} />
      <MainNavbar
        whatsappNumber={settings.whatsapp_number}
        currency={settings.currency}
      />
      <CategoryNav categories={categories} />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:py-12 md:py-16 w-full">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-1.5 h-6 bg-[#8A1538] rounded-full inline-block" />
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Privacy Policy
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500">
            Last updated: September 2026. Your privacy and data security are our top priorities.
          </p>
        </div>

        {/* Content sections */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xs text-neutral-700 text-xs sm:text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#8A1538]" />
              1. Information We Collect
            </h2>
            <p>
              When you place an order or contact us via WhatsApp or service enquiry on Mobile Deals Qatar, we collect necessary contact information including your full name, phone number, delivery address (zone, street, building), and optional email address to process and fulfill your order.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#8A1538]" />
              2. How We Use Your Information
            </h2>
            <p>
              Your personal information is strictly used for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li>Confirming and fulfilling your Cash on Delivery orders across Qatar.</li>
              <li>Providing real-time order status updates and delivery coordination via WhatsApp.</li>
              <li>Responding to warranty, maintenance, or product support inquiries.</li>
              <li>Improving customer service and website performance.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#8A1538]" />
              3. Data Protection &amp; Confidentiality
            </h2>
            <p>
              We do not sell, rent, or trade your personal data to third parties. Your address and contact numbers are only shared with our authorized Qatar delivery couriers solely for fulfilling your package.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#8A1538]" />
              4. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or wish to update your details, please reach out to our team at{" "}
              <a href={`mailto:${settings.store_email}`} className="text-[#8A1538] font-semibold underline">
                {settings.store_email}
              </a>{" "}
              or message our WhatsApp care line.
            </p>
          </section>
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
