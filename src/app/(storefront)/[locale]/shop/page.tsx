import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllProducts, getCategories, getBrands, getSiteSettings } from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { CategoryNav } from "@/components/store/category-nav";
import { ShopCatalogClient } from "@/components/store/shop-catalog-client";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { Loader2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const baseUrl = "https://mobiledealsqa.com";
  const tShop = await getTranslations({ locale, namespace: "shop" });

  const title = tShop("metaTitle");
  const description = tShop("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/shop`,
      languages: {
        en: `${baseUrl}/en/shop`,
        ar: `${baseUrl}/ar/shop`,
        "x-default": `${baseUrl}/en/shop`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/shop`,
      locale: isArabic ? "ar_QA" : "en_QA",
      type: "website",
    },
  };
}

export const revalidate = 86400; // 24 hours (prevents ISR write spikes under Meta ad traffic)

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, categories, brands, settings, tCommon] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getBrands(),
    getSiteSettings(),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
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

      {/* 3. Horizontal Category Navigation Bar */}
      <CategoryNav categories={categories} />

      {/* 4. Interactive Shop Catalog with Full Filter Section */}
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#8A1538]" />
              <p className="text-xs font-semibold text-neutral-500">{tCommon("loadingCatalog")}</p>
            </div>
          }
        >
          <ShopCatalogClient
            initialProducts={products}
            categories={categories}
            brands={brands}
            currency={settings.currency}
          />
        </Suspense>
      </main>

      {/* 5. Footer */}
      <Footer
        whatsappNumber={settings.whatsapp_number}
        storeEmail={settings.store_email}
        categories={categories}
      />

      {/* 7. Mobile Sticky Bottom Nav */}
      <MobileBottomNav whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}
