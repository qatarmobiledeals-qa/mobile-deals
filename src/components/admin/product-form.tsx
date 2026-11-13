"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createProductAction,
  updateProductAction,
  ProductInputPayload,
} from "@/app/actions/admin";
import { deleteCloudinaryImageAction } from "@/app/actions/cloudinary";
import { Category, Brand, Product, TranslationMetadata } from "@/types/database";
import { ImageUploader } from "./image-uploader";
import {
  Plus,
  Edit2,
  Package,
  Trash2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Flame,
  Star,
  Award,
  TableProperties,
  Languages,
  Sparkles,
  X,
  DollarSign,
  Layers,
  Gift,
  Tag,
  Loader2,
} from "lucide-react";

// Keys stored in specifications JSON that are internal (not user-facing specs)
const INTERNAL_SPEC_KEYS = new Set(["gift_enabled", "gift_image"]);

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  brands?: Brand[];
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
  onSuccess?: (savedProduct?: Product) => void;
}

export function ProductForm({
  product,
  categories,
  brands = [],
  isOpen,
  onClose,
  trigger,
  onSuccess,
}: ProductFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlled = typeof isOpen === "boolean";
  const open = isControlled ? isOpen : internalOpen;

  const handleClose = () => {
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  const isEditing = Boolean(product?.id);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [warranty, setWarranty] = useState("1 Year Qatar Official Warranty");

  // Gift & Promotional Badge State
  const [badgeText, setBadgeText] = useState("");
  const [giftName, setGiftName] = useState("");
  const [giftImage, setGiftImage] = useState("");
  const [giftEnabled, setGiftEnabled] = useState(false);

  // Promotional Flags
  const [isTodayDeal, setIsTodayDeal] = useState(false);
  const [isBestDeal, setIsBestDeal] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [dealEndsAt, setDealEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Images state
  const [images, setImages] = useState<
    Array<{
      image_url: string;
      cloudinary_public_id: string | null;
      is_primary: boolean;
      alt_text?: string;
      alt_text_ar?: string;
    }>
  >([{ image_url: "", cloudinary_public_id: null, is_primary: true, alt_text: "", alt_text_ar: "" }]);

  // Variants state
  const [variants, setVariants] = useState<
    Array<{
      name: string;
      name_ar?: string;
      sku: string;
      price: string;
      stock: string;
    }>
  >([]);

  // Technical Specifications state (key-value rows)
  const [specRows, setSpecRows] = useState<Array<{ key: string; value: string }>>([]);

  // Arabic Localization State
  const [nameAr, setNameAr] = useState("");
  const [shortDescAr, setShortDescAr] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [warrantyAr, setWarrantyAr] = useState("");
  const [badgeTextAr, setBadgeTextAr] = useState("");
  const [freeGiftAr, setFreeGiftAr] = useState("");
  const [isArabicReviewed, setIsArabicReviewed] = useState(false);
  const [translationMetadata, setTranslationMetadata] = useState<TranslationMetadata>({});
  const [specRowsAr, setSpecRowsAr] = useState<Array<{ key: string; value: string }>>([]);

  // Function to initialize/reset form with current product data or defaults
  const resetForm = useCallback(() => {
    if (product) {
      setName(product.name || "");
      setSlug(product.slug || "");
      setCategoryId(product.category_id || "");
      setBrandId(product.brand_id || "");
      setShortDesc(product.short_description || "");
      setDescription(product.description || "");
      setPrice(product.price !== undefined && product.price !== null ? String(product.price) : "");
      setCompareAtPrice(
        product.compare_at_price !== undefined && product.compare_at_price !== null
          ? String(product.compare_at_price)
          : ""
      );
      setStock(product.stock !== undefined && product.stock !== null ? String(product.stock) : "10");
      setWarranty(product.warranty || "1 Year Qatar Official Warranty");

      // Arabic Fields from product
      setNameAr(product.name_ar || "");
      setShortDescAr(product.short_description_ar || "");
      setDescriptionAr(product.description_ar || "");
      setWarrantyAr(product.warranty_ar || "");
      setBadgeTextAr(product.badge_text_ar || "");
      setFreeGiftAr(product.free_gift_ar || "");
      setIsArabicReviewed(Boolean(product.is_arabic_reviewed));
      setTranslationMetadata(product.translation_metadata || {});

      // Initialize Gift & Badge
      const giftImgFromSpecs = product.specifications?.gift_image || "";
      const isGiftActive = Boolean(
        product.free_gift ||
          giftImgFromSpecs ||
          product.specifications?.gift_enabled === "true" ||
          (product.badge_text && product.badge_text.toLowerCase().includes("gift"))
      );
      setGiftEnabled(isGiftActive);
      setBadgeText(product.badge_text || (isGiftActive ? "Free Gift" : ""));
      setGiftName(product.free_gift || "");
      setGiftImage(giftImgFromSpecs);

      setIsTodayDeal(product.is_today_deal ?? false);
      setIsBestDeal(product.is_best_deal ?? false);
      setIsFeatured(product.is_featured ?? false);
      setIsBestSeller(product.is_best_seller ?? false);
      setIsNewArrival(product.is_new_arrival ?? false);
      setDealEndsAt(product.deal_ends_at ? product.deal_ends_at.slice(0, 16) : "");
      setIsActive(product.is_active ?? true);

      const loadedImages =
        product.product_images && product.product_images.length > 0
          ? product.product_images.map((img) => ({
              image_url: img.image_url,
              cloudinary_public_id: img.cloudinary_public_id || null,
              is_primary: Boolean(img.is_primary),
              alt_text: img.alt_text || "",
              alt_text_ar: img.alt_text_ar || "",
            }))
          : [{ image_url: "", cloudinary_public_id: null, is_primary: true }];
      setImages(loadedImages);

      const loadedVariants =
        product.product_variants && product.product_variants.length > 0
          ? product.product_variants.map((v) => ({
              name: v.name,
              name_ar: v.name_ar || "",
              sku: v.sku || "",
              price: v.price !== undefined && v.price !== null ? String(v.price) : "",
              stock: String(v.stock ?? 5),
            }))
          : [];
      setVariants(loadedVariants);

      // Load spec rows from specifications, excluding internal keys
      const loadedSpecRows = Object.entries(product.specifications || {})
        .filter(([k]) => !INTERNAL_SPEC_KEYS.has(k))
        .map(([key, value]) => ({ key, value: String(value) }));
      setSpecRows(loadedSpecRows);

      // Load Arabic spec rows from specifications_ar
      const loadedSpecRowsAr = Object.entries(product.specifications_ar || {})
        .filter(([k]) => !INTERNAL_SPEC_KEYS.has(k))
        .map(([key, value]) => ({ key, value: String(value) }));
      setSpecRowsAr(loadedSpecRowsAr);
    } else {
      setName("");
      setSlug("");
      setCategoryId("");
      setBrandId("");
      setShortDesc("");
      setDescription("");
      setPrice("");
      setCompareAtPrice("");
      setStock("10");
      setWarranty("1 Year Qatar Official Warranty");
      setBadgeText("Free Gift");
      setGiftName("");
      setGiftImage("");
      setGiftEnabled(false);
      setIsTodayDeal(false);
      setIsBestDeal(false);
      setIsFeatured(false);
      setIsBestSeller(false);
      setIsNewArrival(false);
      setDealEndsAt("");
      setIsActive(true);
      setImages([{ image_url: "", cloudinary_public_id: null, is_primary: true }]);
      setVariants([]);
      setSpecRows([]);
      // Arabic reset
      setNameAr("");
      setShortDescAr("");
      setDescriptionAr("");
      setWarrantyAr("");
      setBadgeTextAr("");
      setFreeGiftAr("");
      setIsArabicReviewed(false);
      setTranslationMetadata({});
      setSpecRowsAr([]);
    }
    setError(null);
  }, [product]);

  // Sync state whenever modal opens or product changes
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetForm();
    }
  }, [open, resetForm]);

  // Prevent background page from scrolling while modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Auto-generate slug from name when creating
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const MAX_PRODUCT_IMAGES = 6;

  const handleAddImage = (url: string, publicId?: string | null) => {
    if (!url || !url.trim()) return;
    setImages((prev) => {
      const filtered = prev.filter((i) => i.image_url.trim().length > 0);
      if (filtered.length >= MAX_PRODUCT_IMAGES) {
        setError("Maximum 6 product images allowed (1 Cover + 5 Additional). Please delete an image first.");
        return prev;
      }
      const hasPrimary = filtered.some((i) => i.is_primary);
      return [
        ...filtered,
        {
          image_url: url.trim(),
          cloudinary_public_id: publicId || null,
          is_primary: !hasPrimary,
        },
      ];
    });
  };

  const handleRemoveImage = (targetUrl: string) => {
    // Immediately attempt to purge the removed image from Cloudinary in background
    if (targetUrl && targetUrl.trim()) {
      deleteCloudinaryImageAction(targetUrl.trim()).catch((err) => {
        console.warn("[product-form] Cloudinary delete warning:", err);
      });
    }

    setImages((prev) => {
      const filtered = prev.filter(
        (i) => i.image_url.trim().length > 0 && i.image_url.trim() !== targetUrl.trim()
      );
      if (filtered.length > 0 && !filtered.some((i) => i.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered.length > 0 ? filtered : [{ image_url: "", cloudinary_public_id: null, is_primary: true }];
    });
  };

  const handleSetPrimaryImage = (targetUrl: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_primary: img.image_url.trim() === targetUrl.trim(),
      }))
    );
  };

  const handleImageAltChange = (targetUrl: string, field: "alt_text" | "alt_text_ar", val: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.image_url.trim() === targetUrl.trim() ? { ...img, [field]: val } : img
      )
    );
  };

  // Add/Remove Variant
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { name: "12GB / 256GB - Phantom Black", name_ar: "", sku: "", price: price || "0", stock: "5" },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: string, val: string) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, [field]: val } : v))
    );
  };

  // Spec row handlers (English)
  const handleAddSpecRow = () => {
    setSpecRows((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSpecRowChange = (index: number, field: "key" | "value", val: string) => {
    setSpecRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: val } : row))
    );
  };

  // Spec row handlers (Arabic)
  const handleAddSpecRowAr = () => {
    setSpecRowsAr((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveSpecRowAr = (index: number) => {
    setSpecRowsAr((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSpecRowArChange = (index: number, field: "key" | "value", val: string) => {
    setSpecRowsAr((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: val } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name.trim()) throw new Error("Product name is required.");
      if (!slug.trim()) throw new Error("Product slug is required.");
      if (!price || Number(price) <= 0) throw new Error("A valid positive price is required.");

      const validImages = images
        .filter((img) => img.image_url.trim().length > 0)
        .map((img, idx) => ({
          image_url: img.image_url.trim(),
          cloudinary_public_id: img.cloudinary_public_id || null,
          is_primary: img.is_primary ?? idx === 0,
          display_order: idx + 1,
          alt_text: img.alt_text || null,
          alt_text_ar: img.alt_text_ar || null,
        }));

      const formattedVariants = variants.map((v) => ({
        name: v.name.trim(),
        name_ar: v.name_ar?.trim() || null,
        sku: v.sku.trim() || undefined,
        price: v.price ? Number(v.price) : undefined,
        stock:
          v.stock !== undefined && v.stock !== "" && !isNaN(Number(v.stock))
            ? Number(v.stock)
            : 0,
      }));

      // Build finalSpecifications from specRows (user-defined) + internal gift keys
      const finalSpecifications: Record<string, string> = {};

      // Add user-defined spec rows (non-empty keys only)
      for (const row of specRows) {
        const k = row.key.trim();
        const v = row.value.trim();
        if (k) finalSpecifications[k] = v;
      }

      // Preserve internal gift metadata
      if (giftImage && giftImage.trim()) {
        finalSpecifications["gift_image"] = giftImage.trim();
      }

      if (giftEnabled) {
        finalSpecifications["gift_enabled"] = "true";
      }

      // Build finalSpecificationsAr from specRowsAr
      const finalSpecificationsAr: Record<string, string> = {};
      for (const row of specRowsAr) {
        const k = row.key.trim();
        const v = row.value.trim();
        if (k) finalSpecificationsAr[k] = v;
      }

      // Update manual translation metadata
      const nowIso = new Date().toISOString();
      const updatedMetadata: TranslationMetadata = { ...translationMetadata };

      const setFieldMeta = (fieldKey: string, arabicVal?: string | null) => {
        if (arabicVal && arabicVal.trim()) {
          updatedMetadata[fieldKey] = {
            source: "manual",
            reviewed: isArabicReviewed,
            updated_at: nowIso,
          };
        }
      };

      setFieldMeta("name", nameAr);
      setFieldMeta("short_description", shortDescAr);
      setFieldMeta("description", descriptionAr);
      setFieldMeta("warranty", warrantyAr);
      if (giftEnabled) setFieldMeta("free_gift", freeGiftAr);
      setFieldMeta("badge_text", badgeTextAr);

      if (Object.keys(finalSpecificationsAr).length > 0) {
        updatedMetadata.specifications = {
          source: "manual",
          reviewed: isArabicReviewed,
          updated_at: nowIso,
        };
      }

      if (formattedVariants.some((v) => v.name_ar && v.name_ar.trim())) {
        updatedMetadata.variants = {
          source: "manual",
          reviewed: isArabicReviewed,
          updated_at: nowIso,
        };
      }

      if (validImages.some((img) => img.alt_text_ar && img.alt_text_ar.trim())) {
        updatedMetadata.images = {
          source: "manual",
          reviewed: isArabicReviewed,
          updated_at: nowIso,
        };
      }

      const payload: ProductInputPayload = {
        name: name.trim(),
        name_ar: nameAr.trim() || null,
        slug: slug.trim(),
        category_id: categoryId || null,
        brand_id: brandId || null,
        short_description: (shortDesc.trim() || null) as unknown as string,
        short_description_ar: shortDescAr.trim() || null,
        description: (description.trim() || null) as unknown as string,
        description_ar: descriptionAr.trim() || null,
        price: Number(price),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        stock: stock !== "" ? Number(stock) : 10,
        warranty: (warranty.trim() || null) as unknown as string,
        warranty_ar: warrantyAr.trim() || null,
        free_gift: giftEnabled && giftName.trim() ? giftName.trim() : (null as unknown as string),
        free_gift_ar: giftEnabled && freeGiftAr.trim() ? freeGiftAr.trim() : null,
        badge_text: giftEnabled ? (badgeText.trim() || "Free Gift") : (badgeText.trim() || (null as unknown as string)),
        badge_text_ar: badgeTextAr.trim() || null,
        is_today_deal: isTodayDeal,
        is_best_deal: isBestDeal,
        is_featured: isFeatured,
        is_best_seller: isBestSeller,
        is_new_arrival: isNewArrival,
        deal_ends_at: dealEndsAt ? new Date(dealEndsAt).toISOString() : null,
        is_active: isActive,
        specifications: finalSpecifications,
        specifications_ar: Object.keys(finalSpecificationsAr).length > 0 ? finalSpecificationsAr : null,
        is_arabic_reviewed: isArabicReviewed,
        arabic_updated_at: nameAr.trim() ? nowIso : null,
        translation_metadata: updatedMetadata,
        images: validImages,
        variants: formattedVariants,
      };

      let res;
      if (isEditing && product?.id) {
        res = await updateProductAction(product.id, payload);
      } else {
        res = await createProductAction(payload);
      }

      if (!res.success) {
        throw new Error(res.error || "Failed to save product.");
      }

      handleClose();
      router.refresh();
      if (onSuccess) onSuccess(res.data as Product | undefined);
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => (isControlled ? undefined : setInternalOpen(true))} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (isControlled ? undefined : setInternalOpen(true))}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#6c102c] text-white font-bold text-xs transition-all hover:scale-102 active:scale-98 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-[96vw] max-w-7xl my-auto max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100">
            {/* Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-950/90 backdrop-blur-md z-20">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-[#8A1538]/20 text-[#ff4b77] border border-[#8A1538]/30">
                  {isEditing ? <Edit2 className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {isEditing ? `Edit Product "${product?.name}"` : "Create New Product"}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                    Configure Qatar catalog pricing, Cloudinary images, marketing badges, and variants.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-2.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-6 sm:mx-8 mt-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Top Quick-Action Bar for Arabic Content Status */}
            <div className="mx-6 sm:mx-8 mt-4 px-5 py-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#8A1538]/15 text-[#ff4b77]">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Arabic Content Management</span>
                    {isArabicReviewed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Reviewed &amp; Approved</span>
                      </span>
                    ) : nameAr ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30">
                        Arabic Content Added
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-semibold">
                        Not Translated Yet
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Enter manual Arabic product titles, descriptions, technical specifications, and variant details below in Section 8.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={isArabicReviewed}
                    onChange={(e) => setIsArabicReviewed(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#8A1538] rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-neutral-300">Mark Reviewed</span>
                </label>
              </div>
            </div>

            {/* Scrollable Form Body - 2-Column Desktop Widescreen Layout */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (7 cols): General Information, Pricing, Variants */}
                <div className="lg:col-span-7 space-y-6">
                  {/* SECTION 1: General Product Information */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#ff4b77]" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          1. General Product Information
                        </h3>
                      </div>
                      <span className="text-[11px] text-neutral-500 font-normal">Catalog identity</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product Name */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. Samsung Galaxy S25 Ultra 5G"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                        />
                      </div>

                      {/* Slug */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          URL Slug *
                        </label>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="samsung-galaxy-s25-ultra-5g"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Category
                        </label>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm cursor-pointer"
                        >
                          <option value="">-- Select Store Category --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Brand */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Brand / Manufacturer
                        </label>
                        <select
                          value={brandId}
                          onChange={(e) => setBrandId(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm cursor-pointer"
                        >
                          <option value="">-- Select Brand --</option>
                          {brands.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Warranty */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Warranty Coverage
                        </label>
                        <input
                          type="text"
                          value={warranty}
                          onChange={(e) => setWarranty(e.target.value)}
                          placeholder="1 Year Official Qatar Warranty"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                        />
                      </div>

                      {/* Subtitle / Specs */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Short Subtitle / Key Highlight Specs
                        </label>
                        <input
                          type="text"
                          value={shortDesc}
                          onChange={(e) => setShortDesc(e.target.value)}
                          placeholder="e.g. 12GB RAM / 512GB Storage - Titanium Black - Snapdragon 8 Elite"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm"
                        />
                      </div>

                      {/* Detailed Description */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-semibold text-neutral-300 flex items-center justify-between text-xs">
                          <span>Detailed Description &amp; Overview</span>
                          <span className="text-[11px] text-neutral-500 font-normal">Shown in Product Overview tab</span>
                        </label>
                        <textarea
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Comprehensive product specifications, features, in-the-box contents, key highlights..."
                          className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] resize-y text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Pricing & Inventory */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          2. Pricing &amp; Stock Inventory
                        </h3>
                      </div>
                      <span className="text-[11px] text-neutral-500">Amounts in Qatari Riyal (QAR)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Sale Price */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Sale Price (QAR) *
                        </label>
                        <input
                          type="number"
                          required
                          step="any"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="5649"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono font-bold text-xs sm:text-sm focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
                        />
                      </div>

                      {/* Compare at Price */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Original Price (QAR)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={compareAtPrice}
                          onChange={(e) => setCompareAtPrice(e.target.value)}
                          placeholder="6199"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
                        />
                      </div>

                      {/* Stock Count */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Available Stock Qty
                        </label>
                        <input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="10"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Product Variants */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-400" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          3. Product Variants (Storage / Color Options)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/25 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Variant</span>
                      </button>
                    </div>

                    {variants.length === 0 ? (
                      <p className="text-[11px] text-neutral-500 italic p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                        No variants configured. The primary product price and stock quantity will apply to all orders.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 text-[11px] font-bold text-neutral-400">
                          <span className="sm:col-span-5">Variant Title &amp; Specification</span>
                          <span className="sm:col-span-2">SKU Code</span>
                          <span className="sm:col-span-2">Price (QAR)</span>
                          <span className="sm:col-span-2">Stock Qty</span>
                          <span className="sm:col-span-1 text-right">Action</span>
                        </div>

                        {variants.map((v, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 items-center"
                          >
                            <div className="sm:col-span-5 space-y-1.5">
                              <input
                                type="text"
                                value={v.name}
                                onChange={(e) => handleVariantChange(idx, "name", e.target.value)}
                                placeholder="e.g. 512GB Titanium Black"
                                className="w-full h-9 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#8A1538]"
                              />
                              <input
                                type="text"
                                dir="rtl"
                                value={v.name_ar || ""}
                                onChange={(e) => handleVariantChange(idx, "name_ar", e.target.value)}
                                placeholder="الاسم بالعربية (مثال: 512 جيجابايت أسود تيتانيوم)"
                                className="w-full h-8 px-3 rounded-lg bg-neutral-950/90 border border-neutral-800/80 text-neutral-300 text-[11px] focus:outline-none focus:border-[#8A1538] text-right"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                                placeholder="SKU-256GB"
                                className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-[#8A1538]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                                placeholder="Price"
                                className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#8A1538]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                                placeholder="Stock"
                                className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-[#8A1538]"
                              />
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                title="Remove variant"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECTION 7: Technical Specifications */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <TableProperties className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          7. Technical Specifications
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSpecRow}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Row</span>
                      </button>
                    </div>

                    {/* Quick Add Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mr-1">Quick Add:</span>
                      {[
                        "Brand",
                        "Model",
                        "Display Size",
                        "Display Resolution",
                        "Operating System",
                        "Processor",
                        "RAM",
                        "Internal Storage",
                        "Battery Capacity",
                        "Main Camera",
                        "SIM Type",
                        "Network",
                      ].map((preset) => {
                        const isAdded = specRows.some((r) => r.key.trim().toLowerCase() === preset.toLowerCase());
                        return (
                          <button
                            key={preset}
                            type="button"
                            disabled={isAdded}
                            onClick={() => {
                              setSpecRows((prev) => [...prev, { key: preset, value: "" }]);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                              isAdded
                                ? "bg-neutral-900/60 text-neutral-600 border border-neutral-800 cursor-not-allowed"
                                : "bg-neutral-800 hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-300 border border-neutral-700 hover:border-cyan-500/40 cursor-pointer"
                            }`}
                          >
                            + {preset}
                          </button>
                        );
                      })}
                    </div>

                    {specRows.length === 0 ? (
                      <div className="text-center p-5 rounded-xl bg-neutral-900 border border-dashed border-neutral-700">
                        <TableProperties className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
                        <p className="text-[11px] text-neutral-500 italic">
                          No specifications added yet. Click &quot;Add Row&quot; to add key-value spec entries like &quot;Display Size&quot; → &quot;6.8 inches&quot;.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Column header */}
                        <div className="grid grid-cols-12 gap-2 px-1 pb-1 border-b border-neutral-800">
                          <span className="col-span-5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Specification</span>
                          <span className="col-span-6 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Detail / Value</span>
                          <span className="col-span-1" />
                        </div>

                        {specRows.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={row.key}
                                onChange={(e) => handleSpecRowChange(idx, "key", e.target.value)}
                                placeholder="e.g. Display Size"
                                className="w-full h-9 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
                              />
                            </div>
                            <div className="col-span-6">
                              <input
                                type="text"
                                value={row.value}
                                onChange={(e) => handleSpecRowChange(idx, "value", e.target.value)}
                                placeholder="e.g. 6.8 inches"
                                className="w-full h-9 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveSpecRow(idx)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <p className="text-[10px] text-neutral-600 pt-1">
                          {specRows.length} specification{specRows.length !== 1 ? "s" : ""} — displayed as a table on the product page.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SECTION 8: Arabic Localization & Catalog Content */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/80 pb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-[#ff4b77]" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          8. Arabic Localization (التعريب والمحتوى العربي)
                        </h3>
                      </div>
                    </div>

                    {/* Review Status & Provenance Card */}
                    <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-start sm:items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isArabicReviewed}
                          onChange={(e) => setIsArabicReviewed(e.target.checked)}
                          className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer mt-0.5 sm:mt-0"
                        />
                        <div>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isArabicReviewed ? "text-emerald-400" : "text-neutral-500"}`} />
                            <span>Mark Arabic translation as reviewed and approved</span>
                          </span>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Confirm that Arabic product copy, specs, and variants have been verified for accuracy.
                          </p>
                        </div>
                      </label>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {isArabicReviewed ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                            Approved
                          </span>
                        ) : nameAr ? (
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30">
                            In Progress
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-500 text-[11px] font-bold">
                            Not Translated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arabic Text Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Arabic Product Name */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-semibold text-neutral-300 flex items-center justify-between text-xs">
                          <span>Arabic Product Name (اسم المنتج بالعربية)</span>
                          <span className="text-[10px] text-neutral-500 font-mono">RTL</span>
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={nameAr}
                          onChange={(e) => setNameAr(e.target.value)}
                          placeholder="مثال: سامسونج جالاكسي S25 الترا 5G"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm text-right"
                        />
                      </div>

                      {/* Arabic Warranty */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 flex items-center justify-between text-xs">
                          <span>Arabic Warranty (الضمان بالعربية)</span>
                          <span className="text-[10px] text-neutral-500 font-mono">RTL</span>
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={warrantyAr}
                          onChange={(e) => setWarrantyAr(e.target.value)}
                          placeholder="مثال: ضمان رسمي لمدة عام في قطر"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm text-right"
                        />
                      </div>

                      {/* Arabic Marketing Badge */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 flex items-center justify-between text-xs">
                          <span>Arabic Badge Text (شارة العرض بالعربية)</span>
                          <span className="text-[10px] text-neutral-500 font-mono">RTL</span>
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={badgeTextAr}
                          onChange={(e) => setBadgeTextAr(e.target.value)}
                          placeholder="مثال: عرض خاص، هدية مجانية"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm text-right"
                        />
                      </div>

                      {/* Arabic Free Gift */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-semibold text-neutral-300 flex items-center justify-between text-xs">
                          <span>Arabic Free Gift Offer (الهدية المجانية بالعربية)</span>
                          <span className="text-[10px] text-neutral-500 font-mono">RTL</span>
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={freeGiftAr}
                          onChange={(e) => setFreeGiftAr(e.target.value)}
                          placeholder="مثال: سماعة لاسلكية مجانية، شاحن سريع 45 واط"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm text-right"
                        />
                      </div>

                      {/* Arabic Short Subtitle */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-semibold text-neutral-300 flex items-center justify-between text-xs">
                          <span>Arabic Short Highlights Specs (أبرز المواصفات بالعربية)</span>
                          <span className="text-[10px] text-neutral-500 font-mono">RTL</span>
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={shortDescAr}
                          onChange={(e) => setShortDescAr(e.target.value)}
                          placeholder="مثال: 12 جيجابايت رام / 512 جيجابايت - أسود تيتانيوم - معالج سنابدراجون 8 إيليت"
                          className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] text-xs sm:text-sm text-right"
                        />
                      </div>

                      {/* Arabic Detailed Description */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-semibold text-neutral-300 flex items-center justify-between text-xs">
                          <span>Arabic Detailed Description (الوصف التفصيلي بالعربية)</span>
                          <span className="text-[10px] text-neutral-500 font-mono">RTL</span>
                        </label>
                        <textarea
                          rows={4}
                          dir="rtl"
                          value={descriptionAr}
                          onChange={(e) => setDescriptionAr(e.target.value)}
                          placeholder="المواصفات الشاملة للمنتج، المميزات، محتويات العلبة باللغة العربية..."
                          className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538] resize-y text-xs sm:text-sm text-right"
                        />
                      </div>
                    </div>

                    {/* Arabic Specifications Table */}
                    <div className="pt-4 border-t border-neutral-800/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TableProperties className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                            Arabic Technical Specifications (جدول المواصفات بالعربية)
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSpecRowAr}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 transition-all cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Arabic Row</span>
                        </button>
                      </div>

                      {specRowsAr.length === 0 ? (
                        <div className="text-center p-4 rounded-xl bg-neutral-900 border border-dashed border-neutral-800">
                          <p className="text-[11px] text-neutral-500 italic">
                            No Arabic specifications added yet. Click &quot;Add Arabic Row&quot; to specify Arabic key-value pairs manually.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 px-1 pb-1 border-b border-neutral-800">
                            <span className="col-span-5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-right">
                              المواصفة (Arabic Label)
                            </span>
                            <span className="col-span-6 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-right">
                              التفاصيل والقيمة (Arabic Detail)
                            </span>
                            <span className="col-span-1" />
                          </div>

                          {specRowsAr.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  dir="rtl"
                                  value={row.key}
                                  onChange={(e) => handleSpecRowArChange(idx, "key", e.target.value)}
                                  placeholder="مثال: حجم الشاشة"
                                  className="w-full h-9 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 text-right"
                                />
                              </div>
                              <div className="col-span-6">
                                <input
                                  type="text"
                                  dir="rtl"
                                  value={row.value}
                                  onChange={(e) => handleSpecRowArChange(idx, "value", e.target.value)}
                                  placeholder="مثال: 6.8 بوصة Dynamic AMOLED"
                                  className="w-full h-9 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 text-right"
                                />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSpecRowAr(idx)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                  title="Remove Arabic row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column (5 cols): Media Gallery, Marketing Badges, Visibility Switches */}
                <div className="lg:col-span-5 space-y-6">
                  {/* SECTION 4: Media Gallery */}
                  {/* SECTION 4: Media Gallery */}
                  {(() => {
                    const validImages = images.filter((img) => img.image_url.trim().length > 0);
                    const coverImage = validImages.find((img) => img.is_primary) || (validImages.length > 0 ? validImages[0] : null);
                    const additionalImages = validImages.filter((img) => img !== coverImage);
                    const isMaxReached = validImages.length >= MAX_PRODUCT_IMAGES;

                    return (
                      <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-5">
                        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                              4. Product Media Gallery
                            </h3>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                              isMaxReached
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                            }`}
                          >
                            {validImages.length} / {MAX_PRODUCT_IMAGES} Images
                          </span>
                        </div>

                        {/* Visual 6-Slot Tracker */}
                        <div className="grid grid-cols-6 gap-1.5 p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center text-[10px] font-semibold">
                          {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                            const isCoverSlot = slotIdx === 0;
                            const isFilled = slotIdx < validImages.length;
                            return (
                              <div
                                key={slotIdx}
                                className={`py-1 px-0.5 rounded-lg border transition-all ${
                                  isFilled
                                    ? isCoverSlot
                                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold"
                                      : "bg-cyan-500/10 border-cyan-500/25 text-cyan-300"
                                    : "bg-neutral-950/40 border-neutral-800 text-neutral-600"
                                }`}
                              >
                                <span className="block truncate">
                                  {isCoverSlot ? "★ Cover" : `Slot ${slotIdx + 1}`}
                                </span>
                                <span className="block text-[8px] sm:text-[9px] mt-0.5 opacity-80">
                                  {isFilled ? "Filled" : "Empty"}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Uploader or 6-Image Reached Notice */}
                        {isMaxReached ? (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                            <div className="flex items-center gap-2 font-bold text-amber-200">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>Maximum 6 Product Images Reached</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 pl-6 leading-relaxed">
                              You have uploaded 1 Cover image and 5 additional images. To add another image, please delete an existing image below first.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <ImageUploader
                              value=""
                              onChange={handleAddImage}
                              label={
                                validImages.length === 0
                                  ? "Upload Cover Image (Main Thumbnail)"
                                  : `Upload Additional Image (${MAX_PRODUCT_IMAGES - validImages.length} slots left)`
                              }
                            />
                            <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 pt-1">
                              <span>
                                {validImages.length === 0
                                  ? "⭐ First image uploaded will be set as the main Cover image."
                                  : `Next upload will be assigned to Slot #${validImages.length + 1} of ${MAX_PRODUCT_IMAGES}.`}
                              </span>
                              <span className="text-cyan-400 font-medium">
                                {MAX_PRODUCT_IMAGES - validImages.length} slots remaining
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Images List (Cover first, then Additional Gallery Images) */}
                        <div className="space-y-3 pt-1">
                          {validImages.length === 0 ? (
                            <p className="text-[11px] text-neutral-500 italic p-5 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
                              No product images attached yet. Upload a main cover image above to get started.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {/* Primary Cover Image Card */}
                              {coverImage && (
                                <div className="p-3.5 rounded-2xl bg-emerald-500/[0.04] border-2 border-emerald-500/30 text-xs space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">
                                      <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                                      Cover Image (Main Catalog Thumbnail)
                                    </span>
                                    <span className="text-[10px] text-neutral-500">Slot #1</span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                      <img
                                        src={coverImage.image_url}
                                        alt="cover thumb"
                                        className="w-14 h-14 object-contain rounded-xl bg-neutral-950 border border-emerald-500/20 shrink-0 p-1"
                                      />
                                      <div className="min-w-0">
                                        <p
                                          className="font-mono text-[11px] text-neutral-200 truncate max-w-[200px]"
                                          title={coverImage.image_url}
                                        >
                                          {coverImage.image_url}
                                        </p>
                                        <p className="text-[10px] text-emerald-400/90 mt-0.5 font-medium">
                                          Displayed on shop catalog, home page &amp; first slide
                                        </p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(coverImage.image_url)}
                                      className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
                                      title="Delete cover image"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20">
                                    <div>
                                      <label className="text-[10px] text-neutral-400 block mb-1">Alt Text (English)</label>
                                      <input
                                        type="text"
                                        value={coverImage.alt_text || ""}
                                        onChange={(e) => handleImageAltChange(coverImage.image_url, "alt_text", e.target.value)}
                                        placeholder="e.g. Front view of phone"
                                        className="w-full h-8 px-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-[11px] placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538]"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-neutral-400 block mb-1 text-right">النص البديل (عربي)</label>
                                      <input
                                        type="text"
                                        dir="rtl"
                                        value={coverImage.alt_text_ar || ""}
                                        onChange={(e) => handleImageAltChange(coverImage.image_url, "alt_text_ar", e.target.value)}
                                        placeholder="مثال: الواجهة الأمامية للجهاز"
                                        className="w-full h-8 px-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-[11px] text-right placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Additional Gallery Images (Slots 2..6, max 5) */}
                              {additionalImages.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between px-1 pt-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                      Additional Images ({additionalImages.length} / 5)
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                      Click &quot;Make Cover&quot; to swap
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {additionalImages.map((img, addIdx) => (
                                      <div
                                        key={img.image_url + addIdx}
                                        className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs hover:border-neutral-700 transition-colors space-y-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <img
                                              src={img.image_url}
                                              alt={`thumb ${addIdx + 2}`}
                                              className="w-11 h-11 object-contain rounded-xl bg-neutral-950 border border-neutral-800 shrink-0 p-1"
                                            />
                                            <div className="min-w-0">
                                              <p
                                                className="font-mono text-[11px] text-neutral-300 truncate max-w-[170px]"
                                                title={img.image_url}
                                              >
                                                {img.image_url}
                                              </p>
                                              <span className="text-[10px] text-neutral-500">
                                                Slot #{addIdx + 2}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => handleSetPrimaryImage(img.image_url)}
                                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all cursor-pointer"
                                              title="Set as main cover image"
                                            >
                                              Make Cover
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveImage(img.image_url)}
                                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                              title="Delete image"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
                                          <input
                                            type="text"
                                            value={img.alt_text || ""}
                                            onChange={(e) => handleImageAltChange(img.image_url, "alt_text", e.target.value)}
                                            placeholder="Alt Text (EN)"
                                            className="w-full h-7 px-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-[10px] placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538]"
                                          />
                                          <input
                                            type="text"
                                            dir="rtl"
                                            value={img.alt_text_ar || ""}
                                            onChange={(e) => handleImageAltChange(img.image_url, "alt_text_ar", e.target.value)}
                                            placeholder="النص البديل (عربي)"
                                            className="w-full h-7 px-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-[10px] text-right placeholder:text-neutral-600 focus:outline-none focus:border-[#8A1538]"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* SECTION 5: Badges & Free Gift Offer */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                          5. Promotional Badge &amp; Free Gift
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-300 block text-xs">
                            Custom Badge Text
                          </label>
                          <input
                            type="text"
                            value={badgeText}
                            onChange={(e) => setBadgeText(e.target.value)}
                            placeholder="e.g. Free Gift, With Buds"
                            className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#8A1538] text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-neutral-300 block text-xs">
                            Gift Item Name
                          </label>
                          <input
                            type="text"
                            value={giftName}
                            onChange={(e) => {
                              setGiftName(e.target.value);
                              if (e.target.value.trim() && !giftEnabled) {
                                setGiftEnabled(true);
                              }
                            }}
                            placeholder="e.g. Samsung 45W Charger"
                            className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#8A1538] text-xs"
                          />
                        </div>
                      </div>

                      {/* Gift Image */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-neutral-300 block text-xs">
                          Gift Thumbnail Image (Optional)
                        </label>
                        <ImageUploader
                          value={giftImage}
                          onChange={(url) => {
                            setGiftImage(url);
                            if (url && !giftEnabled) {
                              setGiftEnabled(true);
                            }
                          }}
                          label="Upload Gift Thumbnail"
                          folder="mobile-deals/gifts"
                        />
                      </div>

                      {/* Gift Enabled Switch */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={giftEnabled}
                          onChange={(e) => setGiftEnabled(e.target.checked)}
                          className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5" />
                            <span>Enable Free Gift Badge on Storefront</span>
                          </span>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Highlights the product with a promotional gift badge and gift subtitle.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* SECTION 6: Deal Toggles & Visibility */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
                        6. Storefront Visibility &amp; Deals
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={isTodayDeal}
                          onChange={(e) => setIsTodayDeal(e.target.checked)}
                          className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
                        />
                        <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>Today&apos;s Deal</span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={isBestDeal}
                          onChange={(e) => setIsBestDeal(e.target.checked)}
                          className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
                        />
                        <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Best Deal</span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
                        />
                        <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Featured</span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={isBestSeller}
                          onChange={(e) => setIsBestSeller(e.target.checked)}
                          className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
                        />
                        <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Best Seller</span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={isNewArrival}
                          onChange={(e) => setIsNewArrival(e.target.checked)}
                          className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
                        />
                        <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-cyan-400" />
                          <span>New Arrival</span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4 h-4 accent-[#8A1538] rounded cursor-pointer"
                        />
                        <span className="font-semibold text-emerald-400 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active in Store</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Action Buttons Footer */}
              <div className="mt-6 pt-5 border-t border-neutral-800 flex items-center justify-end gap-3 sticky bottom-0 bg-neutral-900 py-3 z-10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#6c102c] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isEditing ? "Save Product Changes" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
