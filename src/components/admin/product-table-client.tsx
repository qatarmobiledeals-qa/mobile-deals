"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, Category, Brand } from "@/types/database";
import { ProductForm } from "./product-form";
import { ProductActions } from "./product-actions";
import {
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface ProductTableClientProps {
  initialProducts: Product[];
  categories: Category[];
  brands: Brand[];
}

export function ProductTableClient({
  initialProducts,
  categories,
  brands,
}: ProductTableClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [badgeFilter, setBadgeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "stock-asc">("newest");

  // Keep state in sync with server changes
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleProductSaved = (saved?: Product) => {
    if (saved) {
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
    }
    setEditingProduct(null);
  };

  const handleToggleActive = (id: string, newStatus: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: newStatus } : p))
    );
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        const matchesBrand = p.brand?.name?.toLowerCase().includes(q);
        if (!matchesName && !matchesSlug && !matchesBrand) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && p.category_id !== selectedCategory) {
        return false;
      }

      // Stock filter
      if (stockFilter === "low" && (p.stock > 5 || p.stock === 0)) return false;
      if (stockFilter === "out" && p.stock > 0) return false;
      if (stockFilter === "in" && p.stock <= 0) return false;

      // Badge filter
      if (badgeFilter === "today" && !p.is_today_deal) return false;
      if (badgeFilter === "best" && !p.is_best_deal) return false;
      if (badgeFilter === "featured" && !p.is_featured) return false;
      if (badgeFilter === "bestseller" && !p.is_best_seller) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "stock-asc") return Number(a.stock) - Number(b.stock);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, search, selectedCategory, stockFilter, badgeFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, model, slug..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#8A1538]"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-[#8A1538]"
        >
          <option value="all">All Categories ({categories.length})</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-[#8A1538]"
        >
          <option value="all">All Stock Statuses</option>
          <option value="in">In Stock (&gt; 5)</option>
          <option value="low">Low Stock (≤ 5)</option>
          <option value="out">Out of Stock (0)</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-[#8A1538]"
        >
          <option value="newest">Newest Added</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="stock-asc">Stock: Low to High</option>
        </select>
      </div>

      {/* Results Count & Badges Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 px-1">
        <div className="flex items-center gap-2">
          <span>Showing <strong className="text-white">{filteredProducts.length}</strong> of {products.length} items</span>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "all", label: "All Items" },
            { key: "today", label: "Today's Deal" },
            { key: "best", label: "Best Deal" },
            { key: "featured", label: "Featured" },
            { key: "bestseller", label: "Best Seller" },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setBadgeFilter(pill.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                badgeFilter === pill.key
                  ? "bg-[#8A1538] text-white"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900/90 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Package className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
            <h3 className="text-base font-bold text-white">No matching products found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              Try adjusting your search keywords or clear filters to view catalog items.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setStockFilter("all");
                setBadgeFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase font-bold text-[10px]">
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Inventory</th>
                  <th className="py-3.5 px-3">Marketing Flags</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium text-neutral-300">
                {filteredProducts.map((prod) => {
                  const img =
                    prod.product_images?.find((i) => i.is_primary)?.image_url ||
                    prod.product_images?.[0]?.image_url;

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-800/40">
                      {/* Product Name & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            {img ? (
                              <Image
                                src={img}
                                alt={prod.name}
                                fill
                                sizes="48px"
                                className="object-contain p-0.5"
                              />
                            ) : (
                              <span className="text-base">📱</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block line-clamp-1">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              /{prod.slug}
                            </span>
                            {prod.short_description && (
                              <span className="text-[11px] text-neutral-400 block line-clamp-1 mt-0.5">
                                {prod.short_description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-semibold text-neutral-300 inline-block">
                          {prod.category?.name || "Uncategorized"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono">
                          <span className="font-bold text-white block">
                            QAR {Number(prod.price).toLocaleString()}
                          </span>
                          {prod.compare_at_price && (
                            <span className="text-[10px] text-neutral-500 line-through">
                              QAR {Number(prod.compare_at_price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              prod.stock > 5
                                ? "bg-emerald-400"
                                : prod.stock > 0
                                ? "bg-amber-400"
                                : "bg-rose-400"
                            }`}
                          />
                          <span
                            className={`font-mono font-bold ${
                              prod.stock <= 5 ? "text-amber-400" : "text-neutral-300"
                            }`}
                          >
                            {prod.stock} units
                          </span>
                        </div>
                      </td>

                      {/* Marketing Flags */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {prod.is_today_deal && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-[#ff4b77] border border-rose-500/30 text-[10px] font-bold">
                              Today Deal
                            </span>
                          )}
                          {prod.is_best_deal && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              Best Deal
                            </span>
                          )}
                          {prod.is_best_seller && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                              Best Seller
                            </span>
                          )}
                          {prod.badge_text && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              {prod.badge_text}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            prod.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-neutral-800 text-neutral-500 border-neutral-700"
                          }`}
                        >
                          {prod.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(prod)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>

                          <ProductActions
                            id={prod.id}
                            slug={prod.slug}
                            isActive={prod.is_active}
                            onToggleSuccess={(newStatus) => handleToggleActive(prod.id, newStatus)}
                            onDeleteSuccess={(id) => handleDeleteProduct(id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Edit Modal */}
      {editingProduct && (
        <ProductForm
          isOpen={Boolean(editingProduct)}
          product={editingProduct}
          categories={categories}
          brands={brands}
          onClose={() => setEditingProduct(null)}
          onSuccess={handleProductSaved}
        />
      )}
    </div>
  );
}
