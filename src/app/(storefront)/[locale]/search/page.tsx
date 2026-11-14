import React from "react";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { searchProducts, getSiteSettings, getFeaturedProducts } from "@/lib/data";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MainNavbar } from "@/components/store/main-navbar";
import { ProductCard } from "@/components/store/product-card";
import { Footer } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { PackageOpen } from "lucide-react";

interface SearchPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const [{ locale }, { q }] = await Promise.all([params, searchParams]);
  const tSearch = await getTranslations({ locale, namespace: "search" });
  const baseUrl = "https://mobiledealsqa.com";
  const trimmedQ = q?.trim() || "";

  return {
    title: trimmedQ
      ? tSearch("metaTitleWithQuery", { query: trimmedQ })
      : tSearch("metaTitleDefault"),
    alternates: {
      canonical: `${baseUrl}/${locale}/search`,
      languages: {
        en: `${baseUrl}/en/search`,
        ar: `${baseUrl}/ar/search`,
        "x-default": `${baseUrl}/en/search`,
      },
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const [{ locale }, { q = "" }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const [products, settings, featuredDeals, tSearch] = await Promise.all([
    searchProducts(q),
    getSiteSettings(),
    getFeaturedProducts(),
    getTranslations({ locale, namespace: "search" }),
  ]);

  const relatedProducts = (featuredDeals || []).slice(0, 4);
  const trimmedQ = q.trim();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar
        items={settings.announcement_bar?.items}
        itemsAr={settings.announcement_bar?.items_ar}
        currency={settings.currency}
      />
      <MainNavbar
        whatsappNumber={settings.whatsapp_number}
        currency={settings.currency}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 md:py-12 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-[#8A1538] rounded-full inline-block" />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              {tSearch("heading")}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {trimmedQ
              ? products.length === 1
                ? tSearch("showingResultsSingular", {
                    count: products.length,
                    query: trimmedQ,
                  })
                : tSearch("showingResultsPlural", {
                    count: products.length,
                    query: trimmedQ,
                  })
              : tSearch("enterKeyword")}
          </p>
        </div>

        {products.length === 0 ? (
          <div>
            <div className="text-center py-10 px-4 rounded-3xl bg-neutral-50 border border-dashed border-neutral-200 mb-10">
              <PackageOpen className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
              <h3 className="text-lg font-bold text-neutral-800">
                {trimmedQ
                  ? tSearch("noExactMatchesFor", { query: trimmedQ })
                  : tSearch("searchCatalogPrompt")}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-4">
                {tSearch("relatedTechDeals")}
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center px-5 py-2.5 bg-[#8A1538] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#720e2c] transition-colors"
              >
                {tSearch("browseShopCatalog")}
              </Link>
            </div>

            {relatedProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-5 bg-[#8A1538] rounded-full inline-block" />
                  <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                    {tSearch("relatedProductsYouMightLike")}
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {relatedProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      currency={settings.currency}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                currency={settings.currency}
              />
            ))}
          </div>
        )}
      </main>

      <Footer
        whatsappNumber={settings.whatsapp_number}
        storeEmail={settings.store_email}
      />
      <MobileBottomNav whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}
