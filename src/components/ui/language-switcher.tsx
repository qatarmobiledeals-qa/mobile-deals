"use client";

import React, { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "subtle" | "dropdown";
}

export function LanguageSwitcher({ className = "", variant = "pill" }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (nextLocale: "en" | "ar") => {
    if (nextLocale === locale) return;

    // Persist choice in standard NEXT_LOCALE cookie for 1 year
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Access search params safely from window if in browser, avoiding SSR suspense bailing out
    let queryString = "";
    if (typeof window !== "undefined" && window.location.search) {
      queryString = window.location.search;
    }

    const targetHref = queryString ? `${pathname}${queryString}` : pathname;

    startTransition(() => {
      // Replaces current pathname with new locale while preserving current route, slug, and query string
      router.replace(targetHref, { locale: nextLocale });
    });
  };

  if (variant === "subtle") {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-neutral-600 ${className}`}>
        <Globe className="w-3.5 h-3.5 text-neutral-400" />
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleLocaleChange("en")}
          className={`hover:text-[#8A1538] transition-colors cursor-pointer ${
            locale === "en" ? "font-bold text-[#8A1538]" : "text-neutral-500"
          }`}
        >
          EN
        </button>
        <span className="text-neutral-300">|</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleLocaleChange("ar")}
          className={`hover:text-[#8A1538] transition-colors cursor-pointer ${
            locale === "ar" ? "font-bold text-[#8A1538]" : "text-neutral-500"
          }`}
        >
          عربي
        </button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center rounded-full bg-neutral-100/90 p-0.5 border border-neutral-200/80 text-[11px] sm:text-xs font-semibold select-none shadow-2xs ${className}`}
    >
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleLocaleChange("en")}
        aria-pressed={locale === "en"}
        className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
          locale === "en"
            ? "bg-[#8A1538] text-white shadow-xs font-bold"
            : "text-neutral-600 hover:text-neutral-900"
        } ${isPending ? "opacity-60 cursor-wait" : ""}`}
      >
        English
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => handleLocaleChange("ar")}
        aria-pressed={locale === "ar"}
        className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
          locale === "ar"
            ? "bg-[#8A1538] text-white shadow-xs font-bold"
            : "text-neutral-600 hover:text-neutral-900"
        } ${isPending ? "opacity-60 cursor-wait" : ""}`}
      >
        العربية
      </button>
    </div>
  );
}

