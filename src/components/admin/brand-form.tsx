"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrandAction, updateBrandAction } from "@/app/actions/admin";
import { Brand } from "@/types/database";
import { ImageUploader } from "./image-uploader";
import { Plus, Edit2, X, Loader2, Sparkles, CheckCircle2, AlertCircle, Building2, Sliders } from "lucide-react";

export function BrandForm({
  brand,
  trigger,
}: {
  brand?: Brand;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent background page from scrolling while modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  const isEditing = Boolean(brand?.id);

  const [name, setName] = useState(brand?.name || "");
  const [slug, setSlug] = useState(brand?.slug || "");
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url || "");
  const [isActive, setIsActive] = useState(brand?.is_active ?? true);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name.trim()) throw new Error("Brand name is required.");
      if (!slug.trim()) throw new Error("Brand slug is required.");

      let res;
      if (isEditing && brand?.id) {
        res = await updateBrandAction(brand.id, {
          name,
          slug,
          logo_url: logoUrl || undefined,
          is_active: isActive,
        });
      } else {
        res = await createBrandAction({
          name,
          slug,
          logo_url: logoUrl || undefined,
          is_active: isActive,
        });
      }

      if (!res.success) {
        throw new Error(res.error || "Failed to save brand.");
      }

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#6c102c] text-white font-bold text-xs transition-all hover:scale-102 active:scale-98 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-[94vw] max-w-5xl my-auto flex flex-col shadow-2xl overflow-hidden text-neutral-100 max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/90 sticky top-0 z-20">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-[#8A1538]/20 text-[#ff4b77] border border-[#8A1538]/30">
                  {isEditing ? <Edit2 className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {isEditing ? `Edit Brand "${brand?.name}"` : "Create New Brand"}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                    Configure brand manufacturer details, official logo, and storefront catalog visibility.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 sm:mx-8 mt-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Body - 2-Column Wide Desktop Layout */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (6 cols): Brand Identity & Active Status */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#ff4b77]" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          1. Brand Identity &amp; URL Slug
                        </h4>
                      </div>
                      <span className="text-[11px] text-neutral-500">Catalog filter taxonomy</span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Brand Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. Apple, Samsung, Anker, JBL"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          URL Slug *
                        </label>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="apple"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                        2. Brand Visibility
                      </h4>
                    </div>

                    <label className="flex items-start gap-3 p-4 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-5 h-5 accent-[#8A1538] rounded cursor-pointer mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Active Brand in Catalog Filters</span>
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          When active, customers can filter products by this brand across the catalog and search results.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Right Column (6 cols): Official Logo & Asset */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          3. Official Brand Logo
                        </h4>
                      </div>
                      <span className="text-[11px] text-neutral-500">Cloudinary CDN</span>
                    </div>

                    <div className="space-y-3">
                      <ImageUploader
                        value={logoUrl}
                        onChange={setLogoUrl}
                        label="Brand Official Logo"
                        folder="mobile-deals/brands"
                      />
                      <p className="text-[11px] text-neutral-500">
                        Recommended: Clean transparent PNG or vector graphic (SVG/PNG) for crisp brand logo badges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-6 pt-5 border-t border-neutral-800 flex items-center justify-end gap-3 sticky bottom-0 bg-neutral-900 py-3 z-10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#6c102c] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isEditing ? "Save Brand Changes" : "Create Brand"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
