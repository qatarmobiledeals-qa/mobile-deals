import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductTableClient } from "@/components/admin/product-table-client";
import { ProductForm } from "@/components/admin/product-form";
import { Category, Brand, Product } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createAdminClient();

  const [
    { data: productsData },
    { data: categoriesData },
    { data: brandsData },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*), brand:brands(*), product_images(*), product_variants(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("brands")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  const products = (productsData as unknown as Product[]) || [];
  const categories = (categoriesData as Category[]) || [];
  const brands = (brandsData as Brand[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Product Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Manage Qatar catalog prices, stock, multi-images, promotional tags, and storage variants.
          </p>
        </div>

        <ProductForm categories={categories} brands={brands} />
      </div>

      {/* Client Table */}
      <ProductTableClient
        initialProducts={products}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
