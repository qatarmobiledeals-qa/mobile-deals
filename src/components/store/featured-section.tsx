import React from "react";
import Link from "next/link";
import { Product } from "@/types/database";
import { ProductCard } from "@/components/store/product-card";
import { ArrowRight } from "lucide-react";

interface FeaturedSectionProps {
  products: Product[];
  currency?: string;
}

export function FeaturedSection({
  products = [],
  currency = "QAR",
}: FeaturedSectionProps) {
  if (products.length === 0) return null;

  const visibleProducts = products.slice(0, 10);

  return (
    <section className="py-6 sm:py-10 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 sm:h-6 bg-[#8A1538] rounded-full inline-block" />
            <div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-neutral-900">
                Featured Gear
              </h2>
            </div>
          </div>

          <Link
            href="/products"
            className="group inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#8A1538] hover:text-[#6e132d] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Exact same 5-column desktop (max 10), 3-column tablet, 2-column mobile (max 6 on mobile) matching Today's Best Deals */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {visibleProducts.map((prod, idx) => (
              // On mobile: only show first 6 cards; on sm+ show all up to 10
              <div key={prod.id} className={`h-full ${idx >= 6 ? "hidden sm:block" : ""}`}>
                <ProductCard product={prod} currency={currency} />
              </div>
            ))}
          </div>

          {/* Mobile "View All" — matching Today's Best Deals */}
          <div className="mt-5 flex justify-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#8A1538] text-white text-sm font-bold rounded-xl shadow hover:bg-[#720e2c] active:scale-95 transition-all"
            >
              <span>View All Featured</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
