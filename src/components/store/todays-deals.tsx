"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types/database";
import { ProductCard } from "@/components/store/product-card";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

interface TodaysDealsProps {
  products: Product[];
  currency?: string;
}

export function TodaysDeals({ products = [], currency = "QAR" }: TodaysDealsProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num: number) => String(num).padStart(2, "0");

  const visibleProducts = products.slice(0, 10);
  const hasMore = products.length > 10;

  return (
    <section id="deals" className="py-6 sm:py-10 md:py-12 bg-neutral-50/60 border-t border-b border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 sm:h-6 bg-[#8A1538] rounded-full inline-block" />
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
              Today&apos;s Best Deals
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-[#8A1538]" />
              <span className="text-[11px] text-neutral-600">Ends in</span>
              <div className="flex items-center gap-1 font-mono font-bold text-white">
                <span className="bg-[#6E132D] px-1.5 py-0.5 rounded text-[11px]">{formatDigit(timeLeft.hours)}</span>
                <span className="text-neutral-900">:</span>
                <span className="bg-[#6E132D] px-1.5 py-0.5 rounded text-[11px]">{formatDigit(timeLeft.minutes)}</span>
                <span className="text-neutral-900">:</span>
                <span className="bg-[#6E132D] px-1.5 py-0.5 rounded text-[11px]">{formatDigit(timeLeft.seconds)}</span>
              </div>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#8A1538] hover:text-[#6e102c] transition-all group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-white border border-dashed border-neutral-300">
            <Sparkles className="w-10 h-10 mx-auto text-[#F59E0B] mb-2" />
            <h3 className="text-base font-bold text-neutral-800">No Active Deals Scheduled Right Now</h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              Check back soon for our daily exclusive discount offers and bundles.
            </p>
            <Link
              href="/#categories"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8A1538] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#720e2c]"
            >
              Browse Categories
            </Link>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {visibleProducts.map((prod, idx) => (
                // On mobile: only show first 6 cards; on sm+ show all
                <div key={prod.id} className={`h-full ${idx >= 6 ? "hidden sm:block" : ""}`}>
                  <ProductCard product={prod} currency={currency} priority={idx < 2} />
                </div>
              ))}
            </div>
            {/* Mobile "View All" — always visible so users can reach the full listing */}
            <div className="mt-5 flex justify-center sm:hidden">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#8A1538] text-white text-sm font-bold rounded-xl shadow hover:bg-[#720e2c] active:scale-95 transition-all"
              >
                <span>View All Deals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
