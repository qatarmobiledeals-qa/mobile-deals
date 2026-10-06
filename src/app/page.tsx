import React from "react";
import { Metadata } from "next";
import {
  getBanners,
  getCategories,
  getBestDeals,
  getFeaturedProducts,
  getSiteSettings,
  getTodayDeals,
} from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { CategoryNav } from "@/components/store/category-nav";
import { HeroSection } from "@/components/store/hero-section";
import { CategoryGrid } from "@/components/store/category-grid";
import { TodaysDeals } from "@/components/store/todays-deals";
import { FeaturedSection } from "@/components/store/featured-section";
import { TrustBar } from "@/components/store/trust-bar";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";

// Dynamic rendering ensures fresh data while avoiding client-side waterfalls
export const revalidate = 60; // ISR cache 60 seconds

export const metadata: Metadata = {
  alternates: {
    canonical: "https://mobiledealsqa.com",
  },
  openGraph: {
    title: "Mobile Deals Qatar | Best Tech Deals & Cash on Delivery",
    description:
      "Qatar's premier store for mobiles, electronics, smartwatches, accessories and gadgets. Unbeatable prices, 100% genuine tech, Cash on Delivery nationwide.",
    url: "https://mobiledealsqa.com",
    type: "website",
    images: [
      {
        url: "https://mobiledealsqa.com/fav-icon.png",
        alt: "Mobile Deals Qatar",
        width: 512,
        height: 512,
      },
    ],
  },
};

export default async function HomePage() {
  // Efficient parallel data fetching: single round-trip execution
  const [categories, banners, bestDeals, todayDeals, featuredProducts, settings] =
    await Promise.all([
      getCategories(),
      getBanners(),
      getBestDeals(),
      getTodayDeals(),
      getFeaturedProducts(),
      getSiteSettings(),
    ]);


  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Mobile Deals Qatar",
    url: "https://mobiledealsqa.com",
    logo: "https://mobiledealsqa.com/fav-icon.png",
    description:
      "Qatar's premier online destination for mobile phones, electronics, smartwatches, and accessories with Cash on Delivery nationwide.",
    telephone: settings.whatsapp_number || "+97455000000",
    email: settings.store_email || "support@mobiledealsqa.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Doha",
      addressCountry: "QA",
    },
    currenciesAccepted: "QAR",
    paymentAccepted: "Cash, Cash on Delivery",
    priceRange: "$$",
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mobile Deals Qatar",
    url: "https://mobiledealsqa.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://mobiledealsqa.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* 1. Top Announcement Bar */}
      <AnnouncementBar items={settings.announcement_bar?.items} />

      {/* 2. Main Sticky Navbar */}
      <MainNavbar whatsappNumber={settings.whatsapp_number} />

      {/* 3. Horizontal Category Navigation */}
      <CategoryNav categories={categories} />

      {/* 4. Hero Section with Approved Qatar Maroon Design */}
      <HeroSection
        banners={banners}
        whatsappNumber={settings.whatsapp_number}
      />

      {/* 5. Shop by Category (Horizontal Grid) */}
      <CategoryGrid categories={categories} />

      {/* 6. Best Deals Section (Dynamic — only is_best_deal products, max 10) */}
      <TodaysDeals products={bestDeals} currency={settings.currency} />

      {/* 7. Featured Products Collection (if any active) */}
      <FeaturedSection
        products={featuredProducts}
        currency={settings.currency}
      />

      {/* 8. Black Bottom Trust Bar */}
      <TrustBar />

      {/* 9. Store Footer */}
      <Footer
        whatsappNumber={settings.whatsapp_number}
        storeEmail={settings.store_email}
        categories={categories}
      />

      {/* 10. Sticky Mobile Bottom Navigation */}
      <MobileBottomNav whatsappNumber={settings.whatsapp_number} />
    </main>
  );
}
