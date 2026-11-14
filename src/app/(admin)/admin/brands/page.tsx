import React from "react";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { BrandForm } from "@/components/admin/brand-form";
import { BrandActions } from "@/components/admin/brand-actions";
import { Brand } from "@/types/database";
import { Sparkles, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true });

  const brands = (data as Brand[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Brand Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Manage electronic brands, manufacturer logos, and store associations.
          </p>
        </div>

        <BrandForm />
      </div>

      {/* Table */}
      <div className="bg-neutral-900/90 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden">
        {brands.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Sparkles className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
            <h3 className="text-base font-bold text-white">No brands configured</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              Add your first brand or populate initial store data from the dashboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase font-bold text-[10px]">
                  <th className="py-3.5 px-4">Brand Logo &amp; Name</th>
                  <th className="py-3.5 px-3">Slug</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium text-neutral-300">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          {b.logo_url ? (
                            <Image
                              src={b.logo_url}
                              alt={b.name}
                              fill
                              sizes="40px"
                              className="object-contain p-1"
                            />
                          ) : (
                            <Sparkles className="w-4 h-4 text-neutral-500" />
                          )}
                        </div>
                        <span className="font-bold text-white text-sm">{b.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-neutral-400">
                      /{b.slug}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-neutral-800 text-neutral-500 border-neutral-700"
                        }`}
                      >
                        {b.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <BrandForm
                          brand={b}
                          trigger={
                            <button
                              type="button"
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold transition-colors"
                            >
                              Edit
                            </button>
                          }
                        />
                        <BrandActions id={b.id} isActive={b.is_active} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
