"use client";

import React, { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Truck, Banknote, ShieldCheck, PhoneCall } from "lucide-react";
import { resolveTextField } from "@/lib/i18n/content-resolver";

interface AnnouncementBarProps {
  items?: string[];
  itemsAr?: string[] | null;
  currency?: string;
}

/**
 * Resolve announcement items per index with Arabic fallback and filtered legacy phrases.
 */
export function resolveAnnouncementItems(
  items: string[] | undefined,
  itemsAr: string[] | null | undefined,
  locale: string,
  defaultItems: string[]
): string[] {
  const enList = Array.isArray(items) ? items : [];
  const arList = Array.isArray(itemsAr) ? itemsAr : [];
  const maxLen = Math.max(enList.length, arList.length);

  if (maxLen === 0) {
    return defaultItems;
  }

  const resolved: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const enItem = enList[i] ?? null;
    const arItem = arList[i] ?? null;

    // Preserve legacy behavior: omit hardcoded "free delivery" English entries when not paired with Arabic text
    if (enItem && enItem.toLowerCase().includes("free delivery") && !arItem) {
      continue;
    }

    const report = resolveTextField(enItem, arItem, locale, { optional: true });
    if (report.resolvedValue && !report.resolvedValue.toLowerCase().includes("free delivery")) {
      resolved.push(report.resolvedValue);
    }
  }

  return resolved.length > 0 ? resolved : defaultItems;
}

type AnnouncementIconKind = "banknote" | "phone" | "shield" | "truck";

function getIconKindForAnnouncement(text: string): AnnouncementIconKind {
  const lower = text.toLowerCase();
  if (
    lower.includes("cash") ||
    lower.includes("cod") ||
    lower.includes("payment") ||
    text.includes("الدفع") ||
    text.includes("الاستلام") ||
    text.includes("نقد")
  ) {
    return "banknote";
  }
  if (
    lower.includes("whatsapp") ||
    lower.includes("support") ||
    lower.includes("call") ||
    text.includes("واتساب") ||
    text.includes("دعم") ||
    text.includes("اطلب")
  ) {
    return "phone";
  }
  if (
    lower.includes("genuine") ||
    lower.includes("warranty") ||
    lower.includes("authentic") ||
    lower.includes("secure") ||
    text.includes("أصلي") ||
    text.includes("أصلية") ||
    text.includes("ضمان")
  ) {
    return "shield";
  }
  if (
    lower.includes("deliver") ||
    lower.includes("ship") ||
    lower.includes("express") ||
    text.includes("توصيل") ||
    text.includes("شحن") ||
    text.includes("سريع")
  ) {
    return "truck";
  }
  return "shield";
}

function AnnouncementIcon({ text, className }: { text: string; className?: string }) {
  const kind = getIconKindForAnnouncement(text);
  switch (kind) {
    case "banknote":
      return <Banknote className={className} />;
    case "phone":
      return <PhoneCall className={className} />;
    case "truck":
      return <Truck className={className} />;
    default:
      return <ShieldCheck className={className} />;
  }
}

export function AnnouncementBar({
  items,
  itemsAr,
  currency = "QAR",
}: AnnouncementBarProps) {
  const locale = useLocale();
  const t = useTranslations("announcement");
  const tCommon = useTranslations("common");

  const defaultItems = [t("default1"), t("default2"), t("default3")];
  const finalItems = resolveAnnouncementItems(items, itemsAr, locale, defaultItems);
  const displayCurrency = currency === "QAR" ? tCommon("currency") : currency;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (finalItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % finalItems.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [finalItems.length]);

  const safeIndex = currentIndex % finalItems.length;
  const activeMobileText = finalItems[safeIndex] || finalItems[0];

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#8A1538] text-white text-[11px] sm:text-xs font-medium border-b border-[#6E132D] select-none">
      <div className="relative max-w-7xl mx-auto px-4 py-2 flex items-center justify-center min-h-[34px] sm:min-h-[36px] w-full">
        {/* Mobile View: Clean Rotating Single Announcement (Centered, Never Cut Off) */}
        <div className="flex md:hidden items-center justify-center w-full px-4 text-center overflow-hidden">
          <div
            key={safeIndex}
            className="flex items-center justify-center gap-2 text-white/95 transition-all duration-300"
          >
            <AnnouncementIcon text={activeMobileText} className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <span className="font-semibold tracking-wide truncate max-w-[290px]">
              {finalItems[safeIndex]}
            </span>
          </div>
        </div>

        {/* Desktop View: All Announcements Side-by-Side Centered */}
        <div className="hidden md:flex items-center justify-center gap-6 text-center">
          {finalItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 whitespace-nowrap text-white/90 hover:text-white transition-colors"
            >
              <AnnouncementIcon text={item} className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>{item}</span>
              {idx < finalItems.length - 1 && (
                <span className="text-white/30 ms-6">|</span>
              )}
            </div>
          ))}
        </div>

        {/* Inline-end: Qatar Flag + Currency (Desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 absolute end-4 top-1/2 -translate-y-1/2 text-white/90">
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
          <span className="font-semibold text-white">{displayCurrency}</span>
        </div>
      </div>
    </div>
  );
}
