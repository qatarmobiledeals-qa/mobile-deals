"use client";

import React, { Suspense, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, Heart, ShoppingCart, Menu, X, ChevronRight, Sparkles, Loader2, ArrowRight, Tag, ShoppingBag } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { resolveBrandContent, resolveProductImageAlt, resolveTextField } from "@/lib/i18n/content-resolver";
import { formatPrice } from "@/lib/formatters";
import type { Brand, ProductImage } from "@/types/database";

export type DrawerPhase = "closed" | "opening" | "open" | "closing";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/** Checks whether an element is connected, enabled, unhidden, and visibly focusable. */
export function isElementVisiblyFocusable(el: HTMLElement | null): boolean {
  if (!el || !el.isConnected) return false;
  if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return false;
  if (el.tabIndex < 0) return false;
  if (el.hidden || el.closest("[hidden]")) return false;
  if (el.closest("[inert]")) return false;
  if (el.closest('[aria-hidden="true"]')) return false;

  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") {
      return false;
    }
  }

  if (typeof el.getBoundingClientRect === "function") {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
  }

  return true;
}

/** Returns visibly focusable descendant elements within a drawer container. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return candidates.filter(isElementVisiblyFocusable);
}

interface SearchResultItem {
  id: string;
  name: string;
  name_ar?: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  short_description?: string | null;
  short_description_ar?: string | null;
  badge_text: string | null;
  badge_text_ar?: string | null;
  free_gift?: string | null;
  free_gift_ar?: string | null;
  is_best_deal?: boolean;
  is_today_deal?: boolean;
  is_featured?: boolean;
  brand?: { id: string; name: string; name_ar?: string | null; slug: string } | null;
  category?: { id: string; name: string; name_ar?: string | null; slug: string } | null;
  product_images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string | null;
    alt_text_ar?: string | null;
    is_primary: boolean;
  }>;
}

interface MainNavbarProps {
  whatsappNumber?: string;
  currency?: string;
}

export function MainNavbar({ whatsappNumber = "+97455000000", currency = "QAR" }: MainNavbarProps) {
  const router = useRouter();
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isRelatedResults, setIsRelatedResults] = useState(false);
  const [directMatchCount, setDirectMatchCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [drawerPhase, setDrawerPhase] = useState<DrawerPhase>("closed");
  const drawerPhaseRef = React.useRef<DrawerPhase>("closed");

  const isDrawerMounted = drawerPhase !== "closed";
  const isDrawerVisible = drawerPhase === "open";
  const isDrawerOpen = drawerPhase === "opening" || drawerPhase === "open";

  const desktopSearchRef = React.useRef<HTMLDivElement>(null);
  const mobileSearchRef = React.useRef<HTMLDivElement>(null);
  const triggerButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const activeTriggerElRef = React.useRef<HTMLElement | null>(null);
  const needsFocusRestoreRef = React.useRef<boolean>(false);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const drawerPanelRef = React.useRef<HTMLDivElement | null>(null);
  const portalRootRef = React.useRef<HTMLDivElement | null>(null);

  const restoreTriggerFocusOnce = React.useCallback(() => {
    if (!needsFocusRestoreRef.current) return;
    needsFocusRestoreRef.current = false;
    const triggerEl = activeTriggerElRef.current ?? triggerButtonRef.current;
    activeTriggerElRef.current = null;
    if (triggerEl && triggerEl.isConnected && document.contains(triggerEl)) {
      triggerEl.focus();
    }
  }, []);

  const openMobileDrawer = React.useCallback((triggerEl?: HTMLElement | null) => {
    if (drawerPhaseRef.current === "opening" || drawerPhaseRef.current === "open") {
      return;
    }
    activeTriggerElRef.current =
      triggerEl ??
      triggerButtonRef.current ??
      (typeof document !== "undefined" && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    needsFocusRestoreRef.current = true;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextPhase: DrawerPhase = prefersReducedMotion ? "open" : "opening";
    drawerPhaseRef.current = nextPhase;
    setDrawerPhase(nextPhase);
  }, []);

  const closeMobileDrawer = React.useCallback(() => {
    const prev = drawerPhaseRef.current;
    if (prev === "closed" || prev === "closing") return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const nextPhase: DrawerPhase =
      prefersReducedMotion || prev === "opening" ? "closed" : "closing";
    drawerPhaseRef.current = nextPhase;
    setDrawerPhase(nextPhase);
    if (nextPhase === "closed") {
      restoreTriggerFocusOnce();
    }
  }, [restoreTriggerFocusOnce]);
  
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();

  // Fetch 4 matching or related products from API
  const fetchProducts = React.useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.products || []).slice(0, 4));
        setIsRelatedResults(Boolean(data.isRelated));
        setDirectMatchCount(Number(data.directMatchCount) || 0);
      }
    } catch (err) {
      console.error("Live search fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search when typing
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchProducts(trimmed);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchProducts]);

  // Click outside to close dropdowns
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setShowDesktopDropdown(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowMobileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Opening transition: double-RAF ensures hidden transform paints before sliding in (Strict-Mode safe)
  React.useEffect(() => {
    if (drawerPhase !== "opening") return;

    let didTransitionToOpen = false;
    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        didTransitionToOpen = true;
        drawerPhaseRef.current = "open";
        setDrawerPhase("open");
      });
    });

    const portalRoot = portalRootRef.current;

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      const isSimulatedStrictCleanup =
        drawerPhaseRef.current === "opening" && Boolean(portalRoot && portalRoot.isConnected);
      if (!didTransitionToOpen && drawerPhaseRef.current !== "open" && !isSimulatedStrictCleanup) {
        restoreTriggerFocusOnce();
      }
    };
  }, [drawerPhase, restoreTriggerFocusOnce]);

  // Closing fallback timer if CSS transitionend does not fire (e.g., headless/reduced-motion override)
  React.useEffect(() => {
    if (drawerPhase !== "closing") return;
    const portalRoot = portalRootRef.current;
    const timer = window.setTimeout(() => {
      drawerPhaseRef.current = "closed";
      setDrawerPhase("closed");
    }, 320);
    return () => {
      window.clearTimeout(timer);
      const isSimulatedStrictCleanup =
        drawerPhaseRef.current === "closing" && Boolean(portalRoot && portalRoot.isConnected);
      if (!isSimulatedStrictCleanup) {
        restoreTriggerFocusOnce();
      }
    };
  }, [drawerPhase, restoreTriggerFocusOnce]);

  // Active drawer lifecycle: scroll lock, sibling inert/aria-hidden isolation, focus trap & Escape
  React.useEffect(() => {
    if (drawerPhase !== "open") return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const modifiedSiblings: Array<{
      el: HTMLElement;
      prevInert: boolean;
      prevAriaHidden: string | null;
    }> = [];

    for (const child of Array.from(document.body.children)) {
      if (
        !(child instanceof HTMLElement) ||
        child === portalRootRef.current ||
        (portalRootRef.current && child.contains(portalRootRef.current))
      ) {
        continue;
      }
      if (child.tagName === "SCRIPT" || child.tagName === "STYLE") continue;

      modifiedSiblings.push({
        el: child,
        prevInert: Boolean(child.inert),
        prevAriaHidden: child.getAttribute("aria-hidden"),
      });
      child.inert = true;
      child.setAttribute("aria-hidden", "true");
    }

    const focusTarget = closeButtonRef.current;
    if (focusTarget && isElementVisiblyFocusable(focusTarget)) {
      focusTarget.focus();
    } else if (drawerPanelRef.current) {
      const focusables = getFocusableElements(drawerPanelRef.current);
      (focusables[0] ?? drawerPanelRef.current).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobileDrawer();
        return;
      }

      if (e.key === "Tab" && drawerPanelRef.current) {
        const focusables = getFocusableElements(drawerPanelRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          drawerPanelRef.current.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (!active || !drawerPanelRef.current.contains(active)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
          return;
        }

        if (e.shiftKey && (active === first || active === drawerPanelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const portalRoot = portalRootRef.current;

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener("keydown", handleKeyDown);

      for (const { el, prevInert, prevAriaHidden } of modifiedSiblings) {
        el.inert = prevInert;
        if (prevAriaHidden === null) {
          el.removeAttribute("aria-hidden");
        } else {
          el.setAttribute("aria-hidden", prevAriaHidden);
        }
      }

      const isSimulatedStrictCleanup =
        drawerPhaseRef.current === "open" && Boolean(portalRoot && portalRoot.isConnected);
      if (!isSimulatedStrictCleanup) {
        restoreTriggerFocusOnce();
      }
    };
  }, [drawerPhase, closeMobileDrawer, restoreTriggerFocusOnce]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDesktopDropdown(false);
      setShowMobileDropdown(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectProduct = (slug: string) => {
    setShowDesktopDropdown(false);
    setShowMobileDropdown(false);
    router.push(`/products/${slug}`);
  };

  const handleQuickTagClick = (tag: string) => {
    setSearchQuery(tag);
    fetchProducts(tag);
    setShowDesktopDropdown(true);
    setShowMobileDropdown(true);
  };

  const popularTags = [
    tNav("popularTags.iphone"),
    tNav("popularTags.samsung"),
    tNav("popularTags.airpods"),
    tNav("popularTags.charger"),
    tNav("popularTags.watch"),
  ];

  const renderSearchResultsPopup = (isMobile = false) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return null;

    return (
      <div
        className={`absolute top-full inset-x-0 ${
          isMobile ? "w-full max-h-[80vh]" : "w-full max-h-[480px]"
        } mt-1.5 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-98 duration-150 flex flex-col`}
      >
        {/* Top Header */}
        <div className="px-3.5 py-2 bg-neutral-50/90 border-b border-neutral-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-[#8A1538] shrink-0" />
            <span className="font-bold text-neutral-800 truncate text-[11px] sm:text-xs">
              {isLoading
                ? tNav("searchingProducts")
                : isRelatedResults && directMatchCount === 0
                ? tNav("relatedProductsFor", { query: trimmed })
                : tNav("relatedProductsFor", { query: trimmed })}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#8A1538]/10 text-[#8A1538]">
              {tNav("productsCount", { count: searchResults.length })}
            </span>
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-[#8A1538]" />}
          </div>
        </div>

        {/* 4 Products Showcase Grid - Compact Size */}
        <div className="p-2.5 sm:p-3 overflow-y-auto flex-1">
          {isLoading && searchResults.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-neutral-50 rounded-xl p-2 border border-neutral-100 flex flex-col justify-between h-36 sm:h-40"
                >
                  <div className="w-full h-18 sm:h-22 bg-neutral-200 rounded-lg mb-1.5" />
                  <div className="h-2.5 bg-neutral-200 rounded w-3/4 mb-1" />
                  <div className="h-2.5 bg-neutral-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {searchResults.slice(0, 4).map((product) => {
                const displayName = resolveTextField(product.name, product.name_ar, locale).value;
                const displayBrandName = product.brand
                  ? resolveBrandContent(
                      {
                        id: product.brand.id,
                        name: product.brand.name,
                        name_ar: product.brand.name_ar ?? null,
                        slug: product.brand.slug,
                        logo_url: null,
                        is_active: true,
                        created_at: "",
                      } satisfies Brand,
                      locale
                    ).displayName
                  : null;
                const displayFreeGift = resolveTextField(
                  product.free_gift,
                  product.free_gift_ar,
                  locale,
                  { optional: true }
                ).resolvedValue;
                const primaryImgObj =
                  product.product_images?.find((img) => img.is_primary) ||
                  product.product_images?.[0];
                const primaryImg = primaryImgObj?.image_url || "/placeholder-phone.png";
                const displayAlt = primaryImgObj
                  ? resolveProductImageAlt(
                      {
                        id: primaryImgObj.id,
                        product_id: product.id,
                        cloudinary_public_id: null,
                        image_url: primaryImgObj.image_url,
                        alt_text: primaryImgObj.alt_text ?? null,
                        alt_text_ar: primaryImgObj.alt_text_ar ?? null,
                        display_order: 0,
                        is_primary: primaryImgObj.is_primary,
                        created_at: "",
                      } satisfies ProductImage,
                      locale,
                      displayName
                    ).displayAltText
                  : displayName;
                const discountPercent =
                  product.compare_at_price && product.compare_at_price > product.price
                    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                    : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product.slug)}
                    className="group relative flex flex-col justify-between p-2 rounded-xl bg-neutral-50/70 hover:bg-white border border-neutral-200/80 hover:border-[#8A1538]/40 hover:shadow-sm transition-all duration-150 cursor-pointer text-start"
                  >
                    {/* Compact Image Container with Badge */}
                    <div className="relative w-full h-20 sm:h-24 bg-white rounded-lg overflow-hidden border border-neutral-100 p-1.5 flex items-center justify-center mb-1.5 shrink-0">
                      <Image
                        src={primaryImg}
                        alt={displayAlt}
                        fill
                        sizes="(max-width: 640px) 40vw, 120px"
                        className="object-contain p-0.5 group-hover:scale-105 transition-transform duration-200"
                      />
                      {discountPercent > 0 ? (
                        <span className="absolute top-1 start-1 bg-[#8A1538] text-white text-[8px] font-extrabold px-1 py-0.2 rounded shadow-2xs">
                          {tNav("discountOff", { percent: discountPercent })}
                        </span>
                      ) : displayFreeGift ? (
                        <span className="absolute top-1 start-1 bg-amber-500 text-white text-[7px] font-extrabold px-1 py-0.2 rounded shadow-2xs">
                          🎁 {tNav("giftBadge")}
                        </span>
                      ) : product.is_best_deal ? (
                        <span className="absolute top-1 start-1 bg-amber-600 text-white text-[7px] font-extrabold px-1 py-0.2 rounded shadow-2xs">
                          {tNav("dealBadge")}
                        </span>
                      ) : null}
                    </div>

                    {/* Product Meta */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      {displayBrandName && (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 mb-0.5 truncate">
                          {displayBrandName}
                        </span>
                      )}
                      <h4 className="text-[11px] sm:text-xs font-bold text-neutral-800 group-hover:text-[#8A1538] transition-colors line-clamp-1 leading-snug mb-1">
                        {displayName}
                      </h4>

                      <div className="mt-auto pt-0.5">
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span className="text-xs sm:text-[13px] font-black text-[#8A1538]">
                            {formatPrice(Number(product.price), locale, currency)}
                          </span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="text-[9px] text-neutral-400 line-through">
                              {formatPrice(Number(product.compare_at_price), locale, currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-neutral-400">
              {tNav("noProductsFound")}
            </div>
          )}
        </div>

        {/* Footer with Quick Tags & View All CTA */}
        <div className="px-3 py-2 bg-neutral-50/90 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
            <Tag className="w-3 h-3 text-[#8A1538] shrink-0" />
            <div className="flex items-center gap-1 flex-wrap">
              {popularTags.slice(0, 4).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickTagClick(tag);
                  }}
                  className="px-2 py-0.5 text-[9px] font-semibold bg-white border border-neutral-200 hover:border-[#8A1538] hover:text-[#8A1538] text-neutral-700 rounded-full transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearchSubmit}
            className="text-[11px] font-bold text-[#8A1538] hover:text-[#700f2c] flex items-center gap-1 transition-colors cursor-pointer ms-auto"
          >
            <span>{tNav("viewAllResults")}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </button>
        </div>
      </div>
    );
  };

  const whatsappCleanNumber = whatsappNumber.replace(/[^\d]/g, "");

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-2xs w-full max-w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3.5 w-full">
        {/* Mobile Header Row (Logo on Start | Cart & Menu on End) */}
        <div className="flex md:hidden items-center justify-between gap-3 py-0.5">
          {/* Start: Mobile Logo */}
          <div className="shrink-0 flex items-center">
            <Logo size="md" />
          </div>

          {/* End: Language Switcher + Cart Button + Hamburger Menu Button */}
          <div className="flex items-center gap-1.5">
            <Suspense fallback={null}>
              <LanguageSwitcher variant="subtle" className="text-xs" />
            </Suspense>

            {/* Cart Button with Red Count Badge */}
            <Link
              href="/cart"
              className="relative p-2 text-neutral-800 hover:text-[#8A1538] active:scale-95 transition-all"
              title={tNav("shoppingCart")}
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0.5 end-0.5 bg-[#8A1538] text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            </Link>

            {/* Mobile Menu Trigger Button */}
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={(e) => openMobileDrawer(e.currentTarget)}
              className="p-2 -me-1.5 text-neutral-800 hover:text-[#8A1538] active:scale-95 transition-all focus:outline-none cursor-pointer"
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={tNav("openMenu")}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Desktop Navbar Row */}
        <div className="hidden md:flex items-center justify-between gap-6">
          {/* Desktop Logo */}
          <div className="shrink-0">
            <Logo size="md" />
          </div>

          {/* Desktop Search Bar */}
          <div ref={desktopSearchRef} className="flex flex-1 max-w-2xl items-center relative">
            <form
              onSubmit={handleSearchSubmit}
              className="w-full relative"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowDesktopDropdown(true)}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setSearchQuery(nextVal);
                    setShowDesktopDropdown(true);
                    if (!nextVal.trim()) {
                      setSearchResults([]);
                      setIsLoading(false);
                    }
                  }}
                  placeholder={tNav("searchPlaceholder")}
                  className="w-full ps-10 pe-28 py-2.5 bg-neutral-50 border border-neutral-300 rounded-full text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8A1538] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 transition-all"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setIsLoading(false);
                      setShowDesktopDropdown(false);
                    }}
                    className="absolute end-20 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 rounded-full transition-colors"
                    aria-label={tNav("clearSearch")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  className="absolute end-1 top-1/2 -translate-y-1/2 px-5 py-1.5 bg-[#8A1538] hover:bg-[#700f2c] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  {tCommon("search")}
                </button>
              </div>
            </form>

            {/* Live Autocomplete Popup */}
            {showDesktopDropdown && renderSearchResultsPopup(false)}
          </div>

          {/* End Action Icons & WhatsApp Button */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Language Switcher */}
            <Suspense fallback={null}>
              <LanguageSwitcher variant="pill" className="shrink-0" />
            </Suspense>

            {/* Wishlist */}
            <Link
              href="/#deals"
              className="relative flex flex-col items-center text-neutral-700 hover:text-[#8A1538] transition-colors p-1"
              title={tNav("wishlist")}
            >
              <div className="relative">
                <Heart className="w-5 h-5 text-neutral-600 hover:text-[#8A1538]" />
                {totalWishlist > 0 && (
                  <span className="absolute -top-1.5 -end-2 bg-[#8A1538] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {totalWishlist}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium hidden lg:inline mt-0.5">{tNav("wishlist")}</span>
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative flex flex-col items-center text-neutral-700 hover:text-[#8A1538] transition-colors p-1"
              title={tNav("shoppingCart")}
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-neutral-600 hover:text-[#8A1538]" />
                <span className="absolute -top-1.5 -end-2 bg-[#8A1538] text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <span className="text-[11px] font-medium hidden lg:inline mt-0.5">{tNav("cart")}</span>
            </Link>

            {/* WhatsApp Order CTA Button */}
            <a
              href={`https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
                tNav("whatsappInquiryMessage")
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-semibold rounded-full shadow-xs hover:shadow-sm transition-all"
              aria-label={tNav("orderOnWhatsApp")}
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span className="whitespace-nowrap">{tNav("orderOnWhatsApp")}</span>
            </a>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div ref={mobileSearchRef} className="mt-2.5 md:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-neutral-400 absolute start-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowMobileDropdown(true)}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setSearchQuery(nextVal);
                  setShowMobileDropdown(true);
                  if (!nextVal.trim()) {
                    setSearchResults([]);
                    setIsLoading(false);
                  }
                }}
                placeholder={tNav("searchPlaceholder")}
                className="w-full ps-10 pe-9 py-2.5 bg-neutral-100/90 border border-neutral-200/80 rounded-full text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8A1538] focus:bg-white focus:ring-1 focus:ring-[#8A1538]/20 transition-all shadow-2xs"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setIsLoading(false);
                    setShowMobileDropdown(false);
                  }}
                  className="absolute end-3 text-neutral-400 hover:text-neutral-600 focus:outline-none p-0.5"
                  aria-label={tNav("clearSearch")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Live Autocomplete Popup */}
          {showMobileDropdown && renderSearchResultsPopup(true)}
        </div>
      </div>

      {/* Mobile Slide-in Drawer - Portaled directly to document.body at z-[9999] */}
      {isDrawerMounted && typeof document !== "undefined" && createPortal(
        <div ref={portalRootRef} className="fixed inset-0 z-[9999] md:hidden flex justify-end">
          {/* Dark Backdrop Overlay */}
          <div
            onClick={closeMobileDrawer}
            aria-hidden="true"
            className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
              isDrawerVisible ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Sidebar Menu Panel */}
          <div
            id="mobile-nav-drawer"
            ref={drawerPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label={tNav("menu")}
            tabIndex={-1}
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && drawerPhaseRef.current === "closing") {
                drawerPhaseRef.current = "closed";
                setDrawerPhase("closed");
              }
            }}
            className={`relative z-[10000] w-[290px] sm:w-80 h-[100dvh] max-h-[100dvh] bg-white shadow-2xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out focus:outline-none ${
              isDrawerVisible ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
            }`}
          >
            {/* Sidebar Header */}
            <div className="shrink-0 p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
              <Logo size="md" />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMobileDrawer}
                className="p-1.5 rounded-full bg-neutral-200/70 hover:bg-neutral-300 text-neutral-700 transition-colors"
                aria-label={tNav("closeMenu")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links - Scrollable middle area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-sm overscroll-contain">
              <Link
                href="/"
                onClick={closeMobileDrawer}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-neutral-900 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span>{tNav("home")}</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" />
              </Link>
              <Link
                href="/shop"
                onClick={closeMobileDrawer}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-[#8A1538] bg-[#8A1538]/5 hover:bg-[#8A1538]/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#8A1538]" />
                  <span>{tNav("shop")}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#8A1538] rtl:rotate-180" />
              </Link>
              <Link
                href="/#categories"
                onClick={closeMobileDrawer}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-neutral-900 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span>{tNav("allCategories")}</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" />
              </Link>
              <Link
                href="/#deals"
                onClick={closeMobileDrawer}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-neutral-900 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>{tNav("todaysBestDeals")}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" />
              </Link>
              <Link
                href="/cart"
                onClick={closeMobileDrawer}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-neutral-900 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span>{tNav("shoppingCart")}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#8A1538] text-white text-xs font-bold">
                  {totalItems}
                </span>
              </Link>
              <Link
                href="/service-enquiry"
                onClick={closeMobileDrawer}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-medium text-neutral-700 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span>{tNav("serviceAndRepair")}</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" />
              </Link>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium text-neutral-500">{tNav("languageLabel")}</span>
                <Suspense fallback={null}>
                  <LanguageSwitcher variant="pill" />
                </Suspense>
              </div>
            </div>

            {/* Sidebar Bottom WhatsApp Action - Safe area padding & fully visible above phone bottom */}
            <div className="shrink-0 p-4 pb-8 border-t border-neutral-100 bg-neutral-50/90 space-y-2">
              <a
                href={`https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
                  tNav("whatsappDrawerMessage")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-sm hover:bg-[#20ba59] active:scale-[0.98] transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                <span>{tNav("orderOnWhatsApp")}</span>
              </a>
              <p className="text-[11px] text-center text-neutral-400 font-medium">
                {tNav("fastDeliveryQatar")}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
