import { createPublicClient } from "@/lib/supabase/server";
import { Banner, Brand, Category, Product, SiteSettings } from "@/types/database";

// Default settings if database table is not yet initialized
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  store_name: "MOBILE DEALS",
  whatsapp_number: "+97455000000",
  support_phone: "+97455000000",
  store_email: "support@mobiledeals.qa",
  currency: "QAR",
  shipping_charge: 0,
  free_delivery_threshold: 100,
  announcement_bar: {
    enabled: true,
    items: [
      "Cash on Delivery Available",
      "Order on WhatsApp",
      "100% Genuine Products",
    ],
  },
  trust_badges: {
    items: [
      { title: "Top Brands", subtitle: "100% Authentic gear", icon: "trophy" },
      { title: "Qatar Wide Delivery", subtitle: "Fast doorstep shipping", icon: "truck" },
      { title: "Best Prices", subtitle: "Unbeatable Qatar deals", icon: "thumbs-up" },
      { title: "Dedicated Support", subtitle: "WhatsApp assistance", icon: "headset" },
      { title: "Secure Ordering", subtitle: "Cash on Delivery verified", icon: "shield-check" },
    ],
  },
};

/**
 * Fetch all active categories sorted by display_order.
 * Gracefully returns empty array if no categories or table does not exist.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, icon_name, display_order, is_active")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return [];
    }

    return (data as Category[]) || [];
  } catch (err) {
    console.warn("Could not fetch categories:", err);
    return [];
  }
}

/**
 * Fetch active hero/promotional banners.
 */
export async function getBanners(): Promise<Banner[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("banners")
      .select(
        "id, title, highlighted_text, description, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, desktop_image_url, mobile_image_url, cloudinary_public_id, position, display_order, is_active"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return [];
    }

    return (data as Banner[]) || [];
  } catch (err) {
    console.warn("Could not fetch banners:", err);
    return [];
  }
}

/**
 * Fetch today's best deals products.
 * Relational join with product_images avoids N+1 queries.
 */
export async function getTodayDeals(): Promise<Product[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, short_description, price, compare_at_price, stock,
        warranty, free_gift, badge_text, is_featured, is_best_deal, is_today_deal,
        is_best_seller, deal_ends_at, is_active, specifications,
        product_images (
          id, image_url, alt_text, is_primary, display_order
        )
      `
      )
      .eq("is_active", true)
      .or("is_today_deal.eq.true,is_best_deal.eq.true")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      return [];
    }

    return (data as unknown as Product[]) || [];
  } catch (err) {
    console.warn("Could not fetch today deals:", err);
    return [];
  }
}

/**
 * Fetch featured products.
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, short_description, price, compare_at_price, stock,
        warranty, free_gift, badge_text, is_featured, is_best_deal, is_today_deal,
        is_best_seller, deal_ends_at, is_active, specifications,
        product_images (
          id, image_url, alt_text, is_primary, display_order
        )
      `
      )
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      return [];
    }

    return (data as unknown as Product[]) || [];
  } catch (err) {
    console.warn("Could not fetch featured products:", err);
    return [];
  }
}

/**
 * Fetch Best Deal products only (is_best_deal = true), max 10.
 */
export async function getBestDeals(): Promise<Product[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, short_description, price, compare_at_price, stock,
        warranty, free_gift, badge_text, is_featured, is_best_deal, is_today_deal,
        is_best_seller, deal_ends_at, is_active, specifications,
        product_images (
          id, image_url, alt_text, is_primary, display_order
        )
      `
      )
      .eq("is_active", true)
      .eq("is_best_deal", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return [];
    }

    return (data as unknown as Product[]) || [];
  } catch (err) {
    console.warn("Could not fetch best deals:", err);
    return [];
  }
}

/**
 * Fetch all active brands sorted by name.
 */
export async function getBrands(): Promise<Brand[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return [];
    }

    return (data as Brand[]) || [];
  } catch (err) {
    console.warn("Could not fetch brands:", err);
    return [];
  }
}

/**
 * Fetch all active products for the all-products / shop listing page, max 200.
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, short_description, price, compare_at_price, stock,
        warranty, free_gift, badge_text, is_featured, is_best_deal, is_today_deal,
        is_best_seller, is_new_arrival, deal_ends_at, is_active, specifications,
        category_id, brand_id,
        category:categories (id, name, slug),
        brand:brands (id, name, slug),
        product_images (
          id, image_url, alt_text, is_primary, display_order
        )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return [];
    }

    return (data as unknown as Product[]) || [];
  } catch (err) {
    console.warn("Could not fetch all products:", err);
    return [];
  }
}

/**
 * Fetch a single product by slug with all images, variants, and brand.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        brand:brands (*),
        category:categories (*),
        product_images (*),
        product_variants (*)
      `
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as unknown as Product;
  } catch (err) {
    console.warn("Could not fetch product by slug:", err);
    return null;
  }
}

/**
 * Fetch products in a specific category.
 */
export async function getProductsByCategory(categorySlug: string): Promise<{
  category: Category | null;
  products: Product[];
}> {
  try {
    const supabase = createPublicClient();
    // First get category
    const { data: category } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .maybeSingle();

    if (!category) {
      return { category: null, products: [] };
    }

    const { data: products } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, short_description, price, compare_at_price, stock,
        warranty, free_gift, badge_text, is_featured, is_best_deal, is_today_deal,
        is_best_seller, deal_ends_at, is_active, specifications,
        product_images (
          id, image_url, alt_text, is_primary, display_order
        )
      `
      )
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return {
      category: category as Category,
      products: (products as unknown as Product[]) || [],
    };
  } catch (err) {
    console.warn("Could not fetch products by category:", err);
    return { category: null, products: [] };
  }
}

/**
 * Search products by query string.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query?.trim();
  if (!q || q.length < 1) {
    return [];
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id, name, slug, short_description, price, compare_at_price, stock,
        warranty, free_gift, badge_text, is_featured, is_best_deal, is_today_deal,
        is_best_seller, is_new_arrival, is_active, specifications,
        category:categories (id, name, slug),
        brand:brands (id, name, slug),
        product_images (
          id, image_url, alt_text, is_primary, display_order
        )
      `
      )
      .eq("is_active", true)
      .or(`name.ilike.%${q}%,short_description.ilike.%${q}%,free_gift.ilike.%${q}%`)
      .limit(20);

    if (error) {
      console.error("searchProducts error:", error);
      return [];
    }

    return (data as unknown as Product[]) || [];
  } catch (err) {
    console.warn("Could not search products:", err);
    return [];
  }
}

/**
 * Fetch site settings from Supabase or fallback to defaults.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .eq("is_public", true);

    if (error || !data || data.length === 0) {
      return DEFAULT_SITE_SETTINGS;
    }

    const merged: SiteSettings = { ...DEFAULT_SITE_SETTINGS };

    data.forEach((row) => {
      if (row.key === "general" && typeof row.value === "object") {
        Object.assign(merged, row.value);
      } else if (row.key === "announcement_bar" && typeof row.value === "object") {
        merged.announcement_bar = row.value as SiteSettings["announcement_bar"];
      } else if (row.key === "trust_badges" && typeof row.value === "object") {
        merged.trust_badges = row.value as SiteSettings["trust_badges"];
      }
    });

    return merged;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
