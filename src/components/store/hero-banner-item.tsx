"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Wrench } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import { resolveBannerContent } from "@/lib/i18n/content-resolver";
import type { Banner, TranslationMetadata } from "@/types/database";

export interface HeroBannerData {
  id?: string;
  title?: string | null;
  title_ar?: string | null;
  highlighted_text?: string | null;
  highlighted_text_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  primary_cta_text?: string | null;
  primary_cta_text_ar?: string | null;
  primary_cta_link?: string | null;
  secondary_cta_text?: string | null;
  secondary_cta_text_ar?: string | null;
  secondary_cta_link?: string | null;
  desktop_image_url: string;
  mobile_image_url?: string | null;
  cloudinary_public_id?: string | null;
  position?: string;
  display_order?: number;
  is_active?: boolean;
  is_arabic_reviewed?: boolean;
  arabic_updated_at?: string | null;
  translation_metadata?: TranslationMetadata | null;
}

interface HeroBannerItemProps {
  banner: HeroBannerData;
  whatsappNumber?: string;
  priority?: boolean;
}

export function HeroBannerItem({
  banner,
  whatsappNumber = "+97455000000",
  priority = false,
}: HeroBannerItemProps) {
  const locale = useLocale();
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");

  const resolvedBanner = resolveBannerContent(
    {
      id: banner.id ?? "",
      title: banner.title ?? null,
      title_ar: banner.title_ar ?? null,
      highlighted_text: banner.highlighted_text ?? null,
      highlighted_text_ar: banner.highlighted_text_ar ?? null,
      description: banner.description ?? null,
      description_ar: banner.description_ar ?? null,
      primary_cta_text: banner.primary_cta_text ?? null,
      primary_cta_text_ar: banner.primary_cta_text_ar ?? null,
      primary_cta_link: banner.primary_cta_link ?? null,
      secondary_cta_text: banner.secondary_cta_text ?? null,
      secondary_cta_text_ar: banner.secondary_cta_text_ar ?? null,
      secondary_cta_link: banner.secondary_cta_link ?? null,
      desktop_image_url: banner.desktop_image_url,
      mobile_image_url: banner.mobile_image_url ?? null,
      cloudinary_public_id: banner.cloudinary_public_id ?? null,
      position: banner.position ?? "hero",
      display_order: banner.display_order ?? 0,
      is_active: banner.is_active ?? true,
      is_arabic_reviewed: banner.is_arabic_reviewed,
      arabic_updated_at: banner.arabic_updated_at ?? null,
      translation_metadata: banner.translation_metadata ?? null,
      created_at: "",
      updated_at: "",
    } satisfies Banner,
    locale
  );

  const whatsappCleanNumber = whatsappNumber.replace(/[^\d]/g, "");

  const desktopImage =
    banner.desktop_image_url ||
    "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=1400&auto=format&fit=crop&q=80";
  const mobileImage = banner.mobile_image_url || desktopImage;

  const displayTitle = resolvedBanner.displayTitle;
  const displayTag = resolvedBanner.displayHighlightedText;
  const displayDescription = resolvedBanner.displayDescription;
  const displayPrimaryCta = resolvedBanner.displayPrimaryCtaText;
  const displaySecondaryCta = resolvedBanner.displaySecondaryCtaText;

  const hasTitle = Boolean(displayTitle && displayTitle.trim().length > 0);
  const hasTag = Boolean(displayTag && displayTag.trim().length > 0);
  const hasDesc = Boolean(displayDescription && displayDescription.trim().length > 0);
  const hasPrimaryBtn = Boolean(displayPrimaryCta && displayPrimaryCta.trim().length > 0);
  const hasSecondaryBtn = Boolean(displaySecondaryCta && displaySecondaryCta.trim().length > 0);

  const isServiceBtn = Boolean(
    banner.primary_cta_link?.includes("service") ||
      banner.primary_cta_text?.toLowerCase().includes("service") ||
      displayPrimaryCta?.includes("صيانة")
  );

  const primaryHref = (() => {
    if (banner.primary_cta_link && banner.primary_cta_link.trim()) {
      return banner.primary_cta_link.trim();
    }
    const text = (banner.primary_cta_text || "").toLowerCase();
    const arText = displayPrimaryCta || "";
    if (
      text.includes("service") ||
      text.includes("repair") ||
      text.includes("support") ||
      arText.includes("صيانة") ||
      arText.includes("إصلاح")
    ) {
      return "/service-enquiry";
    }
    if (
      text.includes("product") ||
      text.includes("catalog") ||
      text.includes("shop all") ||
      arText.includes("المنتجات") ||
      arText.includes("المتجر")
    ) {
      return "/products";
    }
    if (text.includes("categor") || arText.includes("الأقسام")) {
      return "/#categories";
    }
    return "/#deals";
  })();

  const defaultWhatsappLink = `https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
    tHome("bannerWhatsappMessage")
  )}`;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes("#deals")) {
      const elem = document.getElementById("deals");
      if (elem) {
        e.preventDefault();
        elem.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", "#deals");
      }
    } else if (href.includes("#categories")) {
      const elem = document.getElementById("categories");
      if (elem) {
        e.preventDefault();
        elem.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", "#categories");
      }
    }
  };

  const altText = displayTitle || tCommon("storeNameQatar");

  const content = (
    <div className="relative w-full h-[220px] xs:h-[260px] sm:h-[340px] md:h-[420px] lg:h-[480px] xl:h-[520px] flex items-center overflow-hidden">
      {/* 1. Full-Bleed Background Image (Desktop & Mobile Responsive) */}
      <div className="absolute inset-0 w-full h-full">
        {/* Desktop Image */}
        <div className={`relative w-full h-full ${banner.mobile_image_url ? "hidden md:block" : "block"}`}>
          <Image
            src={getOptimizedImageUrl(desktopImage, "hero_desktop")}
            alt={altText}
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover object-center w-full h-full"
          />
        </div>

        {/* Mobile Image (if provided) */}
        {banner.mobile_image_url && (
          <div className="relative w-full h-full block md:hidden">
            <Image
              src={getOptimizedImageUrl(mobileImage, "hero_mobile")}
              alt={altText}
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover object-center w-full h-full"
            />
          </div>
        )}
      </div>

      {/* 2. Gradient Scrim for Text Legibility (Directional LTR / RTL from inline-start) */}
      {(hasTitle || hasDesc) && (
        <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-black/75 via-black/35 to-transparent z-10 pointer-events-none" />
      )}

      {/* 3. Text Content Overlay (Headline, Tag, Subtitle) */}
      {(hasTitle || hasTag || hasDesc) && (
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-10 md:px-14 lg:px-16 py-4 sm:py-8 pb-16 sm:pb-24 pointer-events-auto">
          <div className="max-w-2xl lg:max-w-3xl space-y-2 sm:space-y-3.5">
            {/* Small Heading Tag */}
            {hasTag && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-black/60 border border-white/20 text-[#ff4b77] sm:text-amber-400 text-[10px] sm:text-sm font-black tracking-wider uppercase drop-shadow-sm">
                <span>{displayTag}</span>
              </div>
            )}

            {/* Main Headline */}
            {hasTitle && (
              <h1 className="text-lg sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] sm:leading-[1.1] drop-shadow-lg">
                {displayTitle}
              </h1>
            )}

            {/* Description */}
            {hasDesc && (
              <p className="text-[11px] sm:text-sm md:text-base text-neutral-200 font-medium max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-md">
                {displayDescription}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. Action Buttons Pinned to Bottom Start Side */}
      {(hasPrimaryBtn || hasSecondaryBtn) && (
        <div className="absolute bottom-2.5 sm:bottom-6 md:bottom-7 inset-x-0 z-30 pointer-events-none">
          <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-10 md:px-14 lg:px-16 pointer-events-auto">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3.5">
              {/* Primary CTA Button (Reduced size on mobile) */}
              {hasPrimaryBtn && (
                <Link
                  href={primaryHref}
                  onClick={(e) => handleLinkClick(e, primaryHref)}
                  className="relative z-30 inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-7 sm:py-3 rounded-full bg-[#8A1538] hover:bg-[#6c102c] text-white font-bold text-[10px] sm:text-sm shadow-md sm:shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group cursor-pointer"
                >
                  {isServiceBtn && <Wrench className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-300" />}
                  <span>{displayPrimaryCta}</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </Link>
              )}

              {/* Secondary CTA Button (WhatsApp - Compact on mobile) */}
              {hasSecondaryBtn && (
                <a
                  href={banner.secondary_cta_link || defaultWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-30 inline-flex items-center gap-1 sm:gap-2 p-1.5 sm:px-6 sm:py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[10px] sm:text-sm shadow-md sm:shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  aria-label={tHome("orderOnWhatsApp")}
                >
                  <WhatsAppIcon className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                  <span className="hidden sm:inline">{displaySecondaryCta}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If no buttons are present but a destination link exists, make the whole banner clickable
  if (!hasPrimaryBtn && !hasSecondaryBtn && (banner.primary_cta_link || isServiceBtn)) {
    return (
      <Link
        href={primaryHref}
        onClick={(e) => handleLinkClick(e, primaryHref)}
        className="block w-full h-full cursor-pointer relative z-20"
      >
        {content}
      </Link>
    );
  }

  return content;
}
