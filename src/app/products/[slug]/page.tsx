import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getSiteSettings } from "@/lib/data";
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
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.image_url ||
    product.product_images?.[0]?.image_url;

  const baseUrl = "https://mobiledealsqa.com";
  const canonicalUrl = `${baseUrl}/products/${product.slug}`;

  const metaTitle = `${product.name} | Best Price in Qatar`;
  const metaDesc =
    product.short_description ||
    `Buy ${product.name} at Mobile Deals Qatar with Cash on Delivery and fast doorstep shipping.`;

  return {
    title: metaTitle,
    description: metaDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} | Mobile Deals Qatar`,
      description:
        product.short_description || `Buy ${product.name} in Qatar at the best price.`,
      url: canonicalUrl,
      type: "website",
      images: primaryImage ? [{ url: primaryImage, alt: product.name }] : [],
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
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);

  if (!product) {
    notFound();
  }

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.image_url ||
    product.product_images?.[0]?.image_url;

  const productUrl = `https://mobiledealsqa.com/products/${product.slug}`;

  // JSON-LD Structured Data for Google Product Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.short_description || product.name,
    image: primaryImage ? [primaryImage] : [],
    url: productUrl,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || "Mobile Deals",
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
        name: "Mobile Deals Qatar",
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
        name: "Home",
        item: "https://mobiledealsqa.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: "https://mobiledealsqa.com/shop",
      },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category.name,
              item: `https://mobiledealsqa.com/categories/${product.category.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: product.name,
              item: productUrl,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: product.name,
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

      <AnnouncementBar items={settings.announcement_bar?.items} />
      <MainNavbar whatsappNumber={settings.whatsapp_number} />

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="bg-neutral-50/80 border-b border-neutral-200/80 py-2.5 text-xs text-neutral-500 w-full"
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#8A1538] font-medium transition-colors shrink-0">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          {product.category && (
            <>
              <Link
                href={`/categories/${product.category.slug}`}
                className="hover:text-[#8A1538] font-medium transition-colors shrink-0"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            </>
          )}
          <span className="text-neutral-900 font-semibold truncate max-w-[140px] sm:max-w-xs">
            {product.name}
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
              productName={product.name}
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
          shortDescription={product.short_description}
          productName={product.name}
          brandName={product.brand?.name}
          categoryName={product.category?.name}
          warranty={product.warranty}
          whatsappNumber={settings.whatsapp_number}
          specs={specs}
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
