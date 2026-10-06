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
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[440px] md:min-h-[520px] lg:min-h-[580px] flex items-center overflow-hidden">
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

      {/* 2. Gradient Scrim Overlay for Legibility (Only shown if there is text overlay) */}
      {hasAnyOverlay && (
        <>
          <div className={`absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent sm:from-black/80 sm:via-black/40 sm:to-transparent z-10 pointer-events-none ${!hasTitle && !hasDesc ? "opacity-60" : "opacity-100"}`} />
          <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />
        </>
      )}

      {/* 3. Text and Action Content Overlay (Optional) */}
      {hasAnyOverlay && (
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-10 md:px-14 lg:px-16 py-6 sm:py-16 pointer-events-auto">
          <div className="max-w-2xl lg:max-w-3xl space-y-2 sm:space-y-4 md:space-y-5">
            {/* Small Heading Tag */}
            {hasTag && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#ff4b77] sm:text-amber-400 text-[10px] sm:text-sm font-black tracking-wider uppercase drop-shadow-sm">
                <span>{banner.highlighted_text}</span>
              </div>
            )}

            {/* Main Headline */}
            {hasTitle && (
              <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] sm:leading-[1.08] drop-shadow-lg">
                {banner.title}
              </h1>
            )}

            {/* Description */}
            {hasDesc && (
              <p className="text-[11px] sm:text-sm md:text-base text-neutral-200 font-medium max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-md">
                {banner.description}
              </p>
            )}

            {/* Buttons Row */}
            {(hasPrimaryBtn || hasSecondaryBtn) && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1 sm:pt-3 relative z-30">
                {/* Primary CTA Button */}
                {hasPrimaryBtn && (
                  <Link
                    href={primaryHref}
                    onClick={(e) => handleLinkClick(e, primaryHref)}
                    className="relative z-30 inline-flex items-center gap-2 px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-full bg-[#8A1538] hover:bg-[#6c102c] text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group cursor-pointer"
                  >
                    {isServiceBtn && <Wrench className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{banner.primary_cta_text}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                {/* Secondary CTA Button (WhatsApp) */}
                {hasSecondaryBtn && (
                  <a
                    href={banner.secondary_cta_link || defaultWhatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-30 inline-flex items-center gap-1.5 sm:gap-2 p-2 sm:px-7 sm:py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[11px] sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    aria-label="Order on WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-white" />
                    <span className="hidden sm:inline">{banner.secondary_cta_text}</span>
                  </a>
                )}
              </div>
            )}
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
