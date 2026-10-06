"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductImage } from "@/types/database";
import { getOptimizedImageUrl } from "@/lib/cloudinary";

interface ProductGalleryProps {
  images?: ProductImage[];
  productName: string;
}

export function ProductGallery({ images = [], productName }: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activeImage = images[selectedIdx]?.image_url || null;

  return (
    <div className="flex flex-col gap-3 w-full min-w-0 max-w-full">
      {/* Main Image Viewport — Fits fully above the fold on first view */}
      <div className="relative w-full h-[320px] sm:h-[380px] lg:h-[440px] bg-neutral-50/80 border border-neutral-100/80 rounded-3xl flex items-center justify-center overflow-hidden p-4 sm:p-6 shadow-2xs">
        {activeImage ? (
          <Image
            src={getOptimizedImageUrl(activeImage, "detail")}
            alt={images[selectedIdx]?.alt_text || productName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
            className="object-contain p-3 sm:p-4 transition-all duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-300">
            <span className="text-5xl">📱</span>
            <span className="text-xs text-neutral-400 mt-2 font-medium">No Image Available</span>
          </div>
        )}
      </div>

      {/* Thumbnails Row — Smooth horizontal swipe on mobile without moving the screen */}
      {images.length > 1 && (
        <div className="w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 w-full max-w-full scroll-smooth touch-pan-x overscroll-x-contain">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border p-1.5 shrink-0 overflow-hidden transition-all cursor-pointer ${
                  selectedIdx === idx
                    ? "border-[#8A1538] ring-2 ring-[#8A1538]/20 shadow-xs scale-102"
                    : "border-neutral-200 hover:border-neutral-300 opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={getOptimizedImageUrl(img.image_url, "thumb")}
                  alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
