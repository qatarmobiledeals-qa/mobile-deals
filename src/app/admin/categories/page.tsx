import React from "react";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryActions } from "@/components/admin/category-actions";
import { Category } from "@/types/database";
import { Layers, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("display_order", { ascending: true });

  const categories = (data as unknown as (Category & { products: [{ count: number }] })[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Organize Qatar electronics inventory, display ordering, and navigation hierarchy.
          </p>
        </div>

        <CategoryForm />
      </div>

      {/* Table */}
      <div className="bg-neutral-900/90 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Layers className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
            <h3 className="text-base font-bold text-white">No categories configured</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              Click &ldquo;Add Category&rdquo; or use the seed button on the overview page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase font-bold text-[10px]">
                  <th className="py-3.5 px-4">Category Details</th>
                  <th className="py-3.5 px-3">Slug</th>
                  <th className="py-3.5 px-3">Display Order</th>
                  <th className="py-3.5 px-3">Products Count</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium text-neutral-300">
                {categories.map((c) => {
                  const productCount = c.products?.[0]?.count || 0;

                  return (
                    <tr key={c.id} className="hover:bg-neutral-800/40">
                      {/* Name & Cover */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-xl bg-neutral-950 border border-neutral-800 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            {c.image_url ? (
                              <Image
                                src={c.image_url}
                                alt={c.name}
                                fill
                                sizes="44px"
                                className="object-cover rounded-lg"
                              />
                            ) : (
                              <Layers className="w-4 h-4 text-neutral-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {c.name}
                            </span>
                            {c.description && (
                              <span className="text-[11px] text-neutral-400 line-clamp-1">
                                {c.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-3 font-mono text-neutral-400">
                        /{c.slug}
                      </td>

                      {/* Display Order */}
                      <td className="py-3.5 px-3 font-mono font-bold text-neutral-200">
                        #{c.display_order}
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300">
                          <Package className="w-3 h-3 text-neutral-500" />
                          {productCount} products
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-neutral-800 text-neutral-500 border-neutral-700"
                          }`}
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CategoryForm
                            category={c}
                            trigger={
                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold transition-colors"
                              >
                                Edit
                              </button>
                            }
                          />
                          <CategoryActions id={c.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
