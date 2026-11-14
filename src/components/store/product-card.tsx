"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Product } from "@/types/database";
import { Heart, ShoppingCart, Check, Gift } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import { resolveProductContent } from "@/lib/i18n/content-resolver";
import { formatPrice } from "@/lib/formatters";

interface ProductCardProps {
  product: Product;
  currency?: string;
  priority?: boolean;
}

export function ProductCard({ product, currency = "QAR", priority = false }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations("product");
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);

  const resolved = resolveProductContent(product, locale);

  const primaryImgObj =
    resolved.product_images.find((img) => img.is_primary) ||
    resolved.product_images[0] ||
    null;
  const primaryImage = primaryImgObj?.image_url || null;
  const primaryAlt = primaryImgObj?.displayAltText || resolved.displayName;

  const optimizedImgUrl = getOptimizedImageUrl(primaryImage, "card");
  const inWishlist = isInWishlist(product.id);

  // Free Gift Promotion Data
  const giftImage = product.specifications?.gift_image?.trim() || "";
  const giftName = resolved.displayFreeGift?.trim() || "";
  const isGiftEnabled =
    product.specifications?.gift_enabled !== "false" &&
    Boolean(giftName || giftImage);

  // Filter out badge_text if it is accidentally set to the gift name or gift keyword
  const badgeTextTrimmed = resolved.displayBadgeText?.trim() || "";
  const badgeLower = badgeTextTrimmed.toLowerCase();
  const badgeIsGift =
    badgeLower.includes("gift") ||
    badgeTextTrimmed.includes("هدية") ||
    (giftName && badgeLower === giftName.toLowerCase()) ||
    (giftName && badgeTextTrimmed && giftName.toLowerCase().includes(badgeLower));

  let topBadge: { text: string; variant: "discount" | "deal" | "new" | "default" } | null = null;

  if (product.is_today_deal) {
    topBadge = { text: t("todayDeal"), variant: "deal" };
  } else if (product.is_best_deal) {
    topBadge = { text: t("bestDeal"), variant: "deal" };
  } else if (product.is_best_seller) {
    topBadge = { text: t("bestSeller"), variant: "default" };
  } else if (product.is_new_arrival) {
    topBadge = { text: t("newArrival"), variant: "new" };
  } else if (badgeTextTrimmed && !badgeIsGift) {
    topBadge = { text: badgeTextTrimmed, variant: "default" };
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      productName: resolved.displayName,
      productSlug: product.slug,
      price: product.price,
      imageUrl: optimizedImgUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative flex flex-col h-full rounded-2xl sm:rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] hover:border-[#8A1538]/25 hover:-translate-y-1 transition-all duration-300 overflow-hidden">

      {/* ── Image area with overlaid badge & wishlist ── */}
      <Link href={`/products/${product.slug}`} className="block relative shrink-0">
        <div className="relative w-full aspect-square bg-gradient-to-b from-neutral-50/80 via-white to-neutral-50/40">
          {primaryImage ? (
            <Image
              src={optimizedImgUrl}
              alt={primaryAlt}
              fill
              sizes="(max-width: 640px) 180px, (max-width: 1024px) 260px, 300px"
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300 ease-out"
              {...(priority ? { priority: true } : { loading: "lazy" })}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <span className="text-4xl">📱</span>
            </div>
          )}

          {/* Deal Badge — top-start overlay on image */}
          {topBadge && (
            <span
              className={`absolute top-2 start-2 z-10 inline-flex items-center px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black tracking-wider uppercase shadow-sm ${
                topBadge.variant === "discount"
                  ? "bg-rose-50 text-[#8A1538] border border-rose-200/80"
                  : topBadge.variant === "deal"
                  ? "bg-amber-50 text-amber-800 border border-amber-200/80"
                  : topBadge.variant === "new"
                  ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                  : "bg-neutral-100 text-neutral-800 border border-neutral-200"
              }`}
            >
              {topBadge.text}
            </span>
          )}

          {/* Wishlist — top-end overlay on image */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`absolute top-2 end-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm ${
              inWishlist
                ? "text-[#8A1538] bg-white shadow-rose-100"
                : "text-neutral-400 bg-white/80 hover:text-[#8A1538] hover:bg-white hover:scale-105"
            }`}
            aria-label={t("toggleWishlist")}
          >
            <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-current" : ""}`} />
          </button>

          {/* Free Gift badge — bottom-end overlay on image */}
          {isGiftEnabled && (
            <div
              className="absolute bottom-2 end-2 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-amber-300/90 rounded-full px-2 py-1 shadow-md hover:scale-105 transition-transform"
              title={giftName ? t("freeGiftNamed", { gift: giftName }) : t("includesFreeGift")}
            >
              {giftImage ? (
                <div className="relative w-5 h-5 shrink-0 overflow-hidden rounded-full bg-amber-50 border border-amber-200 shadow-2xs">
                  <Image
                    src={giftImage}
                    alt={giftName || t("freeGiftBadge")}
                    fill
                    sizes="20px"
                    className="object-contain p-0.5"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Gift className="w-2.5 h-2.5 text-amber-600" />
                </div>
              )}
              <span className="text-[9px] font-black text-amber-800 uppercase tracking-wide leading-none">
                {t("freeGiftBadge")}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Card body — compact, single-line title with dots (...) & natural tight spacing ── */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        {/* Brand */}
        {resolved.displayBrandName && (
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-0.5 truncate">
            {resolved.displayBrandName}
          </div>
        )}

        {/* Title — Single line with dots (...) */}
        <Link
          href={`/products/${product.slug}`}
          className="block group-hover:text-[#8A1538] transition-colors mb-1"
        >
          <h3
            className="text-xs sm:text-sm font-bold text-neutral-900 truncate"
            title={resolved.displayName}
          >
            {resolved.displayName}
          </h3>
        </Link>

        {/* Short description / specs — Single line with dots (...) */}
        <p
          className="text-[10px] sm:text-xs text-neutral-500 truncate font-normal mb-2"
          title={resolved.displayShortDescription || ""}
        >
          {resolved.displayShortDescription || "\u00A0"}
        </p>

        {/* Flexible spacer pushes price + add to cart button to card bottom */}
        <div className="flex-1" />

        {/* Pricing block */}
        <div className="flex items-baseline gap-1.5 flex-wrap mb-3">
          <span className="text-sm sm:text-base font-black text-[#8A1538] tracking-tight">
            {formatPrice(product.price, locale, currency)}
          </span>
          {product.compare_at_price &&
            product.compare_at_price > product.price && (
              <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                {formatPrice(product.compare_at_price, locale, currency)}
              </span>
            )}
        </div>

        {/* Add to Cart button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className={`w-full py-2 sm:py-2.5 px-3 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            product.stock <= 0
              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              : added
              ? "bg-emerald-700 text-white"
              : "bg-[#8A1538] hover:bg-[#720e2c] text-white active:scale-[0.98] hover:shadow-md cursor-pointer"
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-100" />
              <span>{t("added")}</span>
            </>
          ) : product.stock <= 0 ? (
            <span>{t("outOfStock")}</span>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span>{t("addToCart")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
