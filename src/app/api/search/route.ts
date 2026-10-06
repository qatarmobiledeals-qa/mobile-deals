import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  try {
    const supabase = createPublicClient();

    // If query is empty, return 4 trending / featured / best deal products
    if (!q || q.length < 1) {
      const { data: trending } = await supabase
        .from("products")
        .select(`
          id, name, slug, price, compare_at_price, stock, badge_text, free_gift, is_today_deal, is_best_deal, is_featured, category_id, brand_id,
          category:categories (id, name, slug),
          brand:brands (id, name, slug),
          product_images (id, image_url, is_primary)
        `)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("is_best_deal", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);

      return NextResponse.json({
        products: trending || [],
        isRelated: true,
        isTrending: true,
        directMatchCount: 0,
        query: "",
      });
    }

    // Step 1: Find any categories or brands matching query
    const [catRes, brandRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id")
        .ilike("name", `%${q}%`)
        .eq("is_active", true)
        .limit(4),
      supabase
        .from("brands")
        .select("id")
        .ilike("name", `%${q}%`)
        .eq("is_active", true)
        .limit(4),
    ]);

    const matchingCatIds = (catRes.data || []).map((c) => c.id);
    const matchingBrandIds = (brandRes.data || []).map((b) => b.id);

    // Step 2: Query products directly matching name, short description, free gift, category, or brand
    const orConditions = [
      `name.ilike.%${q}%`,
      `short_description.ilike.%${q}%`,
      `free_gift.ilike.%${q}%`,
    ];
    if (matchingCatIds.length > 0) {
      orConditions.push(`category_id.in.(${matchingCatIds.join(",")})`);
    }
    if (matchingBrandIds.length > 0) {
      orConditions.push(`brand_id.in.(${matchingBrandIds.join(",")})`);
    }

    const { data: directMatches, error } = await supabase
      .from("products")
      .select(`
        id, name, slug, price, compare_at_price, stock, badge_text, free_gift, is_today_deal, is_best_deal, is_featured, category_id, brand_id,
        category:categories (id, name, slug),
        brand:brands (id, name, slug),
        product_images (id, image_url, is_primary)
      `)
      .eq("is_active", true)
      .or(orConditions.join(","))
      .order("is_featured", { ascending: false })
      .order("is_best_deal", { ascending: false })
      .limit(4);

    if (error) {
      console.error("API search direct matches error:", error);
    }

    const matchedProducts = directMatches || [];
    const directMatchCount = matchedProducts.length;

    // Step 3: If fewer than 4 products matched, fetch related products to ALWAYS show 4 products
    if (matchedProducts.length < 4) {
      const needed = 4 - matchedProducts.length;
      const matchedIds = matchedProducts.map((p) => p.id);

      // Attempt 1: Fetch from same category or brand of first match
      const relatedProducts: typeof matchedProducts = [];
      const primaryCatId = matchedProducts[0]?.category_id;
      const primaryBrandId = matchedProducts[0]?.brand_id;

      if (primaryCatId || primaryBrandId) {
        let relatedQuery = supabase
          .from("products")
          .select(`
            id, name, slug, price, compare_at_price, stock, badge_text, free_gift, is_today_deal, is_best_deal, is_featured, category_id, brand_id,
            category:categories (id, name, slug),
            brand:brands (id, name, slug),
            product_images (id, image_url, is_primary)
          `)
          .eq("is_active", true);

        if (matchedIds.length > 0) {
          relatedQuery = relatedQuery.not("id", "in", `(${matchedIds.join(",")})`);
        }

        if (primaryCatId) {
          relatedQuery = relatedQuery.eq("category_id", primaryCatId);
        } else if (primaryBrandId) {
          relatedQuery = relatedQuery.eq("brand_id", primaryBrandId);
        }

        const { data: catBrandRelated } = await relatedQuery
          .order("is_featured", { ascending: false })
          .limit(needed);

        if (catBrandRelated) {
          relatedProducts.push(...catBrandRelated);
        }
      }

      // Attempt 2: If still fewer than 4 (e.g. 0 direct matches), fetch top featured / best deals
      if (matchedProducts.length + relatedProducts.length < 4) {
        const stillNeeded = 4 - (matchedProducts.length + relatedProducts.length);
        const allUsedIds = [...matchedIds, ...relatedProducts.map((p) => p.id)];

        let fallbackQuery = supabase
          .from("products")
          .select(`
            id, name, slug, price, compare_at_price, stock, badge_text, free_gift, is_today_deal, is_best_deal, is_featured, category_id, brand_id,
            category:categories (id, name, slug),
            brand:brands (id, name, slug),
            product_images (id, image_url, is_primary)
          `)
          .eq("is_active", true);

        if (allUsedIds.length > 0) {
          fallbackQuery = fallbackQuery.not("id", "in", `(${allUsedIds.join(",")})`);
        }

        const { data: fallbackDeals } = await fallbackQuery
          .order("is_featured", { ascending: false })
          .order("is_best_deal", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(stillNeeded);

        if (fallbackDeals) {
          relatedProducts.push(...fallbackDeals);
        }
      }

      return NextResponse.json({
        products: [...matchedProducts, ...relatedProducts].slice(0, 4),
        isRelated: true,
        directMatchCount,
        query: q,
      });
    }

    return NextResponse.json({
      products: matchedProducts.slice(0, 4),
      isRelated: false,
      directMatchCount,
      query: q,
    });
  } catch (err) {
    console.error("API search exception:", err);
    return NextResponse.json({ products: [], isRelated: true, directMatchCount: 0, query: q });
  }
}
