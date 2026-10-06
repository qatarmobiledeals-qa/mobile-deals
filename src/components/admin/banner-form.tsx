"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBannerAction, updateBannerAction } from "@/app/actions/admin";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Banner } from "@/types/database";
import {
  Plus,
  Edit2,
  X,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Link2,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export function BannerForm({
  banner,
  trigger,
}: {
  banner?: Banner;
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

  const isEditing = Boolean(banner?.id);

  // Form State
  const [title, setTitle] = useState(banner?.title || "");
  const [highlightedText, setHighlightedText] = useState(
    banner?.highlighted_text || ""
  );
  const [description, setDescription] = useState(
    banner?.description || ""
  );
  const [primaryCtaText, setPrimaryCtaText] = useState(
    banner?.primary_cta_text || ""
  );
  const [primaryCtaLink, setPrimaryCtaLink] = useState(
    banner?.primary_cta_link || ""
  );
  const [secondaryCtaText, setSecondaryCtaText] = useState(
    banner?.secondary_cta_text || ""
  );
  const [secondaryCtaLink, setSecondaryCtaLink] = useState(
    banner?.secondary_cta_link || ""
  );
  const [desktopImageUrl, setDesktopImageUrl] = useState(
    banner?.desktop_image_url || ""
  );
  const [mobileImageUrl, setMobileImageUrl] = useState(
    banner?.mobile_image_url || ""
  );
  const [displayOrder, setDisplayOrder] = useState(
    String(banner?.display_order ?? 1)
  );
  const [isActive, setIsActive] = useState(banner?.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desktopImageUrl.trim()) {
      setError("Please upload or provide a banner background image.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bannerData = {
        title: title.trim(),
        highlighted_text: highlightedText?.trim() || null,
        description: description?.trim() || null,
        primary_cta_text: primaryCtaText?.trim() || null,
        primary_cta_link: primaryCtaLink?.trim() || null,
        secondary_cta_text: secondaryCtaText?.trim() || null,
        secondary_cta_link: secondaryCtaLink?.trim() || null,
        desktop_image_url: desktopImageUrl.trim(),
        mobile_image_url: mobileImageUrl?.trim() || null,
        position: "hero",
        display_order: parseInt(displayOrder) || 1,
        is_active: isActive,
      };

      let res;
      if (isEditing && banner?.id) {
        res = await updateBannerAction(banner.id, bannerData);
      } else {
        res = await createBannerAction(bannerData);
      }

      if (!res.success) {
        throw new Error(res.error || "Failed to save banner.");
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
          onClick={() => {
            setIsOpen(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8A1538] hover:bg-[#6c102c] text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Banner</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-y-auto animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-[95vw] max-w-6xl my-auto flex flex-col shadow-2xl overflow-hidden text-neutral-100 max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/90 sticky top-0 z-20">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-[#8A1538]/20 text-[#ff4b77] border border-[#8A1538]/30">
                  {isEditing ? <Edit2 className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {isEditing ? "Edit Hero Banner" : "Create New Hero Banner"}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                    Configure your high-impact homepage banner graphic, text overlays, and interactive call-to-actions.
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

            {/* Error message */}
            {error && (
              <div className="mx-6 sm:mx-8 mt-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Body - 2-Column Wide Desktop Workspace */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (6 cols): Visual Graphics & Ordering */}
                <div className="lg:col-span-6 space-y-6">
                  {/* SECTION 1: Banner Images */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#ff4b77]" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          1. Banner Media (Desktop &amp; Mobile)
                        </h3>
                      </div>
                      <span className="text-[11px] text-neutral-500">Cloudinary HD</span>
                    </div>

                    <div className="space-y-4">
                      {/* Desktop Banner Image */}
                      <div className="space-y-2">
                        <label className="font-semibold text-neutral-200 block text-xs">
                          Main Desktop Banner Image *
                        </label>
                        <ImageUploader
                          value={desktopImageUrl}
                          onChange={setDesktopImageUrl}
                          label="Upload Desktop Banner"
                          folder="mobile-deals/banners"
                        />
                        <p className="text-[11px] text-neutral-500">
                          Recommended: 1920x600px or 16:9 ratio. Used on desktop, laptop, and tablet screens.
                        </p>
                      </div>

                      {/* Mobile Banner Image */}
                      <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                        <label className="font-semibold text-neutral-200 block text-xs">
                          Mobile Banner Image (Optional)
                        </label>
                        <ImageUploader
                          value={mobileImageUrl}
                          onChange={setMobileImageUrl}
                          label="Upload Mobile Banner (Optional)"
                          folder="mobile-deals/banners"
                        />
                        <p className="text-[11px] text-neutral-500">
                          Recommended: 800x600px or 4:3 ratio. Optimizes display and loading speed on mobile devices.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ordering & Status */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                        2. Sequence &amp; Visibility Status
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Display Sequence (Order Number)
                        </label>
                        <input
                          type="number"
                          value={displayOrder}
                          onChange={(e) => setDisplayOrder(e.target.value)}
                          placeholder="1"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:border-[#8A1538] text-xs sm:text-sm"
                        />
                        <p className="text-[11px] text-neutral-500">
                          Banners with lower numbers appear first in the carousel.
                        </p>
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
                            <span>Active Banner (Show on Homepage Hero Slider)</span>
                          </span>
                          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                            Uncheck to immediately hide this banner from customers without deleting it.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column (6 cols): Copy & Call to Action */}
                <div className="lg:col-span-6 space-y-6">
                  {/* SECTION 2: Text Overlays */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          3. Text Overlays (Optional)
                        </h3>
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        Leave blank for clean graphic banner
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="font-semibold text-neutral-300 block text-xs">
                            Main Headline Title
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Latest Tech Deals in Qatar"
                            className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-300 block text-xs">
                            Badge / Tag Text
                          </label>
                          <input
                            type="text"
                            value={highlightedText}
                            onChange={(e) => setHighlightedText(e.target.value)}
                            placeholder="e.g. Special Offer"
                            className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Description / Subtitle
                        </label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Short promotional subtitle, discount details, or warranty highlights..."
                          className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm resize-y"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Action Buttons & Destination Links */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          4. Call to Action &amp; Destination Link
                        </h3>
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        Interactive CTA &amp; Navigation
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Action Type Preset Selector */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Action Type / Quick Destination Preset
                        </label>
                        <select
                          value={
                            primaryCtaLink === "/service-enquiry"
                              ? "service_enquiry"
                              : primaryCtaLink === "/#deals"
                              ? "deals"
                              : primaryCtaLink === "/#categories"
                              ? "categories"
                              : primaryCtaLink === "/products"
                              ? "products"
                              : primaryCtaLink
                              ? "custom"
                              : "none"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "service_enquiry") {
                              setPrimaryCtaLink("/service-enquiry");
                              if (!primaryCtaText || primaryCtaText === "Shop Now" || primaryCtaText === "Explore Deals" || primaryCtaText === "Browse Categories") {
                                setPrimaryCtaText("Service Enquiry");
                              }
                            } else if (val === "deals") {
                              setPrimaryCtaLink("/#deals");
                              if (!primaryCtaText || primaryCtaText === "Service Enquiry") {
                                setPrimaryCtaText("Explore Deals");
                              }
                            } else if (val === "categories") {
                              setPrimaryCtaLink("/#categories");
                              if (!primaryCtaText || primaryCtaText === "Service Enquiry") {
                                setPrimaryCtaText("Browse Categories");
                              }
                            } else if (val === "products") {
                              setPrimaryCtaLink("/products");
                              if (!primaryCtaText || primaryCtaText === "Service Enquiry") {
                                setPrimaryCtaText("Shop All Products");
                              }
                            } else if (val === "none") {
                              setPrimaryCtaLink("");
                              setPrimaryCtaText("");
                            }
                          }}
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm cursor-pointer"
                        >
                          <option value="none">No Action / Pure Graphic Banner</option>
                          <option value="service_enquiry">🛠️ Service Enquiry Form (/service-enquiry)</option>
                          <option value="deals">🔥 Best Deals Section (/#deals)</option>
                          <option value="categories">📦 Categories Section (/#categories)</option>
                          <option value="products">🛍️ All Products Catalog (/products)</option>
                          <option value="custom">🔗 Custom Link / External URL</option>
                        </select>
                      </div>

                      {/* Button text & destination url grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-300 block text-xs">
                            Button Label Text (Optional)
                          </label>
                          <input
                            type="text"
                            value={primaryCtaText}
                            onChange={(e) => setPrimaryCtaText(e.target.value)}
                            placeholder="e.g. Service Enquiry or Shop Now"
                            className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-300 block text-xs">
                            Target Destination URL
                          </label>
                          <input
                            type="text"
                            value={primaryCtaLink}
                            onChange={(e) => setPrimaryCtaLink(e.target.value)}
                            placeholder="e.g. /service-enquiry or /#deals"
                            className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Secondary WhatsApp Action Text (Optional)
                        </label>
                        <input
                          type="text"
                          value={secondaryCtaText}
                          onChange={(e) => setSecondaryCtaText(e.target.value)}
                          placeholder="e.g. Order on WhatsApp"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] text-xs sm:text-sm"
                        />
                      </div>

                      <p className="text-[11px] text-neutral-500 italic bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/60">
                        💡 <strong>Tip:</strong> If Button Text is provided, an interactive CTA button will be placed on the banner. If Button Text is empty but a Destination URL is set, the whole banner image acts as a clickable link.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
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
                  <span>{isEditing ? "Save Changes" : "Publish Banner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
