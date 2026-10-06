import React from "react";
import { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { ServiceEnquiryForm } from "@/components/store/service-enquiry-form";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "Service Enquiry & Technical Support | Mobile Deals Qatar",
  description:
    "Request device repair, warranty inspection, product maintenance, and genuine replacement parts across Qatar. Connect directly with our certified technical support team on WhatsApp.",
  alternates: {
    canonical: "https://mobiledealsqa.com/service-enquiry",
  },
};

export const revalidate = 60;

export default async function ServiceEnquiryPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50">
      {/* 1. Announcement Bar */}
      <AnnouncementBar items={settings.announcement_bar?.items} />

      {/* 2. Main Sticky Navbar */}
      <MainNavbar
        whatsappNumber={settings.whatsapp_number}
        currency={settings.currency}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:py-12 md:py-16 w-full">
        <ServiceEnquiryForm
          whatsappNumber={settings.whatsapp_number}
          storeEmail={settings.store_email}
        />
      </main>

      {/* 4. Store Footer */}
      <Footer
        whatsappNumber={settings.whatsapp_number}
        storeEmail={settings.store_email}
      />

      {/* 6. Sticky Mobile Navigation */}
      <MobileBottomNav whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}
