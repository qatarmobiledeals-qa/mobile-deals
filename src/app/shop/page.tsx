import React, { Suspense } from "react";
import { Metadata } from "next";
import { getAllProducts, getCategories, getBrands, getSiteSettings } from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { CategoryNav } from "@/components/store/category-nav";
import { ShopCatalogClient } from "@/components/store/shop-catalog-client";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop | Mobile Deals Qatar",
  description:
    "Explore our complete collection of smartphones, tablets, laptops, accessories, and exclusive Qatar deals. Filter by category, brand, price, and special offers with fast delivery across Qatar.",
  alternates: {
    canonical: "https://mobiledealsqa.com/shop",
  },
  openGraph: {
    title: "Shop All Tech Deals | Mobile Deals Qatar",
    description:
      "Browse smartphones, earphones, chargers, and mobile accessories with Cash on Delivery in Qatar.",
    url: "https://mobiledealsqa.com/shop",
    type: "website",
  },
};

export const revalidate = 60; // ISR cache 60 seconds

export default async function ShopPage() {
  const [products, categories, brands, settings] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getBrands(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Top Announcement Bar */}
      <AnnouncementBar items={settings.announcement_bar?.items} />

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
              <p className="text-xs font-semibold text-neutral-500">Loading catalog...</p>
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
