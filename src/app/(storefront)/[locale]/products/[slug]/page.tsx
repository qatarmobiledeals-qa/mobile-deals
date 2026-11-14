import React from "react";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProductBySlug, getSiteSettings, getAllProducts } from "@/lib/data";
import { resolveProductContent } from "@/lib/i18n/content-resolver";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductDetailsClient } from "@/components/store/product-details-client";

import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { ProductSpecTabs } from "@/components/store/product-spec-tabs";
import { ChevronRight } from "lucide-react";

interface ProductPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export const revalidate = 86400; // 24 hours (protects Vercel CPU & Supabase from Meta Ads traffic spikes)

export async function generateStaticParams() {
  try {
    const products = await getAllProducts();
    // Linux filesystem NAME_MAX is 255 bytes. Suffix .rsc.prerender-config.json is 27 bytes.
    // Filter slugs to <= 120 chars so Vercel Linux builds will never throw ENAMETOOLONG.
    return products
      .filter((p) => p.slug && p.slug.length <= 120)
      .map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [product, tProduct, tCommon] = await Promise.all([
    getProductBySlug(slug),
    getTranslations({ locale, namespace: "product" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  if (!product) {
    return {
      title: tProduct("productNotFound"),
    };
  }

  const isArabic = locale === "ar";
  const resolvedProduct = resolveProductContent(product, locale);
  const name = resolvedProduct.displayName;
  const shortDesc = resolvedProduct.displayShortDescription;

  const primaryImgObj =
    resolvedProduct.product_images?.find((img) => img.is_primary) ||
    resolvedProduct.product_images?.[0];
  const primaryImage = primaryImgObj?.image_url;
  const primaryImageAlt = primaryImgObj?.displayAltText || name;

  const baseUrl = "https://mobiledealsqa.com";
  const canonicalUrl = `${baseUrl}/${locale}/products/${product.slug}`;

  const metaTitle = tProduct("metaTitleSuffix", { name });
  const metaDesc = shortDesc || tProduct("metaDescFallback", { name });

  return {
    title: metaTitle,
    description: metaDesc,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${baseUrl}/en/products/${product.slug}`,
        ar: `${baseUrl}/ar/products/${product.slug}`,
        "x-default": `${baseUrl}/en/products/${product.slug}`,
      },
    },
    openGraph: {
      title: `${name} | ${tCommon("storeNameQatar")}`,
      description: metaDesc,
      url: canonicalUrl,
      locale: isArabic ? "ar_QA" : "en_QA",
      type: "website",
      images: primaryImage ? [{ url: primaryImage, alt: primaryImageAlt }] : [],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: metaTitle,
      description: metaDesc,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [product, settings, tNav, tCommon] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  if (!product) {
    notFound();
  }

  const resolvedProduct = resolveProductContent(product, locale);
  const primaryImage =
    resolvedProduct.product_images?.find((img) => img.is_primary)?.image_url ||
    resolvedProduct.product_images?.[0]?.image_url;

  const baseUrl = "https://mobiledealsqa.com";
  const productUrl = `${baseUrl}/${locale}/products/${product.slug}`;

  // JSON-LD Structured Data for Google Product Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: resolvedProduct.displayName,
    description:
      resolvedProduct.displayDescription ||
      resolvedProduct.displayShortDescription ||
      resolvedProduct.displayName,
    image: primaryImage ? [primaryImage] : [],
    url: productUrl,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: resolvedProduct.displayBrandName || tCommon("brandName"),
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: settings.currency || "QAR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: tCommon("storeNameQatar"),
      },
    },
  };

  // BreadcrumbList Structured Data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: tNav("home"),
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tNav("shop"),
        item: `${baseUrl}/${locale}/shop`,
      },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: resolvedProduct.displayCategoryName,
              item: `${baseUrl}/${locale}/categories/${product.category.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: resolvedProduct.displayName,
              item: productUrl,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: resolvedProduct.displayName,
              item: productUrl,
            },
          ]),
    ],
  };

  // Filter out internal gift/admin keys from the public-facing specs table
  const INTERNAL_SPEC_KEYS = new Set(["gift_enabled", "gift_image"]);
  const specs = Object.fromEntries(
    Object.entries((product.specifications || {}) as Record<string, string>).filter(
      ([key]) => !INTERNAL_SPEC_KEYS.has(key)
    )
  );
  const specsAr = product.specifications_ar
    ? Object.fromEntries(
        Object.entries(product.specifications_ar as Record<string, string>).filter(
          ([key]) => !INTERNAL_SPEC_KEYS.has(key)
        )
      )
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-white w-full max-w-full overflow-x-hidden">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <AnnouncementBar
        items={settings.announcement_bar?.items}
        itemsAr={settings.announcement_bar?.items_ar}
        currency={settings.currency}
      />
      <MainNavbar
        whatsappNumber={settings.whatsapp_number}
        currency={settings.currency}
      />

      {/* Breadcrumbs */}
      <nav
        aria-label={tCommon("breadcrumbAria")}
        className="bg-neutral-50/80 border-b border-neutral-200/80 py-2.5 text-xs text-neutral-500 w-full"
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#8A1538] font-medium transition-colors shrink-0">
            {tNav("home")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0 rtl:rotate-180" />
          {product.category && (
            <>
              <Link
                href={`/categories/${product.category.slug}`}
                className="hover:text-[#8A1538] font-medium transition-colors shrink-0"
              >
                {resolvedProduct.displayCategoryName}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0 rtl:rotate-180" />
            </>
          )}
          <span className="text-neutral-900 font-semibold truncate max-w-[140px] sm:max-w-xs">
            {resolvedProduct.displayName}
          </span>
        </div>
      </nav>

      {/* Product Content Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-4 sm:py-6 lg:py-8 w-full min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start w-full">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20 w-full min-w-0">
            <ProductGallery
              images={product.product_images}
              productName={resolvedProduct.displayName}
            />
          </div>

          {/* Right Column: Information & Checkout Options */}
          <div className="lg:col-span-7 xl:col-span-7 w-full min-w-0">
            <ProductDetailsClient
              product={product}
              whatsappNumber={settings.whatsapp_number}
              currency={settings.currency}
            />
          </div>
        </div>

        {/* Product Details & Specifications — Tabbed Layout */}
        <ProductSpecTabs
          description={product.description}
          descriptionAr={product.description_ar}
          shortDescription={product.short_description}
          shortDescriptionAr={product.short_description_ar}
          productName={product.name}
          productNameAr={product.name_ar}
          brandName={product.brand?.name}
          brandNameAr={product.brand?.name_ar}
          categoryName={product.category?.name}
          categoryNameAr={product.category?.name_ar}
          warranty={product.warranty}
          warrantyAr={product.warranty_ar}
          whatsappNumber={settings.whatsapp_number}
          specs={specs}
          specsAr={specsAr}
        />
      </main>


      <Footer
        whatsappNumber={settings.whatsapp_number}
        storeEmail={settings.store_email}
      />
      <MobileBottomNav whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}
