"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Category } from "@/types/database";
import {
  Menu,
  Smartphone,
  Keyboard,
  Headphones,
  Zap,
  Watch,
  Sparkles,
  ShieldCheck,
  BatteryCharging,
  Gamepad2,
  Package,
  Tablet,
  Cable,
  MonitorSmartphone,
  Layers,
  Volume2,
  Camera,
  Car,
  HardDrive,
  Lightbulb,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

// Custom elegant Perfume Bottle icon matching Lucide style
function PerfumeBottleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      {...props}
    >
      {/* Spray pump cap */}
      <rect x="10" y="2" width="4" height="3" rx="0.5" />
      {/* Atomizer collar */}
      <rect x="9" y="5" width="6" height="2" rx="0.5" />
      {/* Glass bottle body */}
      <rect x="5" y="7" width="14" height="14" rx="2.5" />
      {/* Inner fragrance label / frame */}
      <rect x="8.5" y="11" width="7" height="6" rx="1" />
      {/* Spray mist */}
      <path d="M17.5 2.5h1.5" />
      <path d="M18.5 4.5h1.5" />
    </svg>
  );
}

interface CategoryNavProps {
  categories: Category[];
}

interface CategoryMeta {
  Icon: React.ElementType;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
}

/**
 * Intelligent icon and color mapper based on category slug, name, or icon_name
 */
const getCategoryMeta = (
  slug: string = "",
  name: string = "",
  iconName?: string | null
): CategoryMeta => {
  const text = `${iconName || ""} ${slug} ${name}`.toLowerCase();

  if (text.includes("keyboard") || text.includes("mouse")) {
    return {
      Icon: Keyboard,
      iconColor: "text-violet-600 group-hover:text-violet-700",
      badgeBg: "bg-violet-50 group-hover:bg-violet-100",
      badgeBorder: "border-violet-200/60 group-hover:border-violet-300",
    };
  }
  if (text.includes("holder") || text.includes("stand") || text.includes("mount")) {
    return {
      Icon: MonitorSmartphone,
      iconColor: "text-sky-600 group-hover:text-sky-700",
      badgeBg: "bg-sky-50 group-hover:bg-sky-100",
      badgeBorder: "border-sky-200/60 group-hover:border-sky-300",
    };
  }
  if (
    text.includes("earphone") ||
    text.includes("bud") ||
    text.includes("headphone") ||
    text.includes("airpod") ||
    text.includes("audio")
  ) {
    return {
      Icon: Headphones,
      iconColor: "text-pink-600 group-hover:text-pink-700",
      badgeBg: "bg-pink-50 group-hover:bg-pink-100",
      badgeBorder: "border-pink-200/60 group-hover:border-pink-300",
    };
  }
  if (text.includes("charger") || text.includes("adapter") || text.includes("charging")) {
    return {
      Icon: Zap,
      iconColor: "text-amber-500 group-hover:text-amber-600",
      badgeBg: "bg-amber-50 group-hover:bg-amber-100",
      badgeBorder: "border-amber-200/60 group-hover:border-amber-300",
    };
  }
  if (text.includes("cable") || text.includes("wire") || text.includes("cord")) {
    return {
      Icon: Cable,
      iconColor: "text-orange-600 group-hover:text-orange-700",
      badgeBg: "bg-orange-50 group-hover:bg-orange-100",
      badgeBorder: "border-orange-200/60 group-hover:border-orange-300",
    };
  }
  if (text.includes("watch") || text.includes("strap") || text.includes("band")) {
    return {
      Icon: Watch,
      iconColor: "text-emerald-600 group-hover:text-emerald-700",
      badgeBg: "bg-emerald-50 group-hover:bg-emerald-100",
      badgeBorder: "border-emerald-200/60 group-hover:border-emerald-300",
    };
  }
  if (
    text.includes("perfume") ||
    text.includes("fragrance") ||
    text.includes("attar") ||
    text.includes("oud") ||
    text.includes("scent")
  ) {
    return {
      Icon: PerfumeBottleIcon,
      iconColor: "text-fuchsia-600 group-hover:text-fuchsia-700",
      badgeBg: "bg-fuchsia-50 group-hover:bg-fuchsia-100",
      badgeBorder: "border-fuchsia-200/60 group-hover:border-fuchsia-300",
    };
  }
  if (
    text.includes("cover") ||
    text.includes("case") ||
    text.includes("glass") ||
    text.includes("protector") ||
    text.includes("guard")
  ) {
    return {
      Icon: ShieldCheck,
      iconColor: "text-teal-600 group-hover:text-teal-700",
      badgeBg: "bg-teal-50 group-hover:bg-teal-100",
      badgeBorder: "border-teal-200/60 group-hover:border-teal-300",
    };
  }
  if (text.includes("power") || text.includes("battery") || text.includes("bank")) {
    return {
      Icon: BatteryCharging,
      iconColor: "text-green-600 group-hover:text-green-700",
      badgeBg: "bg-green-50 group-hover:bg-green-100",
      badgeBorder: "border-green-200/60 group-hover:border-green-300",
    };
  }
  if (text.includes("speaker") || text.includes("sound") || text.includes("soundbar")) {
    return {
      Icon: Volume2,
      iconColor: "text-rose-600 group-hover:text-rose-700",
      badgeBg: "bg-rose-50 group-hover:bg-rose-100",
      badgeBorder: "border-rose-200/60 group-hover:border-rose-300",
    };
  }
  if (text.includes("game") || text.includes("gaming") || text.includes("toy") || text.includes("controller")) {
    return {
      Icon: Gamepad2,
      iconColor: "text-indigo-600 group-hover:text-indigo-700",
      badgeBg: "bg-indigo-50 group-hover:bg-indigo-100",
      badgeBorder: "border-indigo-200/60 group-hover:border-indigo-300",
    };
  }
  if (text.includes("tablet") || text.includes("ipad")) {
    return {
      Icon: Tablet,
      iconColor: "text-cyan-600 group-hover:text-cyan-700",
      badgeBg: "bg-cyan-50 group-hover:bg-cyan-100",
      badgeBorder: "border-cyan-200/60 group-hover:border-cyan-300",
    };
  }
  if (text.includes("phone") || text.includes("mobile") || text.includes("iphone") || text.includes("samsung")) {
    return {
      Icon: Smartphone,
      iconColor: "text-[#8A1538] group-hover:text-[#6e102c]",
      badgeBg: "bg-[#8A1538]/10 group-hover:bg-[#8A1538]/15",
      badgeBorder: "border-[#8A1538]/20 group-hover:border-[#8A1538]/30",
    };
  }
  if (text.includes("laptop") || text.includes("macbook") || text.includes("computer") || text.includes("pc")) {
    return {
      Icon: Layers,
      iconColor: "text-blue-600 group-hover:text-blue-700",
      badgeBg: "bg-blue-50 group-hover:bg-blue-100",
      badgeBorder: "border-blue-200/60 group-hover:border-blue-300",
    };
  }
  if (text.includes("camera") || text.includes("lens") || text.includes("photo")) {
    return {
      Icon: Camera,
      iconColor: "text-slate-700 group-hover:text-slate-900",
      badgeBg: "bg-slate-100 group-hover:bg-slate-200",
      badgeBorder: "border-slate-300/60 group-hover:border-slate-400",
    };
  }
  if (text.includes("car") || text.includes("automotive")) {
    return {
      Icon: Car,
      iconColor: "text-red-600 group-hover:text-red-700",
      badgeBg: "bg-red-50 group-hover:bg-red-100",
      badgeBorder: "border-red-200/60 group-hover:border-red-300",
    };
  }
  if (text.includes("storage") || text.includes("sd") || text.includes("memory") || text.includes("drive")) {
    return {
      Icon: HardDrive,
      iconColor: "text-yellow-700 group-hover:text-yellow-800",
      badgeBg: "bg-yellow-50 group-hover:bg-yellow-100",
      badgeBorder: "border-yellow-200/60 group-hover:border-yellow-300",
    };
  }
  if (text.includes("light") || text.includes("ring")) {
    return {
      Icon: Lightbulb,
      iconColor: "text-amber-600 group-hover:text-amber-700",
      badgeBg: "bg-amber-50 group-hover:bg-amber-100",
      badgeBorder: "border-amber-200/60 group-hover:border-amber-300",
    };
  }

  return {
    Icon: ShoppingBag,
    iconColor: "text-neutral-600 group-hover:text-neutral-900",
    badgeBg: "bg-neutral-100 group-hover:bg-neutral-200",
    badgeBorder: "border-neutral-200 group-hover:border-neutral-300",
  };
};

export function CategoryNav({ categories = [] }: CategoryNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 320);
    }
  };

  return (
    <nav
      aria-label="Category Navigation"
      className="hidden md:block bg-white border-b border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative z-20"
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 py-1.5">
        {/* CATEGORIES trigger — Maroon Menu Icon + Bold Black Text */}
        <Link
          href="/#categories"
          className="group flex items-center gap-2 py-1.5 pr-4 pl-1 text-neutral-900 hover:text-[#8A1538] shrink-0 transition-colors border-r border-neutral-200 mr-1.5"
        >
          <Menu className="w-4 h-4 text-[#8A1538] stroke-[2.5] group-hover:scale-105 transition-transform" />
          <span className="uppercase tracking-wider text-[12px] font-black text-neutral-900 group-hover:text-[#8A1538] transition-colors">
            CATEGORIES
          </span>
        </Link>

        {/* Scroll Container with Fade Edges & Arrows */}
        <div className="relative flex-1 flex items-center overflow-hidden">
          {/* Left scroll arrow */}
          {canScrollLeft && (
            <button
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
              className="absolute left-0 z-10 p-1 rounded-full bg-white/95 backdrop-blur-xs border border-neutral-200 text-neutral-600 hover:text-[#8A1538] hover:bg-neutral-50 shadow-sm transition-all -ml-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Horizontal category scroll bar */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full px-1 py-0.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.length === 0 ? (
              <span className="text-neutral-400 italic text-[11px] py-1">
                Categories managed via Admin
              </span>
            ) : (
              categories.map((cat) => {
                const { Icon, iconColor, badgeBg, badgeBorder } = getCategoryMeta(
                  cat.slug,
                  cat.name,
                  cat.icon_name
                );

                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg border border-transparent hover:border-neutral-200/90 hover:bg-neutral-50/90 hover:shadow-2xs active:scale-95 transition-all duration-150 shrink-0"
                  >
                    {/* Vibrant Micro-badge with Icon */}
                    <span
                      className={`flex items-center justify-center w-6 h-6 rounded-md border ${badgeBg} ${badgeBorder} transition-all duration-200 group-hover:scale-105 shrink-0 shadow-2xs`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${iconColor} transition-transform duration-200 group-hover:scale-110`}
                        strokeWidth={2.2}
                      />
                    </span>

                    {/* Category Label */}
                    <span className="text-[12px] font-semibold text-neutral-700 group-hover:text-neutral-950 transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {/* Right scroll arrow */}
          {canScrollRight && (
            <button
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
              className="absolute right-0 z-10 p-1 rounded-full bg-white/95 backdrop-blur-xs border border-neutral-200 text-neutral-600 hover:text-[#8A1538] hover:bg-neutral-50 shadow-sm transition-all -mr-1 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

