import React, { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getCategories, getBrands, getSiteSettings } from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { CategoryNav } from "@/components/store/category-nav";
import { ShopCatalogClient } from "@/components/store/shop-catalog-client";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { Loader2 } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((cat) => ({ slug: cat.slug }));
  } catch {
    return [];
  }
}

function findCategory(categories: any[], slugParam: string) {
  if (!slugParam) return undefined;
  const decoded = decodeURIComponent(slugParam).trim().toLowerCase();
  
  // 1. Exact match (case-insensitive)
  let cat = categories.find((c) => c.slug.toLowerCase() === decoded);
  if (cat) return cat;

  // 2. Normalized kebab-case match
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const normalized = normalize(decoded);
  cat = categories.find((c) => normalize(c.slug) === normalized || normalize(c.name) === normalized);
  if (cat) return cat;

  // 3. Fallback aliases (e.g. mobile, tablet, mobile-tablet, mobile-and-tablet)
  if (
    normalized === "mobile" ||
    normalized === "mobiles" ||
    normalized === "tablet" ||
    normalized === "tablets" ||
    normalized === "mobile-tablet" ||
    normalized === "mobile-and-tablet" ||
    normalized === "smartphones"
  ) {
    cat = categories.find((c) => {
      const s = c.slug.toLowerCase();
      const n = c.name.toLowerCase();
      return s.includes("mobile") || n.includes("mobile");
    });
  }

  return cat;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = findCategory(categories, slug);
  if (!category) return { title: "Category Not Found" };
  const baseUrl = "https://mobiledealsqa.com";
  const canonicalUrl = `${baseUrl}/categories/${category.slug}`;
  const title = `${category.name} in Qatar | Mobile Deals Qatar`;
  const description = category.description || `Shop the best ${category.name} in Qatar at Mobile Deals. Genuine products, unbeatable prices, and Cash on Delivery nationwide.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title, description, url: canonicalUrl, type: "website",
      images: category.image_url ? [{ url: category.image_url, alt: category.name }] : [],
    },
  };
}

export const revalidate = 60;

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [products, categories, brands, settings] = await Promise.all([
    getAllProducts(), getCategories(), getBrands(), getSiteSettings(),
  ]);
  const category = findCategory(categories, slug);
  if (!category) notFound();

  const categoryUrl = `https://mobiledealsqa.com/categories/${category.slug}`;

  // BreadcrumbList Structured Data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://mobiledealsqa.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: "https://mobiledealsqa.com/shop",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: categoryUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AnnouncementBar items={settings.announcement_bar?.items} />
      <MainNavbar whatsappNumber={settings.whatsapp_number} currency={settings.currency} />
      <CategoryNav categories={categories} />
      <main className="flex-1">
        <Suspense fallback={<div className="flex flex-col items-center justify-center py-24 gap-3"><Loader2 className="w-8 h-8 animate-spin text-[#8A1538]" /><p className="text-xs font-semibold text-neutral-500">Loading catalog...</p></div>}>
          <ShopCatalogClient
            initialProducts={products}
            categories={categories}
            brands={brands}
            currency={settings.currency}
            initialCategory={category.slug}
            initialCategoryName={category.name}
          />
        </Suspense>
      </main>
      <Footer whatsappNumber={settings.whatsapp_number} storeEmail={settings.store_email} categories={categories} />
      <MobileBottomNav whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}