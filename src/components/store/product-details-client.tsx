"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Product, ProductVariant } from "@/types/database";
import { useCart } from "@/hooks/use-cart";
import { generateProductWhatsAppUrl } from "@/lib/whatsapp";
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  Gift,
  CheckCircle2,
  Minus,
  Plus,
  Check,
  AlertCircle,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface ProductDetailsClientProps {
  product: Product;
  whatsappNumber?: string;
  currency?: string;
}

export function ProductDetailsClient({
  product,
  whatsappNumber = "+97455000000",
  currency = "QAR",
}: ProductDetailsClientProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const variants = product.product_variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    () => {
      if (variants.length === 0) return null;
      // Default to the first in-stock variant if available
      const firstInStock = variants.find((v) => (v.stock ?? 0) > 0);
      return firstInStock || variants[0];
    }
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Stock calculations for currently selected variant or main product
  const currentStock = selectedVariant
    ? (selectedVariant.stock ?? 0)
    : (product.stock ?? 0);
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;

  const currentPrice = selectedVariant?.price ?? product.price;
  const comparePrice = selectedVariant?.compare_at_price ?? product.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
    : 0;

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.image_url ||
    product.product_images?.[0]?.image_url ||
    "";

  // Free gift data
  const giftName = product.free_gift?.trim() || "";
  const giftImage = product.specifications?.gift_image?.trim() || "";
  const isGiftEnabled =
    product.specifications?.gift_enabled !== "false" &&
    Boolean(giftName || giftImage);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(
      {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.name,
        price: currentPrice,
        imageUrl: primaryImage,
      },
      quantity
    );
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyWithCOD = () => {
    if (isOutOfStock) return;
    const directItem = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      price: currentPrice,
      imageUrl: primaryImage,
      quantity: quantity,
    };
    try {
      sessionStorage.setItem("direct_checkout_item", JSON.stringify([directItem]));
    } catch (e) {
      console.warn("Could not save direct checkout item", e);
    }
    router.push("/checkout?direct=1");
  };

  const whatsAppUrl = isOutOfStock
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi Mobile Deals Qatar, I would like to enquire about stock availability for ${product.name}${
          selectedVariant?.name ? ` (${selectedVariant.name})` : ""
        }. When will this item be back in stock?`
      )}`
    : generateProductWhatsAppUrl({
        storeNumber: whatsappNumber,
        productName: product.name,
        variantName: selectedVariant?.name,
        price: currentPrice,
        quantity: quantity,
        currency: currency,
      });

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 max-w-full">
      {/* ── Brand + badges row ── */}
      <div className="flex items-center flex-wrap gap-2">
        {product.brand && (
          <span className="px-2.5 py-1 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-600 uppercase tracking-wider">
            {product.brand.name}
          </span>
        )}
        {isGiftEnabled && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-xs font-black uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5 text-amber-600" />
            {giftName || "Free Gift"}
          </span>
        )}
        {!isGiftEnabled && product.badge_text && (
          <span className="px-2.5 py-1 bg-rose-50 text-[#8A1538] border border-rose-200/80 rounded-full text-xs font-bold uppercase tracking-wider">
            {product.badge_text}
          </span>
        )}
      </div>

      {/* ── Product name + short description ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
          {product.name}
        </h1>
        {product.short_description && (
          <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
            {product.short_description}
          </p>
        )}
      </div>

      {/* ── Pricing & Stock block ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl sm:text-4xl font-black text-[#8A1538] tracking-tight">
            {currency} {currentPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <>
              <span className="text-base text-neutral-400 line-through">
                {currency} {comparePrice.toLocaleString()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                Save {discountPercent}%
              </span>
            </>
          )}
        </div>

        {/* Dynamic stock status */}
        <div className="shrink-0">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Out of Stock</span>
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Only {currentStock} left in stock</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>In Stock</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Variant selector ── */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-neutral-500 tracking-wider">
              Select Model / Variant
            </p>
            {selectedVariant && (
              <span className="text-xs text-neutral-500">
                Selected: <strong className="text-neutral-900">{selectedVariant.name}</strong>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const isVarOutOfStock = (variant.stock ?? 0) <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariant(variant);
                    setQuantity(1);
                  }}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? isVarOutOfStock
                        ? "border-rose-400 bg-rose-50/80 text-rose-800 ring-2 ring-rose-300/40"
                        : "border-[#8A1538] bg-[#8A1538]/5 text-[#8A1538] ring-2 ring-[#8A1538]/20"
                      : isVarOutOfStock
                      ? "border-neutral-200 bg-neutral-100/90 text-neutral-400 hover:border-neutral-300"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  <span className={isVarOutOfStock ? "line-through opacity-75" : ""}>
                    {variant.name}
                  </span>
                  {isVarOutOfStock ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                      Out of Stock
                    </span>
                  ) : (
                    (variant.stock ?? 0) <= 5 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {variant.stock} left
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quantity + Add to Cart — same row ── */}
      <div className="space-y-2 w-full">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Quantity</span>
          {isOutOfStock ? (
            <span className="text-xs font-bold text-rose-600">Currently unavailable</span>
          ) : isLowStock ? (
            <span className="text-xs font-semibold text-amber-700">Max available: {currentStock}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 w-full">
          {/* Stepper */}
          <div className={`flex items-center border border-neutral-200 rounded-xl bg-white overflow-hidden shadow-xs shrink-0 ${
            isOutOfStock ? "opacity-50 pointer-events-none" : ""
          }`}>
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-2.5 sm:px-3 py-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 sm:w-10 text-center font-bold text-sm text-neutral-900">
              {isOutOfStock ? 0 : quantity}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || quantity >= currentStock}
              onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
              className="px-2.5 sm:px-3 py-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`flex-1 sm:flex-initial py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              isOutOfStock
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300 shadow-none"
                : addedToast
                ? "bg-emerald-700 text-white cursor-pointer"
                : "bg-[#8A1538] hover:bg-[#700f2c] text-white active:scale-[0.99] hover:shadow-md cursor-pointer"
            }`}
          >
            {isOutOfStock ? (
              <>
                <AlertCircle className="w-4 h-4 text-neutral-400" />
                <span>Out of Stock</span>
              </>
            ) : addedToast ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── COD + WhatsApp side by side ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleBuyWithCOD}
          className={`py-3.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm transition-all ${
            isOutOfStock
              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300 shadow-none"
              : "bg-neutral-900 hover:bg-neutral-800 text-white hover:shadow-md active:scale-[0.99] cursor-pointer"
          }`}
        >
          <span>{isOutOfStock ? "Out of Stock" : "Cash on Delivery"}</span>
        </button>

        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`py-3.5 px-3 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99] ${
            isOutOfStock
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-[#25D366] hover:bg-[#1fb855]"
          }`}
        >
          <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
          <span>{isOutOfStock ? "Enquire on WhatsApp" : "Order via WhatsApp"}</span>
        </a>
      </div>

      {/* ── Free Gift card ── */}
      {isGiftEnabled && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80">
          {/* Gift image */}
          {giftImage ? (
            <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white border border-amber-100 shadow-xs">
              <Image
                src={giftImage}
                alt={giftName || "Free Gift"}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </div>
          ) : (
            <div className="w-14 h-14 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center">
              <Gift className="w-7 h-7 text-amber-600" />
            </div>
          )}
          {/* Gift info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                Free Gift Included
              </span>
            </div>
            {giftName && (
              <p className="text-sm font-bold text-neutral-900 truncate">{giftName}</p>
            )}
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
              ✓ Complimentary with this product
            </p>
          </div>
        </div>
      )}

      {/* ── Trust bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-600">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
          <Truck className="w-4 h-4 text-[#8A1538] shrink-0" />
          <span><strong>Fast Delivery</strong><br className="hidden sm:block" /> 24–48 hrs Qatar</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
          <ShieldCheck className="w-4 h-4 text-[#8A1538] shrink-0" />
          <span><strong>Warranty</strong><br className="hidden sm:block" /> {product.warranty || "1 Year Official"}</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><strong>100% Genuine</strong><br className="hidden sm:block" /> Sealed original unit</span>
        </div>
      </div>
    </div>
  );
}
