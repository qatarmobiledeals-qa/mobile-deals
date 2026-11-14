import type {
  Banner,
  Brand,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  TranslationMetadata,
} from "../../types/database";

export type SupportedLocale = "en" | "ar";
export type FieldAvailability = "localized" | "fallback" | "empty";
export type FieldResolutionState =
  | "available"
  | "fallback"
  | "empty-both"
  | "not-applicable";

export interface ResolveFieldOptions {
  /** When true, missing values in both languages report "not-applicable" instead of "empty-both". */
  optional?: boolean;
}

export interface FieldReport {
  /** Normalized display string ("" when empty). */
  value: string;
  /** Normalized display string or null when empty. */
  resolvedValue: string | null;
  state: FieldResolutionState;
  availability: FieldAvailability;
  usedFallback: boolean;
  hasArabicContent: boolean;
  resolvedLocale: SupportedLocale | null;
}

export interface EntityAvailabilityReport {
  isFullyAvailable: boolean;
  hasPartialFallback: boolean;
  isEntirelyFallback: boolean;
  availableFieldCount: number;
  fallbackFieldCount: number;
  totalApplicableFields: number;
  fields: Record<string, FieldReport>;
}

export interface EntityReviewStatus {
  reviewTracking: "tracked" | "not-tracked";
  trackingScope: "tracked" | "not-tracked";
  isReviewed: boolean | null;
  reviewedAt: string | null;
  arabicUpdatedAt: string | null;
  metadata: TranslationMetadata | null;
}

export interface ResolvedProductImage extends ProductImage {
  displayAltText: string;
  hasArabicAltText: boolean;
  isAltFallback: boolean;
  altReport: FieldReport;
  reviewStatus: EntityReviewStatus;
}

export interface ResolvedVariant extends ProductVariant {
  displayName: string;
  availability: FieldAvailability;
  nameReport: FieldReport;
  reviewStatus: EntityReviewStatus;
}

export interface ResolvedSpecItem {
  key: string;
  label: string;
  value: string;
  keyAvailability: Exclude<FieldAvailability, "empty">;
  valueAvailability: Exclude<FieldAvailability, "empty">;
}

export interface ResolvedBrand extends Brand {
  displayName: string;
  availabilityReport: EntityAvailabilityReport;
  reviewStatus: EntityReviewStatus;
}

export interface ResolvedCategory extends Category {
  displayName: string;
  displayDescription: string | null;
  availabilityReport: EntityAvailabilityReport;
  reviewStatus: EntityReviewStatus;
}

export interface ResolvedBanner extends Banner {
  displayTitle: string | null;
  displayHighlightedText: string | null;
  displayDescription: string | null;
  displayPrimaryCtaText: string | null;
  displaySecondaryCtaText: string | null;
  availabilityReport: EntityAvailabilityReport;
  reviewStatus: EntityReviewStatus;
}

export interface ResolvedProduct
  extends Omit<Product, "product_images" | "product_variants" | "brand" | "category"> {
  displayName: string;
  displayShortDescription: string;
  displayDescription: string;
  displayBadgeText: string | null;
  displayFreeGift: string | null;
  displayWarranty: string | null;
  displayBrandName: string | null;
  displayCategoryName: string | null;
  brand?: ResolvedBrand | null;
  category?: ResolvedCategory | null;
  product_images: ResolvedProductImage[];
  product_variants: ResolvedVariant[];
  resolvedSpecifications: ResolvedSpecItem[];
  availabilityReport: EntityAvailabilityReport;
  reviewStatus: EntityReviewStatus;
}

/**
 * Canonical Arabic labels keyed by normalized snake_case English specification keys.
 */
export const KNOWN_SPEC_KEY_LABELS_AR: Record<string, string> = {
  product_name: "اسم المنتج",
  brand: "العلامة التجارية",
  model: "الموديل",
  category: "القسم",
  network: "شبكة الاتصال",
  sim_type: "نوع الشريحة",
  sim: "نوع الشريحة",
  display: "الشاشة",
  screen: "الشاشة",
  display_size: "حجم الشاشة",
  screen_size: "حجم الشاشة",
  display_resolution: "دقة الشاشة",
  screen_resolution: "دقة الشاشة",
  operating_system: "نظام التشغيل",
  os: "نظام التشغيل",
  processor: "المعالج",
  chipset: "المعالج",
  cpu: "المعالج",
  gpu: "معالج الرسوميات (GPU)",
  ram: "الذاكرة العشوائية (رام)",
  storage: "سعة التخزين",
  internal_storage: "سعة التخزين",
  rom: "سعة التخزين",
  battery: "سعة البطارية",
  battery_capacity: "سعة البطارية",
  camera: "الكاميرا",
  main_camera: "الكاميرا الخلفية",
  rear_camera: "الكاميرا الخلفية",
  front_camera: "الكاميرا الأمامية",
  selfie_camera: "الكاميرا الأمامية",
  connectivity: "الاتصال",
  wifi: "واي فاي",
  wi_fi: "واي فاي",
  bluetooth: "بلوتوث",
  usb: "منفذ USB",
  nfc: "تقنية NFC",
  charging: "الشحن",
  dimensions: "الأبعاد",
  weight: "الوزن",
  water_resistance: "مقاومة الماء",
  warranty: "الضمان",
  color: "اللون",
  colors: "الألوان",
  audio: "الصوت",
  sensors: "المستشعرات",
  ports: "المنافذ",
  material: "الخامة",
  in_the_box: "محتويات العلبة",
};

const SPEC_ACRONYMS = new Set([
  "SIM",
  "RAM",
  "ROM",
  "OS",
  "CPU",
  "GPU",
  "USB",
  "NFC",
  "GPS",
  "IP",
  "WIFI",
  "LED",
  "OLED",
  "AMOLED",
  "HDR",
  "HDMI",
  "5G",
  "4G",
  "LTE",
  "AI",
  "UI",
]);

/** Normalize runtime locale strings into one of the supported storefront locales. */
export function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  return locale === "ar" ? "ar" : "en";
}

/** True iff value is a string containing at least one non-whitespace character. */
export function hasText(val: string | null | undefined): val is string {
  return typeof val === "string" && val.trim().length > 0;
}

function createTrackedReviewStatus(entity: {
  is_arabic_reviewed?: boolean | null;
  arabic_updated_at?: string | null;
  translation_metadata?: TranslationMetadata | null;
}): EntityReviewStatus {
  const reviewedAt = entity.arabic_updated_at ?? null;
  return {
    reviewTracking: "tracked",
    trackingScope: "tracked",
    isReviewed: Boolean(entity.is_arabic_reviewed),
    reviewedAt,
    arabicUpdatedAt: reviewedAt,
    metadata: entity.translation_metadata ?? null,
  };
}

function createUntrackedReviewStatus(): EntityReviewStatus {
  return {
    reviewTracking: "not-tracked",
    trackingScope: "not-tracked",
    isReviewed: null,
    reviewedAt: null,
    arabicUpdatedAt: null,
    metadata: null,
  };
}

/**
 * Resolve a single localized text field according to the Phase 3A fallback matrix.
 * In Arabic locale, populated Arabic text is always preserved even when English is empty.
 */
export function resolveTextField(
  enVal: string | null | undefined,
  arVal: string | null | undefined,
  locale: string,
  options?: ResolveFieldOptions
): FieldReport {
  const targetLocale = normalizeLocale(locale);
  const hasEn = hasText(enVal);
  const hasAr = hasText(arVal);
  const emptyState: FieldResolutionState = options?.optional
    ? "not-applicable"
    : "empty-both";

  if (targetLocale === "ar") {
    if (hasAr) {
      const trimmed = arVal.trim();
      return {
        value: trimmed,
        resolvedValue: trimmed,
        state: "available",
        availability: "localized",
        usedFallback: false,
        hasArabicContent: true,
        resolvedLocale: "ar",
      };
    }

    if (hasEn) {
      const trimmed = enVal.trim();
      return {
        value: trimmed,
        resolvedValue: trimmed,
        state: "fallback",
        availability: "fallback",
        usedFallback: true,
        hasArabicContent: false,
        resolvedLocale: "en",
      };
    }

    return {
      value: "",
      resolvedValue: null,
      state: emptyState,
      availability: "empty",
      usedFallback: false,
      hasArabicContent: false,
      resolvedLocale: null,
    };
  }

  if (hasEn) {
    const trimmed = enVal.trim();
    return {
      value: trimmed,
      resolvedValue: trimmed,
      state: "available",
      availability: "localized",
      usedFallback: false,
      hasArabicContent: hasAr,
      resolvedLocale: "en",
    };
  }

  return {
    value: "",
    resolvedValue: null,
    state: emptyState,
    availability: "empty",
    usedFallback: false,
    hasArabicContent: hasAr,
    resolvedLocale: null,
  };
}

/**
 * Aggregate per-field reports into entity-level availability metrics using the unified
 * Phase 3A completeness invariant (totalApplicableFields === availableFieldCount + fallbackFieldCount).
 */
export function buildAvailabilityReport(
  fields: Record<string, FieldReport>
): EntityAvailabilityReport {
  let availableFieldCount = 0;
  let fallbackFieldCount = 0;

  for (const report of Object.values(fields)) {
    if (report.availability === "localized") {
      availableFieldCount += 1;
    } else if (report.availability === "fallback") {
      fallbackFieldCount += 1;
    }
  }

  const totalApplicableFields = availableFieldCount + fallbackFieldCount;
  return {
    isFullyAvailable: totalApplicableFields > 0 && fallbackFieldCount === 0,
    hasPartialFallback: availableFieldCount > 0 && fallbackFieldCount > 0,
    isEntirelyFallback:
      totalApplicableFields > 0 && availableFieldCount === 0 && fallbackFieldCount > 0,
    availableFieldCount,
    fallbackFieldCount,
    totalApplicableFields,
    fields,
  };
}

/** Format a canonical or snake_case English spec key into clean Title Case / acronyms. */
export function formatEnglishSpecKeyLabel(rawKey: string): string {
  const cleaned = rawKey.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .map((word) => {
      const upper = word.toUpperCase();
      if (upper === "WIFI") return "Wi-Fi";
      if (SPEC_ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Resolve product specifications preserving canonical key order with per-key label and value fallback.
 */
export function resolveProductSpecifications(
  specifications: Record<string, string> | null | undefined,
  specificationsAr: Record<string, string> | null | undefined,
  locale: string
): ResolvedSpecItem[] {
  const targetLocale = normalizeLocale(locale);
  const enSpecs = specifications && typeof specifications === "object" ? specifications : {};
  const arSpecs =
    specificationsAr && typeof specificationsAr === "object" ? specificationsAr : {};

  const orderedKeys: string[] = [];
  const seenKeys = new Set<string>();

  for (const key of [...Object.keys(enSpecs), ...Object.keys(arSpecs)]) {
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      orderedKeys.push(key);
    }
  }

  const resolved: ResolvedSpecItem[] = [];

  for (const key of orderedKeys) {
    const valueReport = resolveTextField(enSpecs[key], arSpecs[key], targetLocale);
    if (valueReport.resolvedValue === null || valueReport.availability === "empty") {
      continue;
    }

    const normalizedKey = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const arabicLabel = KNOWN_SPEC_KEY_LABELS_AR[normalizedKey];

    const isArabicKnownLabel = targetLocale === "ar" && Boolean(arabicLabel);
    const label = isArabicKnownLabel ? arabicLabel : formatEnglishSpecKeyLabel(key);
    const keyAvailability: Exclude<FieldAvailability, "empty"> =
      targetLocale === "ar" ? (arabicLabel ? "localized" : "fallback") : "localized";

    resolved.push({
      key,
      label,
      value: valueReport.resolvedValue,
      keyAvailability,
      valueAvailability: valueReport.availability,
    });
  }

  return resolved;
}

/** Resolve an individual product image's alt text with 3-step Arabic fallback chain. */
export function resolveProductImageAlt(
  image: ProductImage,
  locale: string,
  fallbackProductName: string
): ResolvedProductImage {
  const targetLocale = normalizeLocale(locale);
  const productTitleFallback = hasText(fallbackProductName) ? fallbackProductName.trim() : "";

  let altReport: FieldReport;

  if (targetLocale === "ar") {
    if (hasText(image.alt_text_ar)) {
      const val = image.alt_text_ar.trim();
      altReport = {
        value: val,
        resolvedValue: val,
        state: "available",
        availability: "localized",
        usedFallback: false,
        hasArabicContent: true,
        resolvedLocale: "ar",
      };
    } else if (hasText(image.alt_text)) {
      const val = image.alt_text.trim();
      altReport = {
        value: val,
        resolvedValue: val,
        state: "fallback",
        availability: "fallback",
        usedFallback: true,
        hasArabicContent: false,
        resolvedLocale: "en",
      };
    } else {
      altReport = {
        value: productTitleFallback,
        resolvedValue: productTitleFallback || null,
        state: productTitleFallback ? "fallback" : "empty-both",
        availability: productTitleFallback ? "fallback" : "empty",
        usedFallback: Boolean(productTitleFallback),
        hasArabicContent: false,
        resolvedLocale: null,
      };
    }
  } else {
    if (hasText(image.alt_text)) {
      const val = image.alt_text.trim();
      altReport = {
        value: val,
        resolvedValue: val,
        state: "available",
        availability: "localized",
        usedFallback: false,
        hasArabicContent: hasText(image.alt_text_ar),
        resolvedLocale: "en",
      };
    } else {
      altReport = {
        value: productTitleFallback,
        resolvedValue: productTitleFallback || null,
        state: productTitleFallback ? "fallback" : "empty-both",
        availability: productTitleFallback ? "fallback" : "empty",
        usedFallback: Boolean(productTitleFallback),
        hasArabicContent: hasText(image.alt_text_ar),
        resolvedLocale: productTitleFallback ? "en" : null,
      };
    }
  }

  return {
    ...image,
    displayAltText: altReport.value,
    hasArabicAltText: hasText(image.alt_text_ar),
    isAltFallback: altReport.usedFallback,
    altReport,
    reviewStatus: createUntrackedReviewStatus(),
  };
}

export function resolveProductImages(
  images: ProductImage[] | null | undefined,
  locale: string,
  fallbackProductName: string
): ResolvedProductImage[] {
  if (!Array.isArray(images)) return [];
  return images.map((img) => resolveProductImageAlt(img, locale, fallbackProductName));
}

export function resolveVariantContent(
  variant: ProductVariant,
  locale: string
): ResolvedVariant {
  const nameReport = resolveTextField(variant.name, variant.name_ar, locale);
  return {
    ...variant,
    displayName: nameReport.value,
    availability: nameReport.availability,
    nameReport,
    reviewStatus: createUntrackedReviewStatus(),
  };
}

export function resolveProductVariants(
  variants: ProductVariant[] | null | undefined,
  locale: string
): ResolvedVariant[] {
  if (!Array.isArray(variants)) return [];
  return variants.map((variant) => resolveVariantContent(variant, locale));
}

export function resolveBrandContent(brand: Brand, locale: string): ResolvedBrand {
  const nameReport = resolveTextField(brand.name, brand.name_ar, locale);
  return {
    ...brand,
    displayName: nameReport.value,
    availabilityReport: buildAvailabilityReport({ name: nameReport }),
    reviewStatus: createUntrackedReviewStatus(),
  };
}

export function resolveCategoryContent(
  category: Category,
  locale: string
): ResolvedCategory {
  const nameReport = resolveTextField(category.name, category.name_ar, locale);
  const descriptionReport = resolveTextField(
    category.description,
    category.description_ar,
    locale,
    { optional: true }
  );

  return {
    ...category,
    displayName: nameReport.value,
    displayDescription: descriptionReport.resolvedValue,
    availabilityReport: buildAvailabilityReport({
      name: nameReport,
      description: descriptionReport,
    }),
    reviewStatus: createTrackedReviewStatus(category),
  };
}

export function resolveBannerContent(banner: Banner, locale: string): ResolvedBanner {
  const titleReport = resolveTextField(banner.title, banner.title_ar, locale, {
    optional: true,
  });
  const highlightedTextReport = resolveTextField(
    banner.highlighted_text,
    banner.highlighted_text_ar,
    locale,
    { optional: true }
  );
  const descriptionReport = resolveTextField(
    banner.description,
    banner.description_ar,
    locale,
    { optional: true }
  );
  const primaryCtaReport = resolveTextField(
    banner.primary_cta_text,
    banner.primary_cta_text_ar,
    locale,
    { optional: true }
  );
  const secondaryCtaReport = resolveTextField(
    banner.secondary_cta_text,
    banner.secondary_cta_text_ar,
    locale,
    { optional: true }
  );

  return {
    ...banner,
    displayTitle: titleReport.resolvedValue,
    displayHighlightedText: highlightedTextReport.resolvedValue,
    displayDescription: descriptionReport.resolvedValue,
    displayPrimaryCtaText: primaryCtaReport.resolvedValue,
    displaySecondaryCtaText: secondaryCtaReport.resolvedValue,
    availabilityReport: buildAvailabilityReport({
      title: titleReport,
      highlightedText: highlightedTextReport,
      description: descriptionReport,
      primaryCtaText: primaryCtaReport,
      secondaryCtaText: secondaryCtaReport,
    }),
    reviewStatus: createTrackedReviewStatus(banner),
  };
}

export function resolveProductContent(product: Product, locale: string): ResolvedProduct {
  const nameReport = resolveTextField(product.name, product.name_ar, locale);
  const shortDescReport = resolveTextField(
    product.short_description,
    product.short_description_ar,
    locale,
    { optional: true }
  );
  const descReport = resolveTextField(product.description, product.description_ar, locale, {
    optional: true,
  });
  const badgeReport = resolveTextField(product.badge_text, product.badge_text_ar, locale, {
    optional: true,
  });
  const freeGiftReport = resolveTextField(product.free_gift, product.free_gift_ar, locale, {
    optional: true,
  });
  const warrantyReport = resolveTextField(product.warranty, product.warranty_ar, locale, {
    optional: true,
  });

  const resolvedBrand = product.brand ? resolveBrandContent(product.brand, locale) : null;
  const resolvedCategory = product.category
    ? resolveCategoryContent(product.category, locale)
    : null;

  return {
    ...product,
    displayName: nameReport.value,
    displayShortDescription: shortDescReport.value,
    displayDescription: descReport.value,
    displayBadgeText: badgeReport.resolvedValue,
    displayFreeGift: freeGiftReport.resolvedValue,
    displayWarranty: warrantyReport.resolvedValue,
    displayBrandName: resolvedBrand ? resolvedBrand.displayName : null,
    displayCategoryName: resolvedCategory ? resolvedCategory.displayName : null,
    brand: resolvedBrand,
    category: resolvedCategory,
    product_images: resolveProductImages(product.product_images, locale, nameReport.value),
    product_variants: resolveProductVariants(product.product_variants, locale),
    resolvedSpecifications: resolveProductSpecifications(
      product.specifications,
      product.specifications_ar,
      locale
    ),
    availabilityReport: buildAvailabilityReport({
      name: nameReport,
      shortDescription: shortDescReport,
      description: descReport,
      badgeText: badgeReport,
      freeGift: freeGiftReport,
      warranty: warrantyReport,
    }),
    reviewStatus: createTrackedReviewStatus(product),
  };
}

