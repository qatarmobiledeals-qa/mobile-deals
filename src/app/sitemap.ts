import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://mobiledealsqa.com";

export function createLocalizedSitemapEntries(
  path: string,
  lastModified: Date,
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
  priority: number
): MetadataRoute.Sitemap {
  const locales = routing.locales;
  const normalizedSubPath =
    !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

  const languageAlternates: Record<string, string> = Object.fromEntries(
    locales.map((loc) => [loc, `${BASE_URL}/${loc}${normalizedSubPath}`])
  );
  languageAlternates["x-default"] = `${BASE_URL}/${routing.defaultLocale}${normalizedSubPath}`;

  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${normalizedSubPath}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: languageAlternates,
    },
  }));
}

function getLatestDate(updatedAt?: string | null, arabicUpdatedAt?: string | null): Date {
  const ts1 = updatedAt ? new Date(updatedAt).getTime() : 0;
  const ts2 = arabicUpdatedAt ? new Date(arabicUpdatedAt).getTime() : 0;
  const maxTs = Math.max(Number.isFinite(ts1) ? ts1 : 0, Number.isFinite(ts2) ? ts2 : 0);
  return maxTs > 0 ? new Date(maxTs) : new Date();
}

function collectUniqueValidRows<T extends { slug?: string | null }>(
  rows: T[] | null | undefined
): Array<T & { normalizedSlug: string }> {
  const seen = new Set<string>();
  const uniqueRows: Array<T & { normalizedSlug: string }> = [];
  for (const row of rows || []) {
    const normalizedSlug = row.slug?.trim() || "";
    if (!normalizedSlug || normalizedSlug.length > 120 || seen.has(normalizedSlug)) {
      continue;
    }
    seen.add(normalizedSlug);
    uniqueRows.push({ ...row, normalizedSlug });
  }
  return uniqueRows;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  // Fetch active products and categories for sitemap
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at, arabic_updated_at")
      .eq("is_active", true),
    supabase
      .from("categories")
      .select("slug, updated_at, arabic_updated_at")
      .eq("is_active", true),
  ]);

  const productEntries: MetadataRoute.Sitemap = collectUniqueValidRows(products).flatMap((p) =>
    createLocalizedSitemapEntries(
      `/products/${p.normalizedSlug}`,
      getLatestDate(p.updated_at, p.arabic_updated_at),
      "daily",
      0.8
    )
  );

  const categoryEntries: MetadataRoute.Sitemap = collectUniqueValidRows(categories).flatMap((c) =>
    createLocalizedSitemapEntries(
      `/categories/${c.normalizedSlug}`,
      getLatestDate(c.updated_at, c.arabic_updated_at),
      "weekly",
      0.9
    )
  );

  const staticRoutes = [
    { path: "", changeFrequency: "always" as const, priority: 1.0 },
    { path: "/shop", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/privacy-policy", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/return-policy", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/service-enquiry", changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap((r) =>
    createLocalizedSitemapEntries(r.path, new Date(), r.changeFrequency, r.priority)
  );

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
