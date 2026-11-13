import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://mobiledealsqa.com";
  const locales = routing.locales;

  const supabase = createAdminClient();

  // Fetch active products and categories for sitemap
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("slug, updated_at").eq("is_active", true),
  ]);

  // Helper to create localized sitemap entries with alternates
  const createLocalizedEntries = (
    path: string,
    lastModified: Date,
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
    priority: number
  ): MetadataRoute.Sitemap => {
    return locales.map((locale) => {
      const localizedPath = path ? `/${locale}${path.startsWith("/") ? path : `/${path}`}` : `/${locale}`;
      return {
        url: `${baseUrl}${localizedPath}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [
              loc,
              `${baseUrl}/${loc}${path.startsWith("/") ? path : `/${path}`}`,
            ])
          ),
        },
      };
    });
  };

  const productEntries: MetadataRoute.Sitemap = (products || []).flatMap((p) =>
    createLocalizedEntries(
      `/products/${p.slug}`,
      p.updated_at ? new Date(p.updated_at) : new Date(),
      "daily",
      0.8
    )
  );

  const categoryEntries: MetadataRoute.Sitemap = (categories || []).flatMap((c) =>
    createLocalizedEntries(
      `/categories/${c.slug}`,
      c.updated_at ? new Date(c.updated_at) : new Date(),
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
    createLocalizedEntries(r.path, new Date(), r.changeFrequency, r.priority)
  );

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
