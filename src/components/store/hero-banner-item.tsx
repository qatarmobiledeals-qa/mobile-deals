import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Wrench } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { getOptimizedImageUrl } from "@/lib/cloudinary";

export interface HeroBannerData {
  title?: string | null;
  highlighted_text?: string | null;
  description?: string | null;
  primary_cta_text?: string | null;
  primary_cta_link?: string | null;
  secondary_cta_text?: string | null;
  secondary_cta_link?: string | null;
  desktop_image_url: string;
  mobile_image_url?: string | null;
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
  const whatsappCleanNumber = whatsappNumber.replace(/[^\d]/g, "");

  const desktopImage =
    banner.desktop_image_url ||
    "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=1400&auto=format&fit=crop&q=80";
  const mobileImage = banner.mobile_image_url || desktopImage;

  const hasTitle = Boolean(banner.title && banner.title.trim().length > 0);
  const hasTag = Boolean(banner.highlighted_text && banner.highlighted_text.trim().length > 0);
  const hasDesc = Boolean(banner.description && banner.description.trim().length > 0);
  const hasPrimaryBtn = Boolean(banner.primary_cta_text && banner.primary_cta_text.trim().length > 0);
  const hasSecondaryBtn = Boolean(banner.secondary_cta_text && banner.secondary_cta_text.trim().length > 0);

  const hasAnyOverlay = hasTitle || hasTag || hasDesc || hasPrimaryBtn || hasSecondaryBtn;
  const isServiceBtn = Boolean(
    banner.primary_cta_link?.includes("service") ||
      banner.primary_cta_text?.toLowerCase().includes("service")
  );

  const primaryHref = (() => {
    if (banner.primary_cta_link && banner.primary_cta_link.trim()) {
      return banner.primary_cta_link.trim();
    }
    const text = (banner.primary_cta_text || "").toLowerCase();
    if (text.includes("service") || text.includes("repair") || text.includes("support")) {
      return "/service-enquiry";
    }
    if (text.includes("product") || text.includes("catalog") || text.includes("shop all")) {
      return "/products";
    }
    if (text.includes("categor")) {
      return "/#categories";
    }
    return "/#deals";
  })();

  const defaultWhatsappLink = `https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
    `Hello Mobile Deals 👋 I saw your banner and want to place an order.`
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

  const content = (
    <div className="relative w-full h-[220px] xs:h-[260px] sm:h-[340px] md:h-[420px] lg:h-[480px] xl:h-[520px] flex items-center overflow-hidden">
      {/* 1. Full-Bleed Background Image (Desktop & Mobile Responsive) */}
      <div className="absolute inset-0 w-full h-full">
        {/* Desktop Image */}
        <div className={`relative w-full h-full ${banner.mobile_image_url ? "hidden md:block" : "block"}`}>
          <Image
            src={getOptimizedImageUrl(desktopImage, "hero_desktop")}
            alt={banner.title || "Mobile Deals Qatar"}
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
              alt={banner.title || "Mobile Deals Qatar"}
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover object-center w-full h-full"
            />
          </div>
        )}
      </div>

      {/* 2. Gradient Scrim for Text Legibility (Only shown if title or description is present) */}
      {(hasTitle || hasDesc) && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent z-10 pointer-events-none" />
      )}

      {/* 3. Text Content Overlay (Headline, Tag, Subtitle) */}
      {(hasTitle || hasTag || hasDesc) && (
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-10 md:px-14 lg:px-16 py-4 sm:py-8 pb-16 sm:pb-24 pointer-events-auto">
          <div className="max-w-2xl lg:max-w-3xl space-y-2 sm:space-y-3.5">
            {/* Small Heading Tag */}
            {hasTag && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-black/60 border border-white/20 text-[#ff4b77] sm:text-amber-400 text-[10px] sm:text-sm font-black tracking-wider uppercase drop-shadow-sm">
                <span>{banner.highlighted_text}</span>
              </div>
            )}

            {/* Main Headline */}
            {hasTitle && (
              <h1 className="text-lg sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] sm:leading-[1.1] drop-shadow-lg">
                {banner.title}
              </h1>
            )}

            {/* Description */}
            {hasDesc && (
              <p className="text-[11px] sm:text-sm md:text-base text-neutral-200 font-medium max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-md">
                {banner.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. Action Buttons Pinned to Bottom Left Side */}
      {(hasPrimaryBtn || hasSecondaryBtn) && (
        <div className="absolute bottom-2.5 sm:bottom-6 md:bottom-7 left-0 right-0 z-30 pointer-events-none">
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
                  <span>{banner.primary_cta_text}</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              {/* Secondary CTA Button (WhatsApp - Compact on mobile) */}
              {hasSecondaryBtn && (
                <a
                  href={banner.secondary_cta_link || defaultWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-30 inline-flex items-center gap-1 sm:gap-2 p-1.5 sm:px-6 sm:py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[10px] sm:text-sm shadow-md sm:shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  aria-label="Order on WhatsApp"
                >
                  <WhatsAppIcon className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                  <span className="hidden sm:inline">{banner.secondary_cta_text}</span>
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
