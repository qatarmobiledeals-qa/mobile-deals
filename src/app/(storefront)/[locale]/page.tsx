import React from "react";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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

// Cached for 24 hours to prevent Vercel ISR write limit exhaustion during ad campaigns.
// Updates occur automatically on admin changes via on-demand revalidatePath.
export const revalidate = 86400; // 24 hours

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const baseUrl = "https://mobiledealsqa.com";
  const [tMeta, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "metadata" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return {
    title: {
      absolute: tMeta("siteTitle"),
    },
    description: tMeta("siteDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        ar: `${baseUrl}/ar`,
        "x-default": `${baseUrl}/en`,
      },
    },
    openGraph: {
      title: tMeta("homeTitle"),
      description: tMeta("homeDescription"),
      url: `${baseUrl}/${locale}`,
      locale: isArabic ? "ar_QA" : "en_QA",
      type: "website",
      images: [
        {
          url: "https://mobiledealsqa.com/fav-icon.png",
          alt: tCommon("storeNameQatar"),
          width: 512,
          height: 512,
        },
      ],
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const baseUrl = "https://mobiledealsqa.com";

  // Efficient parallel data fetching: single round-trip execution
  const [categories, banners, bestDeals, todayDeals, featuredProducts, settings, tMeta, tCommon] =
    await Promise.all([
      getCategories(),
      getBanners(),
      getBestDeals(),
      getTodayDeals(),
      getFeaturedProducts(),
      getSiteSettings(),
      getTranslations({ locale, namespace: "metadata" }),
      getTranslations({ locale, namespace: "common" }),
    ]);

  const localizedStoreName = tCommon("storeNameQatar");
  const localizedDescription = tMeta("siteDescription");

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: localizedStoreName,
    url: `${baseUrl}/${locale}`,
    logo: "https://mobiledealsqa.com/fav-icon.png",
    description: localizedDescription,
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
    name: localizedStoreName,
    url: `${baseUrl}/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/${locale}/search?q={search_term_string}`,
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
      <AnnouncementBar
        items={settings.announcement_bar?.items}
        itemsAr={settings.announcement_bar?.items_ar}
        currency={settings.currency}
      />

      {/* 2. Main Sticky Navbar */}
      <MainNavbar
        whatsappNumber={settings.whatsapp_number}
        currency={settings.currency}
      />

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
