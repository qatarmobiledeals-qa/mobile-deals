"use client";

import React, { useState, useEffect } from "react";
import { Truck, Banknote, ShieldCheck, PhoneCall, LucideIcon } from "lucide-react";

interface AnnouncementBarProps {
  items?: string[];
}

const DEFAULT_ANNOUNCEMENT_ITEMS = [
  "Cash on Delivery Available",
  "Order on WhatsApp",
  "100% Genuine Products",
];

function getIconForAnnouncement(text: string): LucideIcon {
  const lower = text.toLowerCase();
  if (lower.includes("cash") || lower.includes("cod") || lower.includes("payment")) {
    return Banknote;
  }
  if (lower.includes("whatsapp") || lower.includes("support") || lower.includes("call")) {
    return PhoneCall;
  }
  if (lower.includes("genuine") || lower.includes("warranty") || lower.includes("authentic") || lower.includes("secure")) {
    return ShieldCheck;
  }
  if (lower.includes("deliver") || lower.includes("ship") || lower.includes("express")) {
    return Truck;
  }
  return ShieldCheck;
}

export function AnnouncementBar({ items }: AnnouncementBarProps) {
  const rawItems = items && items.length > 0 ? items : DEFAULT_ANNOUNCEMENT_ITEMS;
  const displayItems = rawItems
    .filter((item) => !item.toLowerCase().includes("free delivery"))
    .filter(Boolean);

  const finalItems = displayItems.length > 0 ? displayItems : DEFAULT_ANNOUNCEMENT_ITEMS;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (finalItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % finalItems.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [finalItems.length]);

  const CurrentMobileIcon = getIconForAnnouncement(finalItems[currentIndex] || finalItems[0]);

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#8A1538] text-white text-[11px] sm:text-xs font-medium border-b border-[#6E132D] select-none">
      <div className="relative max-w-7xl mx-auto px-4 py-2 flex items-center justify-center min-h-[34px] sm:min-h-[36px] w-full">
        {/* Mobile View: Clean Rotating Single Announcement (Centered, Never Cut Off) */}
        <div className="flex md:hidden items-center justify-center w-full px-4 text-center overflow-hidden">
          <div
            key={currentIndex}
            className="flex items-center justify-center gap-2 text-white/95 transition-all duration-300"
          >
            <CurrentMobileIcon className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <span className="font-semibold tracking-wide truncate max-w-[290px]">
              {finalItems[currentIndex]}
            </span>
          </div>
        </div>

        {/* Desktop View: All Announcements Side-by-Side Centered */}
        <div className="hidden md:flex items-center justify-center gap-6 text-center">
          {finalItems.map((item, idx) => {
            const Icon = getIconForAnnouncement(item);
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 whitespace-nowrap text-white/90 hover:text-white transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span>{item}</span>
                {idx < finalItems.length - 1 && (
                  <span className="text-white/30 ml-6">|</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Qatar Flag + Currency (Desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 absolute right-4 top-1/2 -translate-y-1/2 text-white/90">
          <svg
            className="w-4 h-3 rounded-xs shadow-xs"
            viewBox="0 0 28 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="28" height="18" fill="#8A1538" />
            <path
              d="M0 0H8L11 2L8 4L11 6L8 8L11 10L8 12L11 14L8 16L11 18H0V0Z"
              fill="white"
            />
          </svg>
          <span className="font-semibold text-white">QAR</span>
        </div>
      </div>
    </div>
  );
}
