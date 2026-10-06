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
    variants.length > 0 ? variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

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

  const whatsAppUrl = generateProductWhatsAppUrl({
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

      {/* ── Pricing block ── */}
      <div className="flex items-center gap-3 flex-wrap p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60">
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

      {/* ── Variant selector ── */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-neutral-500 tracking-wider">
            Select Model / Variant
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? "border-[#8A1538] bg-[#8A1538]/5 text-[#8A1538] ring-2 ring-[#8A1538]/20"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {variant.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quantity + Add to Cart — same row ── */}
      <div className="space-y-2 w-full">
        <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Quantity</span>
        <div className="flex items-center gap-2.5 sm:gap-3 w-full">
          {/* Stepper */}
          <div className="flex items-center border border-neutral-200 rounded-xl bg-white overflow-hidden shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-2.5 sm:px-3 py-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 sm:w-10 text-center font-bold text-sm text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-2.5 sm:px-3 py-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 sm:flex-initial py-2.5 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm hover:shadow-md bg-[#8A1538] hover:bg-[#700f2c] text-white cursor-pointer"
          >
            {addedToast ? (
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
          onClick={handleBuyWithCOD}
          className="py-3.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
        >
          <span>Cash on Delivery</span>
        </button>

        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-3.5 px-3 rounded-2xl bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
        >
          <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
          <span>Order via WhatsApp</span>
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
