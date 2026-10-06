import React from "react";
import { Trophy, Truck, ThumbsUp, Headset, ShieldCheck } from "lucide-react";

export function TrustBar() {
  const items = [
    { icon: Trophy, title: "Top Brands", subtitle: "100% genuine products" },
    { icon: Truck, title: "Qatar Wide Delivery", subtitle: "Fast doorstep service" },
    { icon: ThumbsUp, title: "Best Prices", subtitle: "Unbeatable deals" },
    { icon: Headset, title: "Dedicated Support", subtitle: "Direct WhatsApp care" },
    { icon: ShieldCheck, title: "Secure Ordering", subtitle: "Cash on delivery safe" },
  ];

  return (
    <div className="w-full bg-[#111111] text-white border-t border-neutral-800/80 py-5 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 md:gap-6">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isFifthItem = idx >= 4;

            return (
              <div
                key={idx}
                className={`items-center md:items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 md:bg-transparent md:border-0 md:p-0 group transition-all ${
                  isFifthItem ? "hidden md:flex" : "flex"
                }`}
              >
                {/* Icon Squircle */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0 shadow-xs">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Text Details */}
                <div className="text-left min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug truncate">
                    {item.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium leading-tight truncate">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

