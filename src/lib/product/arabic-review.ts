import type { TranslationMetadata } from "@/types/database";

export interface ProductInputPayloadForReview {
  id?: string;
  name: string;
  name_ar?: string | null;
  slug?: string;
  category_id?: string | null;
  brand_id?: string | null;
  short_description?: string;
  short_description_ar?: string | null;
  description?: string;
  description_ar?: string | null;
  price?: number;
  compare_at_price?: number | null;
  stock?: number;
  warranty?: string;
  warranty_ar?: string | null;
  free_gift?: string;
  free_gift_ar?: string | null;
  badge_text?: string;
  badge_text_ar?: string | null;
  specifications?: Record<string, string>;
  specifications_ar?: Record<string, string> | null;
  is_arabic_reviewed?: boolean;
  arabic_updated_at?: string | null;
  translation_metadata?: TranslationMetadata | null;
  images?: Array<{
    image_url: string;
    cloudinary_public_id?: string | null;
    is_primary?: boolean;
    display_order?: number;
    alt_text?: string | null;
    alt_text_ar?: string | null;
  }>;
  variants?: Array<{
    id?: string;
    name: string;
    name_ar?: string | null;
    sku?: string;
    price?: number | null;
    compare_at_price?: number | null;
    stock?: number;
  }>;
}

/**
 * Resolves the manual product Arabic review state and validates that a product is NEVER marked
 * fully reviewed while any applicable translated field remains empty or unreviewed.
 *
 * Applicable fields when English content exists:
 * - name -> name_ar (mandatory)
 * - short_description -> short_description_ar
 * - description -> description_ar
 * - warranty -> warranty_ar
 * - free_gift -> free_gift_ar
 * - badge_text -> badge_text_ar
 * - specifications -> specifications_ar (all English keys must have non-empty Arabic values)
 * - variants -> variant name_ar (each variant with an English name must have an Arabic name)
 */
export function resolveProductArabicReviewState(
  data: ProductInputPayloadForReview,
  existingProduct?: {
    name?: string | null;
    short_description?: string | null;
    description?: string | null;
    warranty?: string | null;
    free_gift?: string | null;
    badge_text?: string | null;
    specifications?: Record<string, string> | null;
    is_arabic_reviewed?: boolean | null;
    translation_metadata?: TranslationMetadata | null;
  } | null
): {
  is_arabic_reviewed: boolean;
  translation_metadata: TranslationMetadata;
  arabic_updated_at: string | null;
} {
  const nowIso = new Date().toISOString();
  const existingMeta: TranslationMetadata = existingProduct?.translation_metadata || {};
  const clientMeta: TranslationMetadata = data.translation_metadata || {};
  const mergedMeta: TranslationMetadata = { ...existingMeta, ...clientMeta };

  const hasText = (val: unknown): boolean => typeof val === "string" && val.trim().length > 0;

  let allApplicableFieldsPresentAndReviewed = true;
  let hasAnyArabicContent = false;

  interface FieldCheck {
    key: string;
    englishVal?: string | null;
    arabicVal?: string | null;
  }

  const fieldsToCheck: FieldCheck[] = [
    { key: "name", englishVal: data.name, arabicVal: data.name_ar },
    { key: "short_description", englishVal: data.short_description, arabicVal: data.short_description_ar },
    { key: "description", englishVal: data.description, arabicVal: data.description_ar },
    { key: "warranty", englishVal: data.warranty, arabicVal: data.warranty_ar },
    { key: "free_gift", englishVal: data.free_gift, arabicVal: data.free_gift_ar },
    { key: "badge_text", englishVal: data.badge_text, arabicVal: data.badge_text_ar },
  ];

  for (const f of fieldsToCheck) {
    const englishPresent = hasText(f.englishVal);
    const arabicPresent = hasText(f.arabicVal);

    if (arabicPresent) {
      hasAnyArabicContent = true;
    }

    if (englishPresent) {
      if (!arabicPresent) {
        allApplicableFieldsPresentAndReviewed = false;
        mergedMeta[f.key] = {
          source: "manual",
          reviewed: false,
          updated_at: nowIso,
        };
      } else {
        const existingEnglish = existingProduct ? (existingProduct as Record<string, unknown>)[f.key] : undefined;
        const englishChanged = Boolean(
          existingProduct &&
          existingEnglish !== undefined &&
          existingEnglish !== f.englishVal &&
          hasText(existingEnglish)
        );

        const isReviewed = englishChanged ? false : Boolean(clientMeta[f.key]?.reviewed ?? data.is_arabic_reviewed);
        if (!isReviewed) {
          allApplicableFieldsPresentAndReviewed = false;
        }

        mergedMeta[f.key] = {
          source: "manual",
          reviewed: isReviewed,
          updated_at: clientMeta[f.key]?.updated_at || nowIso,
        };
      }
    }
  }

  // Check specifications
  if (data.specifications && typeof data.specifications === "object") {
    const engSpecKeys = Object.keys(data.specifications).filter((k) => hasText(data.specifications?.[k]));
    if (engSpecKeys.length > 0) {
      const arSpecs = data.specifications_ar || {};
      const allKeysTranslated = engSpecKeys.every((k) => hasText(arSpecs[k]));
      if (Object.keys(arSpecs).length > 0) hasAnyArabicContent = true;

      const specReviewed = allKeysTranslated && Boolean(clientMeta.specifications?.reviewed ?? data.is_arabic_reviewed);
      if (!specReviewed || !allKeysTranslated) {
        allApplicableFieldsPresentAndReviewed = false;
      }

      mergedMeta.specifications = {
        source: "manual",
        reviewed: specReviewed && allKeysTranslated,
        updated_at: clientMeta.specifications?.updated_at || nowIso,
      };
    }
  }

  // Check variants (using stable aggregate review instead of fragile array indices)
  if (Array.isArray(data.variants) && data.variants.length > 0) {
    const variantsWithEnglish = data.variants.filter((v) => hasText(v.name));
    if (variantsWithEnglish.length > 0) {
      const allVariantsTranslated = variantsWithEnglish.every((v) => hasText(v.name_ar));
      if (data.variants.some((v) => hasText(v.name_ar))) {
        hasAnyArabicContent = true;
      }

      const variantsReviewed = allVariantsTranslated && Boolean(clientMeta.variants?.reviewed ?? data.is_arabic_reviewed);
      if (!variantsReviewed || !allVariantsTranslated) {
        allApplicableFieldsPresentAndReviewed = false;
      }

      mergedMeta.variants = {
        source: "manual",
        reviewed: variantsReviewed && allVariantsTranslated,
        updated_at: clientMeta.variants?.updated_at || nowIso,
      };
    }
  }

  // Check images
  if (Array.isArray(data.images) && data.images.length > 0) {
    const hasAnyImageAltAr = data.images.some((img) => hasText(img.alt_text_ar));
    if (hasAnyImageAltAr) {
      hasAnyArabicContent = true;
      mergedMeta.images = {
        source: "manual",
        reviewed: Boolean(clientMeta.images?.reviewed ?? data.is_arabic_reviewed),
        updated_at: clientMeta.images?.updated_at || nowIso,
      };
    }
  }

  // If no Arabic content was provided at all, cannot be reviewed
  if (!hasAnyArabicContent) {
    allApplicableFieldsPresentAndReviewed = false;
  }

  const finalReviewed = Boolean(data.is_arabic_reviewed && allApplicableFieldsPresentAndReviewed);

  return {
    is_arabic_reviewed: finalReviewed,
    translation_metadata: mergedMeta,
    arabic_updated_at: hasAnyArabicContent ? (data.arabic_updated_at || nowIso) : null,
  };
}
