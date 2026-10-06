"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, Heart, ShoppingCart, Menu, X, ChevronRight, Sparkles, Loader2, ArrowRight, Tag, ShoppingBag } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";

interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  badge_text: string | null;
  free_gift?: string | null;
  is_best_deal?: boolean;
  is_today_deal?: boolean;
  is_featured?: boolean;
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  product_images?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
  }>;
}

interface MainNavbarProps {
  whatsappNumber?: string;
  currency?: string;
}

export function MainNavbar({ whatsappNumber = "+97455000000", currency = "QAR" }: MainNavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isRelatedResults, setIsRelatedResults] = useState(false);
  const [directMatchCount, setDirectMatchCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const desktopSearchRef = React.useRef<HTMLDivElement>(null);
  const mobileSearchRef = React.useRef<HTMLDivElement>(null);
  
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
      setSearchResults([]);
      setIsLoading(false);
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

  // Lock background screen scrolling when mobile menu drawer is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalTouchAction = document.body.style.touchAction;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileMenuOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.touchAction = originalTouchAction;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [mobileMenuOpen]);

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

  const popularTags = ["iPhone", "Samsung", "AirPods", "Charger", "Watch"];

  const renderSearchResultsPopup = (isMobile = false) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return null;

    return (
      <div
        className={`absolute top-full left-0 right-0 ${
          isMobile ? "w-full max-h-[80vh]" : "w-full max-h-[480px]"
        } mt-1.5 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-98 duration-150 flex flex-col`}
      >
        {/* Top Header */}
        <div className="px-3.5 py-2 bg-neutral-50/90 border-b border-neutral-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-[#8A1538] shrink-0" />
            <span className="font-bold text-neutral-800 truncate text-[11px] sm:text-xs">
              {isLoading
                ? "Searching products..."
                : isRelatedResults && directMatchCount === 0
                ? `Related Products for "${trimmed}"`
                : `Related Products for "${trimmed}"`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#8A1538]/10 text-[#8A1538]">
              {searchResults.length} Products
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
                const primaryImg =
                  product.product_images?.find((img) => img.is_primary)?.image_url ||
                  product.product_images?.[0]?.image_url ||
                  "/placeholder-phone.png";
                const discountPercent =
                  product.compare_at_price && product.compare_at_price > product.price
                    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                    : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product.slug)}
                    className="group relative flex flex-col justify-between p-2 rounded-xl bg-neutral-50/70 hover:bg-white border border-neutral-200/80 hover:border-[#8A1538]/40 hover:shadow-sm transition-all duration-150 cursor-pointer text-left"
                  >
                    {/* Compact Image Container with Badge */}
                    <div className="relative w-full h-20 sm:h-24 bg-white rounded-lg overflow-hidden border border-neutral-100 p-1.5 flex items-center justify-center mb-1.5 shrink-0">
                      <Image
                        src={primaryImg}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 40vw, 120px"
                        className="object-contain p-0.5 group-hover:scale-105 transition-transform duration-200"
                      />
                      {discountPercent > 0 ? (
                        <span className="absolute top-1 left-1 bg-[#8A1538] text-white text-[8px] font-extrabold px-1 py-0.2 rounded shadow-2xs">
                          {discountPercent}% OFF
                        </span>
                      ) : product.free_gift ? (
                        <span className="absolute top-1 left-1 bg-amber-500 text-white text-[7px] font-extrabold px-1 py-0.2 rounded shadow-2xs">
                          🎁 GIFT
                        </span>
                      ) : product.is_best_deal ? (
                        <span className="absolute top-1 left-1 bg-amber-600 text-white text-[7px] font-extrabold px-1 py-0.2 rounded shadow-2xs">
                          DEAL
                        </span>
                      ) : null}
                    </div>

                    {/* Product Meta */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      {product.brand?.name && (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 mb-0.5 truncate">
                          {product.brand.name}
                        </span>
                      )}
                      <h4 className="text-[11px] sm:text-xs font-bold text-neutral-800 group-hover:text-[#8A1538] transition-colors line-clamp-1 leading-snug mb-1">
                        {product.name}
                      </h4>

                      <div className="mt-auto pt-0.5">
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span className="text-xs sm:text-[13px] font-black text-[#8A1538]">
                            {currency} {Number(product.price).toLocaleString()}
                          </span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="text-[9px] text-neutral-400 line-through">
                              {Number(product.compare_at_price).toLocaleString()}
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
              No products found.
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
            className="text-[11px] font-bold text-[#8A1538] hover:text-[#700f2c] flex items-center gap-1 transition-colors cursor-pointer ml-auto"
          >
            <span>View all results</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const whatsappCleanNumber = whatsappNumber.replace(/[^\d]/g, "");

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-2xs w-full max-w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3.5 w-full">
        {/* Mobile Header Row (Logo on Left | Cart & Menu on Right) */}
        <div className="flex md:hidden items-center justify-between gap-3 py-0.5">
          {/* Left: Mobile Logo */}
          <div className="shrink-0 flex items-center">
            <Logo size="md" />
          </div>

          {/* Right: Cart Button + Hamburger Menu Button */}
          <div className="flex items-center gap-1.5">
            {/* Cart Button with Red Count Badge */}
            <Link
              href="/cart"
              className="relative p-2 text-neutral-800 hover:text-[#8A1538] active:scale-95 transition-all"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0.5 right-0.5 bg-[#8A1538] text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            </Link>

            {/* Mobile Menu Trigger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -mr-1.5 text-neutral-800 hover:text-[#8A1538] active:scale-95 transition-all focus:outline-none cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Desktop Navbar Row (Completely Untouched for Desktop) */}
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
                    setSearchQuery(e.target.value);
                    setShowDesktopDropdown(true);
                  }}
                  placeholder="Search for mobiles, accessories, deals..."
                  className="w-full pl-10 pr-28 py-2.5 bg-neutral-50 border border-neutral-300 rounded-full text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8A1538] focus:bg-white focus:ring-2 focus:ring-[#8A1538]/10 transition-all"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowDesktopDropdown(false);
                    }}
                    className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 rounded-full transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-5 py-1.5 bg-[#8A1538] hover:bg-[#700f2c] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Live Autocomplete Popup */}
            {showDesktopDropdown && renderSearchResultsPopup(false)}
          </div>

          {/* Right Action Icons & WhatsApp Button */}
          <div className="flex items-center gap-4 md:gap-5">
            {/* Wishlist */}
            <Link
              href="/#deals"
              className="relative flex flex-col items-center text-neutral-700 hover:text-[#8A1538] transition-colors p-1"
              title="Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5 text-neutral-600 hover:text-[#8A1538]" />
                {totalWishlist > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#8A1538] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {totalWishlist}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium hidden lg:inline mt-0.5">Wishlist</span>
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative flex flex-col items-center text-neutral-700 hover:text-[#8A1538] transition-colors p-1"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-neutral-600 hover:text-[#8A1538]" />
                <span className="absolute -top-1.5 -right-2 bg-[#8A1538] text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <span className="text-[11px] font-medium hidden lg:inline mt-0.5">Cart</span>
            </Link>

            {/* WhatsApp Order CTA Button */}
            <a
              href={`https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
                "Hello Mobile Deals 👋 I would like to inquire about your latest deals and products."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-semibold rounded-full shadow-xs hover:shadow-sm transition-all"
              aria-label="Order on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span className="whitespace-nowrap">Order on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div ref={mobileSearchRef} className="mt-2.5 md:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowMobileDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowMobileDropdown(true);
                }}
                placeholder="Search for mobiles, accessories, deals..."
                className="w-full pl-10 pr-9 py-2.5 bg-neutral-100/90 border border-neutral-200/80 rounded-full text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8A1538] focus:bg-white focus:ring-1 focus:ring-[#8A1538]/20 transition-all shadow-2xs"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowMobileDropdown(false);
                  }}
                  className="absolute right-3 text-neutral-400 hover:text-neutral-600 focus:outline-none p-0.5"
                  aria-label="Clear search"
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

      {/* Mobile Slide-in Drawer on RIGHT Side - Portaled directly to document.body at z-[9999] so it is 100% on top of the bottom navbar */}
      {isMounted && mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden flex justify-end">
          {/* Dark Backdrop Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Right Sidebar Menu Panel */}
          <div className="relative z-[10000] w-[290px] sm:w-80 h-[100dvh] max-h-[100dvh] bg-white shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Sidebar Header */}
            <div className="shrink-0 p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
              <Logo size="md" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-neutral-200/70 hover:bg-neutral-300 text-neutral-700 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links - Scrollable middle area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-sm overscroll-contain">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-neutral-900 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span>Home</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-[#8A1538] bg-[#8A1538]/5 hover:bg-[#8A1538]/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#8A1538]" />
                  <span>Shop</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#8A1538]" />
              </Link>
              <Link
                href="/#categories"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-neutral-900 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span>All Categories</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
              <Link
                href="/#deals"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-neutral-900 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>Today&apos;s Best Deals</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-bold text-neutral-900 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span>Shopping Cart</span>
                <span className="px-2 py-0.5 rounded-full bg-[#8A1538] text-white text-xs font-bold">
                  {totalItems}
                </span>
              </Link>
              <Link
                href="/service-enquiry"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl font-medium text-neutral-700 hover:bg-[#8A1538]/5 hover:text-[#8A1538] transition-colors"
              >
                <span>Service & Repair</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
            </div>

            {/* Sidebar Bottom WhatsApp Action - Safe area padding & fully visible above phone bottom */}
            <div className="shrink-0 p-4 pb-8 border-t border-neutral-100 bg-neutral-50/90 space-y-2">
              <a
                href={`https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent(
                  "Hello Mobile Deals 👋 I would like to place an order or inquire about products."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-sm hover:bg-[#20ba59] active:scale-[0.98] transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                <span>Order on WhatsApp</span>
              </a>
              <p className="text-[11px] text-center text-neutral-400 font-medium">
                Fast doorstep delivery across Qatar 🇶🇦
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
