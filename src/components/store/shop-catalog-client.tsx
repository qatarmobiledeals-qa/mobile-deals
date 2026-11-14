"use client";

import React, { useState, useMemo, useEffect, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Category, Brand, Product } from "@/types/database";
import { ProductCard } from "@/components/store/product-card";
import { resolveCategoryContent, resolveBrandContent } from "@/lib/i18n/content-resolver";
import { formatPrice } from "@/lib/formatters";
import {
  DrawerPhase,
  getFocusableElements,
  isElementVisiblyFocusable,
} from "@/components/store/main-navbar";
import {
  SlidersHorizontal,
  Search,
  X,
  RotateCcw,
  Sparkles,
  Gift,
  Star,
  Award,
  Tag,
  Check,
  ChevronDown,
  ChevronUp,
  PackageOpen,
  ShoppingBag,
  Filter,
} from "lucide-react";

interface ShopCatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
  brands: Brand[];
  currency?: string;
  /** Slug of a category to pre-select (used by /categories/[slug] route) */
  initialCategory?: string;
  /** Display name of that category, used for H1/breadcrumb */
  initialCategoryName?: string;
}

type SortOption = "featured" | "price_asc" | "price_desc" | "discount" | "newest";

/** Builds a locale-prefixed catalog URL without double-prefixing existing locale segments. */
export function buildLocalizedCatalogUrl(locale: string, pathname: string, queryStr: string): string {
  const safeLocale = locale === "ar" ? "ar" : "en";
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutLocale =
    normalizedPath === "/en" || normalizedPath.startsWith("/en/")
      ? normalizedPath.slice(3) || "/"
      : normalizedPath === "/ar" || normalizedPath.startsWith("/ar/")
      ? normalizedPath.slice(3) || "/"
      : normalizedPath;
  const localizedPath = withoutLocale === "/" ? `/${safeLocale}` : `/${safeLocale}${withoutLocale}`;
  return queryStr ? `${localizedPath}?${queryStr}` : localizedPath;
}

/** Matches a product against a search query across both English and Arabic fields. */
export function matchesBilingualCatalogSearch(product: Product, rawQuery: string): boolean {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return true;
  const fields = [
    product.name,
    product.name_ar,
    product.brand?.name,
    product.brand?.name_ar,
    product.short_description,
    product.short_description_ar,
    product.free_gift,
    product.free_gift_ar,
  ];
  return fields.some((field) => typeof field === "string" && field.toLowerCase().includes(q));
}

/**
 * Normalizes strings into canonical URL-friendly slugs for robust category matching.
 */
function slugify(text: string = ""): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function matchCategoryOrSlug(
  cat: Category | { id: string; name: string; slug: string },
  target: string
): boolean {
  if (!cat || !target) return false;
  const rawTarget = target.trim();
  const decodedTarget = decodeURIComponent(rawTarget).trim();
  const targetLower = decodedTarget.toLowerCase();
  const targetSlug = slugify(decodedTarget);

  if (cat.id && cat.id.toLowerCase() === targetLower) return true;
  if (cat.slug && (cat.slug.toLowerCase() === targetLower || cat.slug.toLowerCase() === rawTarget.toLowerCase())) return true;
  if (cat.name && (cat.name.toLowerCase() === targetLower || cat.name.toLowerCase() === rawTarget.toLowerCase())) return true;

  if (cat.slug && slugify(cat.slug) === targetSlug) return true;
  if (cat.name && slugify(cat.name) === targetSlug) return true;

  if (targetSlug.includes("mobile") && targetSlug.includes("tablet")) {
    const catSlugNorm = slugify(cat.slug || "");
    const catNameNorm = slugify(cat.name || "");
    if (
      (catSlugNorm.includes("mobile") && catSlugNorm.includes("tablet")) ||
      (catNameNorm.includes("mobile") && catNameNorm.includes("tablet"))
    ) {
      return true;
    }
  }

  return false;
}

export function ShopCatalogClient({
  initialProducts = [],
  categories = [],
  brands = [],
  currency = "QAR",
  initialCategory,
  initialCategoryName,
}: ShopCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const tShop = useTranslations("shop");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const [, startTransition] = useTransition();

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: "featured", label: tShop("sortFeatured") },
    { id: "price_asc", label: tShop("sortPriceAsc") },
    { id: "price_desc", label: tShop("sortPriceDesc") },
    { id: "discount", label: tShop("sortDiscount") },
    { id: "newest", label: tShop("sortNewest") },
  ];

  const dealLabelMap: Record<string, string> = {
    all: tShop("allItems"),
    free_gift: tShop("freeGiftIncluded"),
    best_deal: tShop("bestDeals"),
    featured: tShop("featuredGear"),
    best_seller: tShop("bestSellers"),
    new_arrival: tShop("newArrivals"),
  };

  // Search & Filter State (initialized from URL query params if present)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cat = searchParams.get("category");
    if (cat) return cat.split(",");
    // Pre-select the category when coming from /categories/[slug]
    if (initialCategory) return [initialCategory];
    return [];
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const b = searchParams.get("brand");
    return b ? b.split(",") : [];
  });
  const [selectedDealType, setSelectedDealType] = useState<string>(
    searchParams.get("deal") || "all"
  );
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get("max_price") || "");
  const [inStockOnly, setInStockOnly] = useState<boolean>(
    searchParams.get("in_stock") === "true"
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "featured"
  );

  // Custom Sort Dropdown State & Click-Outside Ref
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [sortDropdownOpen]);

  // Maximum price in catalog for slider range
  const maxCatalogPrice = useMemo(() => {
    if (!initialProducts || initialProducts.length === 0) return 5000;
    const max = Math.max(...initialProducts.map((p) => Number(p.price) || 0));
    return Math.max(Math.ceil(max / 500) * 500, 1000) || 5000;
  }, [initialProducts]);

  const currentSliderMax = maxPrice ? Number(maxPrice) : maxCatalogPrice;
  const sliderPercent = Math.min(100, Math.max(0, (currentSliderMax / maxCatalogPrice) * 100));

  // Mobile Drawer State (Strict-Mode-safe 4-state DrawerPhase lifecycle)
  const [drawerPhase, setDrawerPhase] = useState<DrawerPhase>("closed");
  const drawerPhaseRef = useRef<DrawerPhase>("closed");
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeTriggerElRef = useRef<HTMLElement | null>(null);
  const needsFocusRestoreRef = useRef<boolean>(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerPanelRef = useRef<HTMLDivElement | null>(null);
  const portalRootRef = useRef<HTMLDivElement | null>(null);

  const isDrawerMounted = drawerPhase !== "closed";
  const isDrawerVisible = drawerPhase === "open";
  const isDrawerOpen = drawerPhase === "opening" || drawerPhase === "open";

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
  }, [setDrawerPhase]);

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
  }, [setDrawerPhase, restoreTriggerFocusOnce]);

  // Collapsible sidebar sections
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    deals: true,
    price: true,
    availability: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sync filters to locale-prefixed URL query string without reloading page
  useEffect(() => {
    const isCategoryRoute =
      pathname.startsWith("/categories/") || /^\/(en|ar)\/categories\//.test(pathname);

    if (isCategoryRoute) {
      // On category route, sync only secondary filters (brand, price, etc.) into URL params
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedBrands.length > 0) params.set("brand", selectedBrands.join(","));
      if (selectedDealType !== "all") params.set("deal", selectedDealType);
      if (maxPrice && Number(maxPrice) < maxCatalogPrice) params.set("max_price", maxPrice);
      if (inStockOnly) params.set("in_stock", "true");
      if (sortBy !== "featured") params.set("sort", sortBy);

      const queryStr = params.toString();
      const targetUrl = buildLocalizedCatalogUrl(locale, pathname, queryStr);
      startTransition(() => {
        window.history.replaceState(null, "", targetUrl);
      });
    } else {
      // On /shop route, sync all filters including categories
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategories.length > 0) params.set("category", selectedCategories.join(","));
      if (selectedBrands.length > 0) params.set("brand", selectedBrands.join(","));
      if (selectedDealType !== "all") params.set("deal", selectedDealType);
      if (maxPrice && Number(maxPrice) < maxCatalogPrice) params.set("max_price", maxPrice);
      if (inStockOnly) params.set("in_stock", "true");
      if (sortBy !== "featured") params.set("sort", sortBy);

      const queryStr = params.toString();
      const targetUrl = buildLocalizedCatalogUrl(locale, pathname, queryStr);
      startTransition(() => {
        window.history.replaceState(null, "", targetUrl);
      });
    }
  }, [searchQuery, selectedCategories, selectedBrands, selectedDealType, maxPrice, maxCatalogPrice, inStockOnly, sortBy, pathname, locale]);

  // Opening transition: double-RAF ensures hidden transform paints before sliding in (Strict-Mode safe)
  useEffect(() => {
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

  // Closing fallback timer if CSS transitionend does not fire
  useEffect(() => {
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
  useEffect(() => {
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

  // Pre-calculate Category product counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      let count = 0;
      initialProducts.forEach((p) => {
        if (p.category_id && p.category_id === cat.id) {
          count++;
        } else if (p.category && matchCategoryOrSlug(p.category, cat.slug || cat.name || cat.id)) {
          count++;
        } else if (p.category_id && p.category_id.toLowerCase() === cat.id.toLowerCase()) {
          count++;
        }
      });
      counts[cat.id] = count;
      if (cat.slug) counts[cat.slug] = count;
    });
    return counts;
  }, [categories, initialProducts]);

  // Pre-calculate Brand product counts
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialProducts.forEach((p) => {
      if (p.brand_id) counts[p.brand_id] = (counts[p.brand_id] || 0) + 1;
      if (p.brand?.slug) counts[p.brand.slug] = (counts[p.brand.slug] || 0) + 1;
    });
    return counts;
  }, [initialProducts]);

  // Toggle Category Selection
  const toggleCategory = (slugOrId: string) => {
    const targetCat = categories.find((c) => c.id === slugOrId || c.slug === slugOrId);
    const targetSlug = targetCat?.slug || slugOrId;

    const isSelected = selectedCategories.some((selected) => {
      if (selected === slugOrId) return true;
      const catObj = categories.find((c) => c.id === slugOrId || c.slug === slugOrId);
      if (catObj && matchCategoryOrSlug(catObj, selected)) return true;
      return false;
    });

    const next = isSelected
      ? selectedCategories.filter((selected) => {
          if (selected === slugOrId) return false;
          const catObj = categories.find((c) => c.id === slugOrId || c.slug === slugOrId);
          if (catObj && matchCategoryOrSlug(catObj, selected)) return false;
          return true;
        })
      : [...selectedCategories, targetSlug];

    setSelectedCategories(next);

    // If user is currently on /categories/[slug]
    if (pathname.startsWith("/categories/")) {
      if (next.length === 0) {
        // Cleared category -> Go to /shop
        router.push("/shop");
      } else if (next.length === 1) {
        // Switched category -> Go to new /categories/[slug]
        const singleCat = categories.find((c) => matchCategoryOrSlug(c, next[0]));
        const singleSlug = singleCat?.slug || next[0];
        router.push(`/categories/${singleSlug}`);
      } else {
        // Multiple categories selected -> Go to /shop?category=...
        router.push(`/shop?category=${encodeURIComponent(next.join(","))}`);
      }
    }
  };

  // Toggle Brand Selection
  const toggleBrand = (slugOrId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(slugOrId) ? prev.filter((b) => b !== slugOrId) : [...prev, slugOrId]
    );
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedDealType("all");
    setMaxPrice("");
    setInStockOnly(false);
    setSortBy("featured");

    if (pathname.startsWith("/categories/") || /^\/(en|ar)\/categories\//.test(pathname)) {
      router.push("/shop");
    } else {
      window.history.replaceState(null, "", buildLocalizedCatalogUrl(locale, "/shop", ""));
    }
  };

  // Active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedDealType !== "all") count++;
    if (maxPrice && Number(maxPrice) < maxCatalogPrice) count++;
    if (inStockOnly) count++;
    return count;
  }, [searchQuery, selectedCategories, selectedBrands, selectedDealType, maxPrice, maxCatalogPrice, inStockOnly]);

  // Master Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // 1. Bilingual Text Search Filter (EN & AR: name, brand, short description, free gift)
        if (!matchesBilingualCatalogSearch(product, searchQuery)) {
          return false;
        }

        // 2. Category Filter
        if (selectedCategories.length > 0) {
          const catMatch = selectedCategories.some((selected) => {
            if (product.category_id && product.category_id.toLowerCase() === selected.toLowerCase()) return true;
            if (product.category && matchCategoryOrSlug(product.category, selected)) return true;
            if (product.category_id) {
              const foundCat = categories.find((c) => c.id === product.category_id);
              if (foundCat && matchCategoryOrSlug(foundCat, selected)) return true;
            }
            return false;
          });
          if (!catMatch) return false;
        }

        // 3. Brand Filter
        if (selectedBrands.length > 0) {
          const brandMatch =
            (product.brand_id && selectedBrands.includes(product.brand_id)) ||
            (product.brand?.slug && selectedBrands.includes(product.brand.slug));
          if (!brandMatch) return false;
        }

        // 4. Special Deal / Offer Badges Filter
        if (selectedDealType !== "all") {
          if (selectedDealType === "free_gift") {
            const hasGift =
              Boolean(product.free_gift) ||
              product.specifications?.gift_enabled === "true" ||
              Boolean(product.badge_text?.toLowerCase().includes("gift"));
            if (!hasGift) return false;
          } else if (selectedDealType === "today_deal" && !product.is_today_deal) {
            return false;
          } else if (selectedDealType === "best_deal" && !product.is_best_deal) {
            return false;
          } else if (selectedDealType === "featured" && !product.is_featured) {
            return false;
          } else if (selectedDealType === "best_seller" && !product.is_best_seller) {
            return false;
          } else if (selectedDealType === "new_arrival" && !product.is_new_arrival) {
            return false;
          }
        }

        // 5. Price Range Filter
        const productPrice = Number(product.price);
        if (maxPrice && productPrice > Number(maxPrice)) return false;

        // 6. In-Stock Availability Filter
        if (inStockOnly && product.stock <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        // Sorting
        if (sortBy === "price_asc") {
          return a.price - b.price;
        }
        if (sortBy === "price_desc") {
          return b.price - a.price;
        }
        if (sortBy === "discount") {
          const discountA =
            a.compare_at_price && a.compare_at_price > a.price
              ? (a.compare_at_price - a.price) / a.compare_at_price
              : 0;
          const discountB =
            b.compare_at_price && b.compare_at_price > b.price
              ? (b.compare_at_price - b.price) / b.compare_at_price
              : 0;
          return discountB - discountA;
        }
        if (sortBy === "newest") {
          return (
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
        }
        // Default "featured" sort: prioritize deal flags then newest
        const scoreA =
          (a.is_today_deal ? 4 : 0) +
          (a.is_best_deal ? 3 : 0) +
          (a.is_featured ? 2 : 0) +
          (a.is_best_seller ? 1 : 0);
        const scoreB =
          (b.is_today_deal ? 4 : 0) +
          (b.is_best_deal ? 3 : 0) +
          (b.is_featured ? 2 : 0) +
          (b.is_best_seller ? 1 : 0);
        return scoreB - scoreA;
      });
  }, [
    initialProducts,
    categories,
    searchQuery,
    selectedCategories,
    selectedBrands,
    selectedDealType,
    maxPrice,
    inStockOnly,
    sortBy,
  ]);

  const matchedInitialCategory = initialCategory
    ? categories.find((c) => matchCategoryOrSlug(c, initialCategory))
    : undefined;
  const resolvedInitialCategoryName = matchedInitialCategory
    ? resolveCategoryContent(matchedInitialCategory, locale).displayName
    : initialCategoryName;

  // Render Sidebar Content (Shared between Desktop Sidebar and Mobile Slide Drawer)
  const renderFilterControls = () => (
    <div className="space-y-6 text-xs text-neutral-800">
      {/* 1. Categories Filter */}
      {categories.length > 0 && (
        <div className="border-b border-neutral-200/80 pb-5">
          <button
            type="button"
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full font-bold text-neutral-900 text-xs sm:text-sm uppercase tracking-wider mb-3 cursor-pointer"
          >
            <span>{tShop("categories")}</span>
            {openSections.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openSections.categories && (
            <div className="space-y-1.5 pt-1">
              {categories.map((cat) => {
                const isSelected = selectedCategories.some((selected) => matchCategoryOrSlug(cat, selected));
                const count = categoryCounts[cat.id] || categoryCounts[cat.slug] || 0;
                const displayCatName = resolveCategoryContent(cat, locale).displayName;

                return (
                  <label
                    key={cat.id}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      isSelected ? "bg-[#8A1538]/10 text-[#8A1538] font-bold" : "hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCategory(cat.slug || cat.id)}
                        className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
                      />
                      <span className="truncate text-xs">{displayCatName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                      ({count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Brands Filter */}
      {brands.length > 0 && (
        <div className="border-b border-neutral-200/80 pb-5">
          <button
            type="button"
            onClick={() => toggleSection("brands")}
            className="flex items-center justify-between w-full font-bold text-neutral-900 text-xs sm:text-sm uppercase tracking-wider mb-3 cursor-pointer"
          >
            <span>{tShop("brands")}</span>
            {openSections.brands ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openSections.brands && (
            <div className="space-y-1.5 pt-1">
              {brands.map((b) => {
                const isSelected =
                  selectedBrands.includes(b.id) || selectedBrands.includes(b.slug);
                const count = brandCounts[b.id] || brandCounts[b.slug] || 0;
                const displayBrandName = resolveBrandContent(b, locale).displayName;

                return (
                  <label
                    key={b.id}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      isSelected ? "bg-[#8A1538]/10 text-[#8A1538] font-bold" : "hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBrand(b.slug || b.id)}
                        className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
                      />
                      <span className="truncate text-xs">{displayBrandName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                      ({count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Deals & Special Offers */}
      <div className="border-b border-neutral-200/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("deals")}
          className="flex items-center justify-between w-full font-bold text-neutral-900 text-xs sm:text-sm uppercase tracking-wider mb-3 cursor-pointer"
        >
          <span>{tShop("specialDealsOffers")}</span>
          {openSections.deals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {openSections.deals && (
          <div className="space-y-1.5 pt-1">
            {[
              { key: "all", label: tShop("allItems"), icon: ShoppingBag, color: "text-neutral-500" },
              { key: "free_gift", label: tShop("freeGiftIncluded"), icon: Gift, color: "text-amber-600" },
              { key: "best_deal", label: tShop("bestDeals"), icon: Sparkles, color: "text-amber-500" },
              { key: "featured", label: tShop("featuredGear"), icon: Star, color: "text-yellow-600" },
              { key: "best_seller", label: tShop("bestSellers"), icon: Award, color: "text-indigo-600" },
              { key: "new_arrival", label: tShop("newArrivals"), icon: Tag, color: "text-cyan-600" },
            ].map((deal) => {
              const isSelected = selectedDealType === deal.key;
              return (
                <button
                  key={deal.key}
                  type="button"
                  onClick={() => setSelectedDealType(deal.key)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#8A1538] text-white shadow-xs"
                      : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <deal.icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : deal.color}`} />
                    <span>{deal.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Price Range Filter */}
      <div className="border-b border-neutral-200/80 pb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-extrabold text-neutral-900 text-xs sm:text-sm tracking-wider uppercase">
            {tShop("maxPrice")}
          </span>
          <span className="font-bold text-xs sm:text-sm text-[#8A1538]">
            {formatPrice(currentSliderMax, locale, currency)}
          </span>
        </div>

        <div className="relative py-2">
          <input
            type="range"
            min={0}
            max={maxCatalogPrice}
            step={maxCatalogPrice > 5000 ? 100 : 50}
            value={currentSliderMax}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= maxCatalogPrice) {
                setMaxPrice("");
              } else {
                setMaxPrice(val.toString());
              }
            }}
            className="range-slider"
            style={{
              background: `linear-gradient(${isRtl ? "to left" : "to right"}, #8A1538 ${sliderPercent}%, #e2e8f0 ${sliderPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-1">
          <span>{formatPrice(0, locale, currency)}</span>
          <span>{formatPrice(maxCatalogPrice, locale, currency)}</span>
        </div>
      </div>

      {/* 5. In-Stock Availability */}
      <div>
        <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 cursor-pointer hover:border-neutral-300 transition-colors">
          <span className="font-bold text-neutral-800 text-xs">
            {tShop("inStockOnly")}
          </span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Reset All Filters */}
      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={handleClearAllFilters}
          className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{tShop("resetAllFiltersCount", { count: activeFiltersCount })}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Breadcrumb Header ── */}
        <nav aria-label={tCommon("breadcrumbAria")} className="text-xs text-neutral-500 mb-3 flex items-center gap-2">
          <Link href="/" className="hover:text-[#8A1538] transition-colors">
            {tNav("home")}
          </Link>
          <span>/</span>
          {resolvedInitialCategoryName ? (
            <>
              <Link href="/shop" className="hover:text-[#8A1538] transition-colors">{tShop("title")}</Link>
              <span>/</span>
              <span className="font-bold text-neutral-900">{resolvedInitialCategoryName}</span>
            </>
          ) : (
            <span className="font-bold text-neutral-900">{tShop("title")}</span>
          )}
        </nav>

        {/* ── Shop Hero Title & Live Controls ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-7 bg-[#8A1538] rounded-full inline-block" />
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                {resolvedInitialCategoryName || tShop("title")}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              {resolvedInitialCategoryName
                ? tShop("categorySubtitle", { category: resolvedInitialCategoryName })
                : tShop("subtitle")}
            </p>
          </div>

          {/* Search bar inside shop catalog */}
          <div className="relative w-full md:w-80">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tShop("searchCatalogPlaceholder")}
              className="w-full ps-9 pe-8 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={tNav("clearSearch")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Top Filter Bar & Sort Controls ── */}
        <div className="flex items-center justify-between gap-3 mb-6 bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
          {/* Start: Active Results Count */}
          <span className="text-xs sm:text-sm font-medium text-neutral-600">
            {filteredAndSortedProducts.length === 1
              ? tShop("foundProductSingular", { count: 1 })
              : tShop("foundProducts", { count: filteredAndSortedProducts.length })}
          </span>

          {/* End: Sort Dropdown (Desktop Only) & Mobile Filter Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Custom Sort By Dropdown - Desktop Only */}
            <div className="hidden lg:flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-500">
                {tShop("sortBy")}
              </label>
              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen((prev) => !prev)}
                  className={`inline-flex items-center justify-between gap-2.5 px-3 sm:px-3.5 py-2 bg-white hover:bg-neutral-50 border rounded-xl text-xs font-semibold text-neutral-800 shadow-2xs transition-all cursor-pointer ${
                    sortDropdownOpen
                      ? "border-[#8A1538] ring-2 ring-[#8A1538]/10"
                      : "border-neutral-200/90 hover:border-neutral-300"
                  }`}
                >
                  <span className="truncate">{sortOptions.find((o) => o.id === sortBy)?.label || tShop("sortFeatured")}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      sortDropdownOpen ? "rotate-180 text-[#8A1538]" : ""
                    }`}
                  />
                </button>

                {sortDropdownOpen && (
                  <div className="absolute end-0 top-full mt-1.5 w-48 sm:w-52 bg-white rounded-2xl border border-neutral-200/80 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                    {sortOptions.map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id);
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-start transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#8A1538]/5 text-[#8A1538] font-bold"
                              : "text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#8A1538] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile/Tablet Filter Button with Website Brand Color */}
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={(e) => openMobileDrawer(e.currentTarget)}
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-filter-drawer"
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-[#8A1538] hover:bg-[#72122f] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
              <span>{tShop("filters")}</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#8A1538] text-[10px] font-extrabold inline-flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Dismissible Active Filter Tags ── */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>{tShop("active")}</span>
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8A1538]/10 text-[#8A1538] text-xs font-bold">
                <span>{tShop("searchChip", { query: searchQuery })}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
              </span>
            )}

            {selectedDealType !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                <span>{tShop("offerChip", { offer: dealLabelMap[selectedDealType] || selectedDealType.replace("_", " ") })}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedDealType("all")} />
              </span>
            )}

            {selectedCategories.map((catIdOrSlug) => {
              const cat = categories.find((c) => matchCategoryOrSlug(c, catIdOrSlug));
              const displayCatName = cat ? resolveCategoryContent(cat, locale).displayName : decodeURIComponent(catIdOrSlug);
              return (
                <span
                  key={catIdOrSlug}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-800 text-xs font-semibold"
                >
                  <span>{displayCatName}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => toggleCategory(catIdOrSlug)} />
                </span>
              );
            })}

            {selectedBrands.map((brandIdOrSlug) => {
              const b = brands.find((brand) => brand.id === brandIdOrSlug || brand.slug === brandIdOrSlug);
              const displayBrandName = b ? resolveBrandContent(b, locale).displayName : brandIdOrSlug;
              return (
                <span
                  key={brandIdOrSlug}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-800 text-xs font-semibold"
                >
                  <span>{displayBrandName}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => toggleBrand(brandIdOrSlug)} />
                </span>
              );
            })}

            {maxPrice && Number(maxPrice) < maxCatalogPrice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8A1538]/10 text-[#8A1538] text-xs font-bold">
                <span>
                  {tShop("maxChip", { price: formatPrice(Number(maxPrice), locale, currency) })}
                </span>
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setMaxPrice("")}
                />
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold">
                <span>{tShop("inStockOnly")}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setInStockOnly(false)} />
              </span>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-[#8A1538] hover:underline cursor-pointer ms-1"
            >
              {tShop("clearAll")}
            </button>
          </div>
        )}

        {/* ── Main Catalog Grid + Desktop Sidebar Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Desktop Start Filter Sidebar (3 cols) with Fixed Header & Scrollable Body */}
          <aside className="hidden lg:flex lg:flex-col lg:col-span-3 bg-white rounded-3xl border border-neutral-200/80 shadow-xs sticky top-20 z-30 max-h-[calc(100vh-6rem)] overflow-hidden">
            {/* Sticky Header inside sidebar */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-200/80 bg-white shrink-0 z-10">
              <div className="flex items-center gap-2 font-black text-neutral-900 text-sm tracking-tight uppercase">
                <SlidersHorizontal className="w-4 h-4 text-[#8A1538]" />
                <span>{tShop("filters")}</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-[11px] font-bold text-[#8A1538] hover:underline cursor-pointer"
                >
                  {tShop("resetCount", { count: activeFiltersCount })}
                </button>
              )}
            </div>

            {/* Scrollable Filter Controls */}
            <div className="p-5 pt-4 overflow-y-auto flex-1 overscroll-contain pe-4 space-y-6 custom-scrollbar">
              {renderFilterControls()}
            </div>
          </aside>

          {/* End Product Grid (9 cols) */}
          <main className="lg:col-span-9 flex-1">
            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl bg-white border border-dashed border-neutral-300 shadow-xs">
                <PackageOpen className="w-14 h-14 mx-auto text-neutral-400 mb-3" />
                <h3 className="text-lg font-bold text-neutral-800">
                  {tShop("noProductsMatch")}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mt-1 mb-6">
                  {tShop("tryAdjustingFilters")}
                </p>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8A1538] text-white text-xs font-bold shadow hover:bg-[#720e2c] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{tShop("resetAllFilters")}</span>
                </button>
              </div>
            ) : (
              /* Exact matching card sizing grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredAndSortedProducts.map((prod, idx) => (
                  <ProductCard key={prod.id} product={prod} currency={currency} priority={idx < 4} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile Slide-Out Filter Drawer (Strict-Mode-Safe Portal) ── */}
      {isDrawerMounted && typeof document !== "undefined" && createPortal(
        <div ref={portalRootRef} className="fixed inset-0 z-[9999] lg:hidden flex justify-end">
          {/* Dark Backdrop */}
          <div
            onClick={closeMobileDrawer}
            aria-hidden="true"
            className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
              isDrawerVisible ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Slide panel */}
          <div
            id="mobile-filter-drawer"
            ref={drawerPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label={tShop("filterCatalog")}
            tabIndex={-1}
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && drawerPhaseRef.current === "closing") {
                drawerPhaseRef.current = "closed";
                setDrawerPhase("closed");
              }
            }}
            className={`relative z-[10000] w-80 sm:w-96 h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out focus:outline-none ${
              isDrawerVisible ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
            }`}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-[#8A1538]" />
                <span>{tShop("filterCatalog")}</span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMobileDrawer}
                className="p-1.5 rounded-full bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                aria-label={tCommon("close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {renderFilterControls()}
            </div>

            {/* Drawer Footer Action Buttons */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-200 text-neutral-800 font-bold text-xs cursor-pointer"
              >
                {tShop("reset")}
              </button>
              <button
                type="button"
                onClick={closeMobileDrawer}
                className="flex-2 py-2.5 px-4 rounded-xl bg-[#8A1538] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {tShop("showProductsCount", { count: filteredAndSortedProducts.length })}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
