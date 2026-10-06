import React from "react";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { BannerForm } from "@/components/admin/banner-form";
import { BannerActions } from "@/components/admin/banner-actions";
import { Banner } from "@/types/database";
import { Image as ImageIcon, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("banners")
    .select("*")
    .order("display_order", { ascending: true });

  const banners = (data as Banner[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hero &amp; Promo Banners
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Manage top carousel banners, promotional headlines, CTA buttons, and display sequence.
          </p>
        </div>

        <BannerForm />
      </div>

      {/* Grid of Banners */}
      {banners.length === 0 ? (
        <div className="text-center py-16 px-4 bg-neutral-900/90 rounded-3xl border border-neutral-800">
          <ImageIcon className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
          <h3 className="text-base font-bold text-white">No banners added yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Upload your first hero carousel banner or promotional deal graphics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-neutral-900/90 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full bg-neutral-950 border-b border-neutral-800 overflow-hidden">
                <Image
                  src={banner.desktop_image_url}
                  alt={banner.title || "Hero Banner"}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-neutral-700/60 text-[10px] font-bold">
                  <span className="text-neutral-300">Order #{banner.display_order}</span>
                  <span className="text-neutral-500">&bull;</span>
                  <span className={banner.is_active ? "text-emerald-400" : "text-neutral-500"}>
                    {banner.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Banner Details */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base leading-tight">
                    {banner.title?.trim() || (
                      <span className="text-neutral-400 italic font-normal text-sm">
                        [Image Only Banner - No Headline]
                      </span>
                    )}
                  </h3>
                  {banner.highlighted_text && (
                    <p className="text-xs font-semibold text-[#ff4b77]">
                      {banner.highlighted_text}
                    </p>
                  )}
                  {banner.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                      {banner.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                    <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px]">
                      {banner.primary_cta_text
                        ? `CTA: ${banner.primary_cta_text}`
                        : banner.primary_cta_link
                        ? `Link: ${banner.primary_cta_link}`
                        : "Pure Graphic"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BannerForm
                      banner={banner}
                      trigger={
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
                        >
                          Edit
                        </button>
                      }
                    />
                    <BannerActions id={banner.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
