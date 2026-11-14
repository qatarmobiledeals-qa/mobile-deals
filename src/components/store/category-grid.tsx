"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Category } from "@/types/database";
import { resolveCategoryContent } from "@/lib/i18n/content-resolver";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  PackageOpen,
} from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/cloudinary";

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories = [] }: CategoryGridProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      if (isRtl) {
        const absLeft = Math.abs(scrollLeft);
        setCanScrollPrev(absLeft > 10);
        setCanScrollNext(absLeft < maxScroll - 10);
      } else {
        setCanScrollPrev(scrollLeft > 10);
        setCanScrollNext(scrollLeft < maxScroll - 10);
      }
    }
  }, [isRtl]);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories, checkScroll]);

  const handleScroll = (direction: "prev" | "next") => {
    if (scrollRef.current) {
      const magnitude = scrollRef.current.clientWidth * 0.85;
      const multiplier = isRtl ? (direction === "prev" ? 1 : -1) : (direction === "prev" ? -1 : 1);
      scrollRef.current.scrollBy({ left: magnitude * multiplier, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <section id="categories" className="py-6 sm:py-10 md:py-14 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header (Matching Referral: Start Bar + Title | End: View All) */}
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-7">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 sm:h-6 bg-[#8A1538] rounded-full inline-block" />
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
              {tHome("shopByCategory")}
            </h2>
          </div>

          {/* Controls: Scroll Buttons (Desktop) & View All */}
          <div className="flex items-center gap-3">
            {categories.length > 6 && (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScroll("prev")}
                  disabled={!canScrollPrev}
                  aria-label={tHome("prevCategories")}
                  className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-[#8A1538] hover:text-white hover:border-[#8A1538] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-2xs active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll("next")}
                  disabled={!canScrollNext}
                  aria-label={tHome("nextCategories")}
                  className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-[#8A1538] hover:text-white hover:border-[#8A1538] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-2xs active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            )}

            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#8A1538] hover:text-[#6e102c] transition-all group"
            >
              <span>{tCommon("viewAll")}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {categories.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-neutral-50 border border-neutral-200/80 shadow-xs">
            <PackageOpen className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
            <h3 className="text-base font-bold text-neutral-800">{tHome("noCategoriesFound")}</h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-5">
              {tHome("noCategoriesDesc")}
            </p>
            <Link
              href="/#deals"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8A1538] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#6e102c] transition-all"
            >
              <span>{tHome("exploreDeals")}</span>
            </Link>
          </div>
        ) : (
          <>
            {/* 1. Mobile 4-Column Compact Grid (Matching Referral Image Exactly) */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:hidden gap-2 sm:gap-3">
              {categories.map((cat) => {
                const resolvedCat = resolveCategoryContent(cat, locale);
                const displayImg = getOptimizedImageUrl(cat.image_url, "thumb");
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group flex flex-col items-center text-center p-2 rounded-2xl bg-neutral-50 border border-neutral-100/90 active:scale-95 transition-all"
                  >
                    <div className="relative w-13 h-13 sm:w-16 sm:h-16 mb-1.5 rounded-xl bg-white shadow-2xs flex items-center justify-center p-1.5">
                      {cat.image_url ? (
                        <Image
                          src={displayImg}
                          alt={resolvedCat.displayName}
                          fill
                          sizes="60px"
                          className="object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xl">📦</span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-neutral-800 line-clamp-2 leading-tight">
                      {resolvedCat.displayName}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* 2. Desktop 6-Card Slider */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="hidden lg:flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((cat) => {
                const resolvedCat = resolveCategoryContent(cat, locale);
                const displayImg = getOptimizedImageUrl(cat.image_url, "thumb");
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group shrink-0 w-[calc((100%-5*16px)/6)] snap-start flex flex-col items-center text-center p-5 rounded-3xl bg-gradient-to-b from-neutral-50/90 via-white to-neutral-50/50 border border-neutral-200/90 hover:border-[#8A1538]/40 shadow-2xs hover:shadow-xl hover:shadow-[#8A1538]/10 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Subtle Top Accent Glow on Hover */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8A1538] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Floating Image Bubble with Soft Drop Shadow */}
                    <div className="relative w-22 h-22 mb-3 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center p-2.5 group-hover:scale-108 group-hover:rotate-1 group-hover:shadow-md transition-all duration-300">
                      {cat.image_url ? (
                        <Image
                          src={displayImg}
                          alt={resolvedCat.displayName}
                          fill
                          sizes="90px"
                          className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>

                    {/* Category Title */}
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-800 line-clamp-2 leading-snug group-hover:text-[#8A1538] transition-colors mb-1.5">
                      {resolvedCat.displayName}
                    </h3>

                    {/* Micro Explore Tag */}
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 group-hover:text-[#8A1538] transition-colors mt-auto">
                      <span>{tHome("shopNow")}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
