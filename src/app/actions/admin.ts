"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteSettings } from "@/types/database";
import {
  deleteCloudinaryImageAction,
  deleteMultipleCloudinaryImagesAction,
} from "./cloudinary";

/* ======================================================================
   PRODUCT ACTIONS
   ====================================================================== */

export interface ProductInputPayload {
  id?: string;
  name: string;
  slug: string;
  category_id?: string | null;
  brand_id?: string | null;
  short_description?: string;
  description?: string;
  price: number;
  compare_at_price?: number | null;
  stock?: number;
  warranty?: string;
  free_gift?: string;
  badge_text?: string;
  is_featured?: boolean;
  is_best_deal?: boolean;
  is_today_deal?: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  deal_ends_at?: string | null;
  is_active?: boolean;
  specifications?: Record<string, string>;
  images?: Array<{
    image_url: string;
    cloudinary_public_id?: string | null;
    is_primary?: boolean;
    display_order?: number;
  }>;
  variants?: Array<{
    name: string;
    sku?: string;
    price?: number | null;
    compare_at_price?: number | null;
    stock?: number;
  }>;
}

export async function createProductAction(data: ProductInputPayload) {
  try {
    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: data.name.trim(),
        slug: data.slug.trim(),
        category_id: data.category_id || null,
        brand_id: data.brand_id || null,
        short_description: data.short_description || null,
        description: data.description || null,
        price: data.price,
        compare_at_price: data.compare_at_price || null,
        stock: data.stock !== undefined ? data.stock : 10,
        warranty: data.warranty || null,
        free_gift: data.free_gift || null,
        badge_text: data.badge_text || null,
        is_featured: Boolean(data.is_featured),
        is_best_deal: Boolean(data.is_best_deal),
        is_today_deal: Boolean(data.is_today_deal),
        is_best_seller: Boolean(data.is_best_seller),
        is_new_arrival: Boolean(data.is_new_arrival),
        deal_ends_at: data.deal_ends_at || null,
        specifications: data.specifications || {},
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Insert Images
    if (data.images && data.images.length > 0) {
      const imagesToInsert = data.images.map((img, idx) => ({
        product_id: product.id,
        image_url: img.image_url,
        cloudinary_public_id: img.cloudinary_public_id || null,
        is_primary: img.is_primary ?? idx === 0,
        display_order: img.display_order ?? idx + 1,
      }));
      const { error: imgErr } = await supabase.from("product_images").insert(imagesToInsert);
      if (imgErr) throw imgErr;
    }

    // Insert Variants
    if (data.variants && data.variants.length > 0) {
      const variantsToInsert = data.variants.map((v) => ({
        product_id: product.id,
        name: v.name,
        sku: v.sku || null,
        price: v.price || null,
        compare_at_price: v.compare_at_price || null,
        stock: v.stock ?? 5,
      }));
      const { error: varErr } = await supabase.from("product_variants").insert(variantsToInsert);
      if (varErr) throw varErr;
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/products");

    // Fetch refreshed product with relations
    const { data: createdProduct } = await supabase
      .from("products")
      .select("*, category:categories(*), brand:brands(*), product_images(*), product_variants(*)")
      .eq("id", product.id)
      .single();

    return { success: true, id: product.id, data: createdProduct };
  } catch (err: unknown) {
    console.error("createProductAction error:", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function updateProductAction(id: string, data: Partial<ProductInputPayload>) {
  try {
    const supabase = createAdminClient();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.slug !== undefined) updatePayload.slug = data.slug.trim();
    if (data.category_id !== undefined) updatePayload.category_id = data.category_id || null;
    if (data.brand_id !== undefined) updatePayload.brand_id = data.brand_id || null;
    if (data.short_description !== undefined) updatePayload.short_description = data.short_description || null;
    if (data.description !== undefined) updatePayload.description = data.description || null;
    if (data.price !== undefined) updatePayload.price = data.price;
    if (data.compare_at_price !== undefined) updatePayload.compare_at_price = data.compare_at_price || null;
    if (data.stock !== undefined) updatePayload.stock = data.stock;
    if (data.warranty !== undefined) updatePayload.warranty = data.warranty || null;
    if (data.free_gift !== undefined) updatePayload.free_gift = data.free_gift || null;
    if (data.badge_text !== undefined) updatePayload.badge_text = data.badge_text || null;
    if (data.is_featured !== undefined) updatePayload.is_featured = Boolean(data.is_featured);
    if (data.is_best_deal !== undefined) updatePayload.is_best_deal = Boolean(data.is_best_deal);
    if (data.is_today_deal !== undefined) updatePayload.is_today_deal = Boolean(data.is_today_deal);
    if (data.is_best_seller !== undefined) updatePayload.is_best_seller = Boolean(data.is_best_seller);
    if (data.is_new_arrival !== undefined) updatePayload.is_new_arrival = Boolean(data.is_new_arrival);
    if (data.deal_ends_at !== undefined) updatePayload.deal_ends_at = data.deal_ends_at || null;
    if (data.specifications !== undefined) updatePayload.specifications = data.specifications || {};
    if (data.is_active !== undefined) updatePayload.is_active = Boolean(data.is_active);

    const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
    if (error) throw error;

    // Update Images if supplied
    if (data.images !== undefined) {
      // 1. Fetch existing images to identify which ones were removed
      const { data: existingImages } = await supabase
        .from("product_images")
        .select("image_url, cloudinary_public_id")
        .eq("product_id", id);

      const newImageUrls = new Set(
        (data.images || []).map((img) => img.image_url.trim()).filter(Boolean)
      );

      const removedImages = (existingImages || []).filter(
        (img) => !newImageUrls.has(img.image_url.trim())
      );

      // 2. Delete removed images from Cloudinary
      if (removedImages.length > 0) {
        const toDelete = removedImages.map(
          (img) => img.cloudinary_public_id || img.image_url
        );
        try {
          await deleteMultipleCloudinaryImagesAction(toDelete);
        } catch (cloudErr) {
          console.warn("[updateProductAction] Cloudinary purge warning:", cloudErr);
        }
      }

      // 3. Delete existing DB records and insert updated ones
      const { error: delImgErr } = await supabase.from("product_images").delete().eq("product_id", id);
      if (delImgErr) throw delImgErr;

      if (data.images.length > 0) {
        const imagesToInsert = data.images.map((img, idx) => ({
          product_id: id,
          image_url: img.image_url,
          cloudinary_public_id: img.cloudinary_public_id || null,
          is_primary: img.is_primary ?? idx === 0,
          display_order: img.display_order ?? idx + 1,
        }));
        const { error: insImgErr } = await supabase.from("product_images").insert(imagesToInsert);
        if (insImgErr) throw insImgErr;
      }
    }

    // Update Variants if supplied
    if (data.variants !== undefined) {
      const { error: delVarErr } = await supabase.from("product_variants").delete().eq("product_id", id);
      if (delVarErr) throw delVarErr;

      if (data.variants.length > 0) {
        const variantsToInsert = data.variants.map((v) => ({
          product_id: id,
          name: v.name,
          sku: v.sku || null,
          price: v.price || null,
          compare_at_price: v.compare_at_price || null,
          stock: v.stock ?? 5,
        }));
        const { error: insVarErr } = await supabase.from("product_variants").insert(variantsToInsert);
        if (insVarErr) throw insVarErr;
      }
    }

    revalidatePath("/");
    revalidatePath(`/products/${data.slug || id}`);
    revalidatePath("/admin");
    revalidatePath("/admin/products");

    // Fetch refreshed product with relations
    const { data: updatedProduct } = await supabase
      .from("products")
      .select("*, category:categories(*), brand:brands(*), product_images(*), product_variants(*)")
      .eq("id", id)
      .single();

    return { success: true, data: updatedProduct };
  } catch (err: unknown) {
    console.error("updateProductAction error:", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const supabase = createAdminClient();

    // 1. Find all product images to purge from Cloudinary
    const { data: productImages } = await supabase
      .from("product_images")
      .select("image_url, cloudinary_public_id")
      .eq("product_id", id);

    // 2. Fetch product specs to check if gift_image exists
    const { data: product } = await supabase
      .from("products")
      .select("specifications")
      .eq("id", id)
      .maybeSingle();

    const imagesToPurge: string[] = [];
    if (productImages && productImages.length > 0) {
      for (const img of productImages) {
        if (img.cloudinary_public_id) {
          imagesToPurge.push(img.cloudinary_public_id);
        } else if (img.image_url) {
          imagesToPurge.push(img.image_url);
        }
      }
    }

    if (product?.specifications?.gift_image) {
      imagesToPurge.push(product.specifications.gift_image);
    }

    // 3. Delete all Cloudinary assets
    if (imagesToPurge.length > 0) {
      try {
        await deleteMultipleCloudinaryImagesAction(imagesToPurge);
      } catch (cloudErr) {
        console.warn("[deleteProductAction] Cloudinary purge warning:", cloudErr);
      }
    }

    // 4. Delete the product from Supabase (cascades to product_images and product_variants)
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function toggleProductActiveAction(id: string, currentStatus: boolean) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("products")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/* ======================================================================
   BRAND ACTIONS
   ====================================================================== */

export async function createBrandAction(data: {
  name: string;
  slug: string;
  logo_url?: string;
  is_active?: boolean;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("brands").insert({
      name: data.name.trim(),
      slug: data.slug.trim(),
      logo_url: data.logo_url || null,
      is_active: data.is_active ?? true,
    });
    if (error) throw error;

    revalidatePath("/admin/brands");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function updateBrandAction(
  id: string,
  data: { name?: string; slug?: string; logo_url?: string; is_active?: boolean }
) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("brands").update(data).eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/brands");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteBrandAction(id: string) {
  try {
    const supabase = createAdminClient();

    // Purge brand logo from Cloudinary
    const { data: brand } = await supabase
      .from("brands")
      .select("logo_url")
      .eq("id", id)
      .maybeSingle();

    if (brand?.logo_url) {
      try {
        await deleteCloudinaryImageAction(brand.logo_url);
      } catch (err) {
        console.warn("[deleteBrandAction] Cloudinary purge warning:", err);
      }
    }

    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/brands");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function toggleBrandActiveAction(id: string, currentStatus: boolean) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("brands")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/brands");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/* ======================================================================
   CATEGORY ACTIONS
   ====================================================================== */

export async function createCategoryAction(data: {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  icon_name?: string;
  display_order?: number;
  is_active?: boolean;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("categories").insert({
      name: data.name.trim(),
      slug: data.slug.trim(),
      description: data.description || null,
      image_url: data.image_url || null,
      icon_name: data.icon_name || null,
      display_order: data.display_order ?? 0,
      is_active: data.is_active ?? true,
    });
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function updateCategoryAction(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    image_url?: string;
    icon_name?: string;
    display_order?: number;
    is_active?: boolean;
  }
) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("categories")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const supabase = createAdminClient();

    // Purge category image from Cloudinary
    const { data: cat } = await supabase
      .from("categories")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    if (cat?.image_url) {
      try {
        await deleteCloudinaryImageAction(cat.image_url);
      } catch (err) {
        console.warn("[deleteCategoryAction] Cloudinary purge warning:", err);
      }
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/* ======================================================================
   BANNER ACTIONS
   ====================================================================== */

export async function createBannerAction(data: {
  title?: string;
  highlighted_text?: string | null;
  description?: string | null;
  primary_cta_text?: string | null;
  primary_cta_link?: string | null;
  secondary_cta_text?: string | null;
  secondary_cta_link?: string | null;
  desktop_image_url: string;
  mobile_image_url?: string | null;
  position?: string;
  display_order?: number;
  is_active?: boolean;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("banners").insert({
      title: data.title?.trim() || "",
      highlighted_text: data.highlighted_text?.trim() || null,
      description: data.description?.trim() || null,
      primary_cta_text: data.primary_cta_text?.trim() || null,
      primary_cta_link: data.primary_cta_link?.trim() || null,
      secondary_cta_text: data.secondary_cta_text?.trim() || null,
      secondary_cta_link: data.secondary_cta_link?.trim() || null,
      desktop_image_url: data.desktop_image_url,
      mobile_image_url: data.mobile_image_url || null,
      position: data.position || "hero",
      display_order: data.display_order ?? 0,
      is_active: data.is_active ?? true,
    });
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function updateBannerAction(
  id: string,
  data: Partial<{
    title: string | null;
    highlighted_text: string | null;
    description: string | null;
    primary_cta_text: string | null;
    primary_cta_link: string | null;
    secondary_cta_text: string | null;
    secondary_cta_link: string | null;
    desktop_image_url: string;
    mobile_image_url: string | null;
    position: string;
    display_order: number;
    is_active: boolean;
  }>
) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("banners")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteBannerAction(id: string) {
  try {
    const supabase = createAdminClient();

    // Purge banner images from Cloudinary
    const { data: banner } = await supabase
      .from("banners")
      .select("desktop_image_url, mobile_image_url, cloudinary_public_id")
      .eq("id", id)
      .maybeSingle();

    if (banner) {
      const bannerImgs = [
        banner.cloudinary_public_id,
        banner.desktop_image_url,
        banner.mobile_image_url,
      ].filter(Boolean) as string[];
      if (bannerImgs.length > 0) {
        try {
          await deleteMultipleCloudinaryImagesAction(bannerImgs);
        } catch (err) {
          console.warn("[deleteBannerAction] Cloudinary purge warning:", err);
        }
      }
    }

    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/* ======================================================================
   ORDER ACTIONS
   ====================================================================== */

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteOrderAction(orderId: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/* ======================================================================
   SETTINGS ACTION
   ====================================================================== */

export async function updateSiteSettingsAction(settings: Partial<SiteSettings>) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("site_settings").upsert({
      key: "general",
      value: settings,
      is_public: true,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/cart");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/* ======================================================================
   SEED INITIAL STORE DATA ACTION
   ====================================================================== */

export async function seedInitialDataAction() {
  try {
    const supabase = createAdminClient();

    // 1. Initial Categories
    const categoriesToSeed = [
      {
        name: "Keyboard & Mouse",
        slug: "keyboard-mouse",
        description: "Gaming keyboards, wireless mice and desktop accessories",
        image_url:
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80",
        display_order: 1,
        is_active: true,
      },
      {
        name: "Mobile & Tablet Holder",
        slug: "mobile-tablet-holder",
        description: "Desk stands, car mounts and ergonomic holders",
        image_url:
          "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=300&auto=format&fit=crop&q=80",
        display_order: 2,
        is_active: true,
      },
      {
        name: "Earphones & Buds",
        slug: "earphones-buds",
        description: "TWS earbuds, noise cancelling headphones & earphones",
        image_url:
          "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80",
        display_order: 3,
        is_active: true,
      },
      {
        name: "Charger & Adapter",
        slug: "charger-adapter",
        description: "Fast charging wall adapters, GaN chargers and cables",
        image_url:
          "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80",
        display_order: 4,
        is_active: true,
      },
      {
        name: "Watch & Straps",
        slug: "watch-straps",
        description: "Smartwatches, fitness bands and premium straps",
        image_url:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
        display_order: 5,
        is_active: true,
      },
      {
        name: "Perfume",
        slug: "perfume",
        description: "Luxury Arabian and French fragrances for men and women",
        image_url:
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80",
        display_order: 6,
        is_active: true,
      },
      {
        name: "Covers & Glasses",
        slug: "covers-glasses",
        description: "Shockproof phone cases, screen protectors and lens guards",
        image_url:
          "https://images.unsplash.com/photo-1601593346740-925612772716?w=300&auto=format&fit=crop&q=80",
        display_order: 7,
        is_active: true,
      },
      {
        name: "Power Bank",
        slug: "power-bank",
        description: "High-capacity portable battery packs with fast charging",
        image_url:
          "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&auto=format&fit=crop&q=80",
        display_order: 8,
        is_active: true,
      },
      {
        name: "Speaker",
        slug: "speaker",
        description: "Bluetooth portable speakers and home audio soundbars",
        image_url:
          "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80",
        display_order: 9,
        is_active: true,
      },
      {
        name: "Toys",
        slug: "toys",
        description: "RC cars, drones and smart interactive toys",
        image_url:
          "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=300&auto=format&fit=crop&q=80",
        display_order: 10,
        is_active: true,
      },
    ];

    await supabase.from("categories").upsert(categoriesToSeed, { onConflict: "slug" });

    // 2. Initial Brands
    const brandsToSeed = [
      { name: "Apple", slug: "apple", is_active: true },
      { name: "Samsung", slug: "samsung", is_active: true },
      { name: "Xiaomi", slug: "xiaomi", is_active: true },
      { name: "Anker", slug: "anker", is_active: true },
      { name: "Huawei", slug: "huawei", is_active: true },
    ];
    await supabase.from("brands").upsert(brandsToSeed, { onConflict: "slug" });

    // 3. Initial Sample Products
    interface SeedProductItem {
      name: string;
      slug: string;
      short_description: string;
      price: number;
      compare_at_price: number | null;
      stock: number;
      free_gift: string | null;
      badge_text: string | null;
      is_today_deal: boolean;
      is_best_deal: boolean;
      is_featured: boolean;
      is_best_seller: boolean;
      is_active: boolean;
      image_url: string;
    }

    const productsToSeed: SeedProductItem[] = [
      {
        name: "Samsung Galaxy Z Fold 8 5G",
        slug: "samsung-galaxy-z-fold-8-5g",
        short_description: "12GB RAM / 256GB Storage - Qatar Official Warranty",
        price: 5649,
        compare_at_price: 6199,
        stock: 8,
        free_gift: "Samsung 65W GaN Super Charger",
        badge_text: "Free Gift",
        is_today_deal: true,
        is_best_deal: true,
        is_featured: true,
        is_best_seller: false,
        is_active: true,
        image_url:
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
      },
      {
        name: "Samsung Galaxy S25 FE 5G",
        slug: "samsung-galaxy-s25-fe-5g",
        short_description: "8GB RAM / 256GB Storage - Fast Charging",
        price: 1829,
        compare_at_price: 2199,
        stock: 14,
        free_gift: null,
        badge_text: "Best Seller",
        is_today_deal: true,
        is_best_deal: false,
        is_featured: true,
        is_best_seller: true,
        is_active: true,
        image_url:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
      },
      {
        name: "Redmi 17 5G Tech Bundle",
        slug: "redmi-17-5g-tech-bundle",
        short_description: "8GB RAM / 256GB Storage + TWS Earbuds Included",
        price: 769,
        compare_at_price: 899,
        stock: 18,
        free_gift: null,
        badge_text: "With Buds",
        is_today_deal: true,
        is_best_deal: false,
        is_featured: false,
        is_best_seller: false,
        is_active: true,
        image_url:
          "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&auto=format&fit=crop&q=80",
      },
    ];

    for (const p of productsToSeed) {
      const { image_url, ...productFields } = p;
      const { data: insertedProduct, error: pError } = await supabase
        .from("products")
        .upsert(productFields as any, { onConflict: "slug" })
        .select("id")
        .single();

      if (!pError && insertedProduct && image_url) {
        await supabase.from("product_images").upsert(
          {
            product_id: insertedProduct.id,
            image_url: image_url,
            is_primary: true,
            display_order: 1,
          },
          { onConflict: "id" }
        );
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/* ======================================================================
   SERVICE ENQUIRY ACTIONS
   ====================================================================== */

export async function createServiceEnquiryAction(data: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  preferred_contact?: string;
  service_type: string;
  product_name: string;
  product_model?: string | null;
  issue_description: string;
  additional_details?: string | null;
}) {
  try {
    const supabase = createAdminClient();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const referenceNo = `MD-SRV-${randomDigits}`;

    const { data: inserted, error } = await supabase
      .from("service_enquiries")
      .insert({
        reference_no: referenceNo,
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.trim(),
        customer_email: data.customer_email?.trim() || null,
        preferred_contact: data.preferred_contact || "WhatsApp",
        service_type: data.service_type,
        product_name: data.product_name.trim(),
        product_model: data.product_model?.trim() || null,
        issue_description: data.issue_description.trim(),
        additional_details: data.additional_details?.trim() || null,
        status: "pending",
      })
      .select("id, reference_no")
      .single();

    if (error) {
      console.warn("Could not insert service enquiry to DB:", error.message);
      // Return reference number even if DB fails so user flow is not interrupted
      return { success: false, referenceNo, error: error.message };
    }

    revalidatePath("/admin/service-enquiries");
    return { success: true, referenceNo: inserted?.reference_no || referenceNo };
  } catch (err: unknown) {
    console.warn("Service enquiry action exception:", err);
    return { success: false, referenceNo: `MD-SRV-${Math.floor(100000 + Math.random() * 900000)}`, error: (err as Error).message };
  }
}

export async function updateServiceEnquiryStatusAction(
  id: string,
  status: string,
  adminNotes?: string
) {
  try {
    const supabase = createAdminClient();
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from("service_enquiries")
      .update(updatePayload)
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/service-enquiries");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteServiceEnquiryAction(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("service_enquiries")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/service-enquiries");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

