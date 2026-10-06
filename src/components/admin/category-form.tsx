"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, updateCategoryAction } from "@/app/actions/admin";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Category } from "@/types/database";
import { Plus, Edit2, X, Loader2, Layers, CheckCircle2, AlertCircle, Sparkles, Sliders } from "lucide-react";

export function CategoryForm({
  category,
  trigger,
}: {
  category?: Category;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent background page from scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const isEditing = Boolean(category?.id);

  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [description, setDescription] = useState(category?.description || "");
  const [imageUrl, setImageUrl] = useState(category?.image_url || "");
  const [displayOrder, setDisplayOrder] = useState(String(category?.display_order ?? 0));
  const [isActive, setIsActive] = useState(category?.is_active ?? true);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let res;
      if (isEditing && category?.id) {
        res = await updateCategoryAction(category.id, {
          name,
          slug,
          description: description || undefined,
          image_url: imageUrl || undefined,
          display_order: parseInt(displayOrder) || 0,
          is_active: isActive,
        });
      } else {
        res = await createCategoryAction({
          name,
          slug,
          description: description || undefined,
          image_url: imageUrl || undefined,
          display_order: parseInt(displayOrder) || 0,
          is_active: isActive,
        });
      }

      if (!res.success) {
        throw new Error(res.error || "Failed to save category.");
      }

      setIsOpen(false);
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
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8A1538] hover:bg-[#6c102c] text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-y-auto animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-[94vw] max-w-5xl my-auto flex flex-col shadow-2xl overflow-hidden text-neutral-100 max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/90 sticky top-0 z-20">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-[#8A1538]/20 text-[#ff4b77] border border-[#8A1538]/30">
                  {isEditing ? <Edit2 className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {isEditing ? `Edit Category "${category?.name}"` : "Create New Category"}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                    Configure store category details, navigation slug, sequence order, and cover image.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
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
                {/* Left Column (7 cols): Category Details & Description */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#ff4b77]" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          1. Category Details &amp; Slug
                        </h3>
                      </div>
                      <span className="text-[11px] text-neutral-500 font-normal">Store taxonomy</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. Smart Watches &amp; Bands"
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
                          placeholder="smart-watches-bands"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Display Sequence Order
                        </label>
                        <input
                          type="number"
                          value={displayOrder}
                          onChange={(e) => setDisplayOrder(e.target.value)}
                          placeholder="0"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                        />
                        <p className="text-[11px] text-neutral-500">
                          Lower numbers (e.g. 0, 1, 2) appear first in the store category navigation bar.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                        Category Description (Optional)
                      </h3>
                    </div>
                    <div className="space-y-1.5">
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief overview or promotional tagline for this category..."
                        className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm resize-y"
                      />
                      <p className="text-[11px] text-neutral-500">
                        Shown on category landing banners and search result summaries.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column (5 cols): Storefront Cover Graphic & Active Status */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          2. Storefront Cover Graphic
                        </h3>
                      </div>
                      <span className="text-[11px] text-neutral-500">Cloudinary CDN</span>
                    </div>

                    <div className="space-y-3">
                      <ImageUploader
                        value={imageUrl}
                        onChange={setImageUrl}
                        label="Category Icon / Cover Graphic"
                        folder="mobile-deals/categories"
                      />
                      <p className="text-[11px] text-neutral-500">
                        Recommended: Square 500x500px or transparent PNG for best display in navigation chips.
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                        3. Navigation Status
                      </h3>
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
                          <span>Active Category in Navigation</span>
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          When active, this category appears in the top navigation bar, homepage category list, and product filtering dropdowns.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-6 pt-5 border-t border-neutral-800 flex items-center justify-end gap-3 sticky bottom-0 bg-neutral-900 py-3 z-10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
                  <span>{isEditing ? "Save Category Changes" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
