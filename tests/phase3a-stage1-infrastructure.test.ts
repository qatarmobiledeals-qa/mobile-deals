import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PostgrestClient } from "@supabase/postgrest-js";
import {
  formatEnglishSpecKeyLabel,
  resolveBannerContent,
  resolveBrandContent,
  resolveCategoryContent,
  resolveProductContent,
  resolveProductImageAlt,
  resolveProductSpecifications,
  resolveTextField,
  resolveVariantContent,
} from "../src/lib/i18n/content-resolver.ts";
import {
  buildNameBilingualOrFilter,
  buildProductSearchOrFilter,
  formatPostgrestIlikePattern,
  sanitizeSearchQuery,
} from "../src/lib/search-sanitizer.ts";
import {
  formatCurrency,
  formatNumber,
  formatPrice,
} from "../src/lib/formatters.ts";
import type {
  Banner,
  Brand,
  Category,
  Product,
  ProductImage,
  ProductVariant,
} from "../src/types/database.ts";

// ============================================================================
// SUITE 1: Centralized Bilingual Content Resolver & Spec Contract
// ============================================================================

test("ContentResolver: handles all 5 resolveTextField edge cases accurately", () => {
  // 1. Arabic locale: both EN and AR populated -> AR
  const bothAr = resolveTextField("iPhone 16 Pro", "آيفون 16 برو", "ar");
  assert.equal(bothAr.value, "آيفون 16 برو");
  assert.equal(bothAr.resolvedValue, "آيفون 16 برو");
  assert.equal(bothAr.state, "available");
  assert.equal(bothAr.availability, "localized");
  assert.equal(bothAr.usedFallback, false);
  assert.equal(bothAr.hasArabicContent, true);
  assert.equal(bothAr.resolvedLocale, "ar");

  // 2. Arabic locale: EN populated, AR missing/whitespace -> EN fallback
  const fallbackAr = resolveTextField("iPhone 16 Pro", "   ", "ar");
  assert.equal(fallbackAr.value, "iPhone 16 Pro");
  assert.equal(fallbackAr.resolvedValue, "iPhone 16 Pro");
  assert.equal(fallbackAr.state, "fallback");
  assert.equal(fallbackAr.availability, "fallback");
  assert.equal(fallbackAr.usedFallback, true);
  assert.equal(fallbackAr.hasArabicContent, false);
  assert.equal(fallbackAr.resolvedLocale, "en");

  // 3. Arabic locale: EN missing/null, AR populated -> keeps AR (never discards Arabic)
  const arOnly = resolveTextField(null, "محتوى عربي فقط", "ar");
  assert.equal(arOnly.value, "محتوى عربي فقط");
  assert.equal(arOnly.resolvedValue, "محتوى عربي فقط");
  assert.equal(arOnly.state, "available");
  assert.equal(arOnly.availability, "localized");
  assert.equal(arOnly.usedFallback, false);
  assert.equal(arOnly.hasArabicContent, true);
  assert.equal(arOnly.resolvedLocale, "ar");

  // 4. Both EN and AR missing -> empty-both (required) or not-applicable (optional)
  const emptyReq = resolveTextField("", null, "ar");
  assert.equal(emptyReq.value, "");
  assert.equal(emptyReq.resolvedValue, null);
  assert.equal(emptyReq.state, "empty-both");
  assert.equal(emptyReq.availability, "empty");

  const emptyOpt = resolveTextField("  ", undefined, "ar", { optional: true });
  assert.equal(emptyOpt.value, "");
  assert.equal(emptyOpt.resolvedValue, null);
  assert.equal(emptyOpt.state, "not-applicable");
  assert.equal(emptyOpt.availability, "empty");

  // 5a & 5b. English locale: uses EN when present, never falls back to AR when missing
  const enPopulated = resolveTextField("Smartphones", "الهواتف الذكية", "en");
  assert.equal(enPopulated.value, "Smartphones");
  assert.equal(enPopulated.state, "available");
  assert.equal(enPopulated.hasArabicContent, true);
  assert.equal(enPopulated.resolvedLocale, "en");

  const enMissingWithAr = resolveTextField(null, "الهواتف الذكية", "en", {
    optional: true,
  });
  assert.equal(enMissingWithAr.value, "");
  assert.equal(enMissingWithAr.resolvedValue, null);
  assert.equal(enMissingWithAr.state, "not-applicable");
  assert.equal(enMissingWithAr.availability, "empty");
  assert.equal(enMissingWithAr.hasArabicContent, true);
  assert.equal(enMissingWithAr.resolvedLocale, null);
});

test("ContentResolver: unified aggregate completeness formula and entity review scopes", () => {
  const categoryMixed: Category = Object.freeze({
    id: "cat-1",
    name: "Phones",
    name_ar: "الهواتف",
    slug: "phones",
    description: "Smartphones",
    description_ar: "   ",
    image_url: null,
    icon_name: null,
    display_order: 1,
    is_active: true,
    is_arabic_reviewed: true,
    arabic_updated_at: "2026-11-14T00:00:00Z",
    translation_metadata: { name: { source: "manual", reviewed: true } },
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-14T00:00:00Z",
  });

  const resolvedCatAr = resolveCategoryContent(categoryMixed, "ar");
  assert.equal(resolvedCatAr.displayName, "الهواتف");
  assert.equal(resolvedCatAr.displayDescription, "Smartphones");
  assert.deepEqual(
    {
      isFullyAvailable: resolvedCatAr.availabilityReport.isFullyAvailable,
      hasPartialFallback: resolvedCatAr.availabilityReport.hasPartialFallback,
      isEntirelyFallback: resolvedCatAr.availabilityReport.isEntirelyFallback,
      availableFieldCount: resolvedCatAr.availabilityReport.availableFieldCount,
      fallbackFieldCount: resolvedCatAr.availabilityReport.fallbackFieldCount,
      totalApplicableFields:
        resolvedCatAr.availabilityReport.totalApplicableFields,
    },
    {
      isFullyAvailable: false,
      hasPartialFallback: true,
      isEntirelyFallback: false,
      availableFieldCount: 1,
      fallbackFieldCount: 1,
      totalApplicableFields: 2,
    }
  );
  assert.equal(resolvedCatAr.reviewStatus.reviewTracking, "tracked");
  assert.equal(resolvedCatAr.reviewStatus.isReviewed, true);

  // Empty Banner in both locales: totalApplicableFields === 0 => isFullyAvailable === false
  const emptyBanner: Banner = Object.freeze({
    id: "ban-1",
    title: null,
    title_ar: "",
    highlighted_text: "  ",
    highlighted_text_ar: null,
    description: null,
    description_ar: null,
    primary_cta_text: null,
    primary_cta_text_ar: null,
    primary_cta_link: "/shop",
    secondary_cta_text: null,
    secondary_cta_text_ar: null,
    secondary_cta_link: null,
    desktop_image_url: "/banner.jpg",
    mobile_image_url: null,
    cloudinary_public_id: null,
    position: "hero",
    display_order: 1,
    is_active: true,
    is_arabic_reviewed: false,
    arabic_updated_at: null,
    translation_metadata: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
  });

  const resolvedEmptyBannerEn = resolveBannerContent(emptyBanner, "en");
  assert.equal(resolvedEmptyBannerEn.availabilityReport.totalApplicableFields, 0);
  assert.equal(resolvedEmptyBannerEn.availabilityReport.isFullyAvailable, false);
  assert.equal(resolvedEmptyBannerEn.reviewStatus.reviewTracking, "tracked");
  assert.equal(resolvedEmptyBannerEn.reviewStatus.isReviewed, false);

  // Untracked entities: Brand, Variant, Image always return not-tracked & isReviewed: null
  const brand: Brand = {
    id: "brand-1",
    name: "Apple",
    name_ar: "أبل",
    slug: "apple",
    logo_url: null,
    is_active: true,
    created_at: "2026-11-01T00:00:00Z",
  };
  const resolvedBrand = resolveBrandContent(brand, "ar");
  assert.equal(resolvedBrand.displayName, "أبل");
  assert.equal(resolvedBrand.reviewStatus.reviewTracking, "not-tracked");
  assert.equal(resolvedBrand.reviewStatus.isReviewed, null);

  const variant: ProductVariant = {
    id: "var-1",
    product_id: "prod-1",
    name: "256GB Desert Titanium",
    name_ar: "256 جيجابايت تيتانيوم صحراوي",
    sku: "IP16-256",
    price: 4599,
    compare_at_price: null,
    stock: 5,
    attributes: {},
    created_at: "2026-11-01T00:00:00Z",
  };
  const resolvedVar = resolveVariantContent(variant, "ar");
  assert.equal(resolvedVar.displayName, "256 جيجابايت تيتانيوم صحراوي");
  assert.equal(resolvedVar.reviewStatus.reviewTracking, "not-tracked");
  assert.equal(resolvedVar.reviewStatus.isReviewed, null);
});

test("ContentResolver: product specs, custom keys, image alt fallback chain & immutability", () => {
  const image1: ProductImage = Object.freeze({
    id: "img-1",
    product_id: "prod-1",
    cloudinary_public_id: null,
    image_url: "/img1.jpg",
    alt_text: "Front view EN",
    alt_text_ar: "منظر أمامي",
    display_order: 1,
    is_primary: true,
    created_at: "2026-11-01T00:00:00Z",
  });
  const image2: ProductImage = Object.freeze({
    id: "img-2",
    product_id: "prod-1",
    cloudinary_public_id: null,
    image_url: "/img2.jpg",
    alt_text: "Side view EN",
    alt_text_ar: null,
    display_order: 2,
    is_primary: false,
    created_at: "2026-11-01T00:00:00Z",
  });
  const image3: ProductImage = Object.freeze({
    id: "img-3",
    product_id: "prod-1",
    cloudinary_public_id: null,
    image_url: "/img3.jpg",
    alt_text: "  ",
    alt_text_ar: "",
    display_order: 3,
    is_primary: false,
    created_at: "2026-11-01T00:00:00Z",
  });

  const alt1Ar = resolveProductImageAlt(image1, "ar", "آيفون 16");
  assert.equal(alt1Ar.displayAltText, "منظر أمامي");
  assert.equal(alt1Ar.hasArabicAltText, true);
  assert.equal(alt1Ar.isAltFallback, false);
  assert.equal(alt1Ar.reviewStatus.reviewTracking, "not-tracked");
  assert.equal(alt1Ar.reviewStatus.isReviewed, null);

  const alt2Ar = resolveProductImageAlt(image2, "ar", "آيفون 16");
  assert.equal(alt2Ar.displayAltText, "Side view EN");
  assert.equal(alt2Ar.isAltFallback, true);

  const alt3Ar = resolveProductImageAlt(image3, "ar", "آيفون 16");
  assert.equal(alt3Ar.displayAltText, "آيفون 16");
  assert.equal(alt3Ar.isAltFallback, true);

  const alt3En = resolveProductImageAlt(image3, "en", "iPhone 16");
  assert.equal(alt3En.displayAltText, "iPhone 16");

  // Specifications contract
  assert.equal(formatEnglishSpecKeyLabel("vapor_chamber_cooling"), "Vapor Chamber Cooling");
  assert.equal(formatEnglishSpecKeyLabel("ram"), "RAM");

  const specs = resolveProductSpecifications(
    {
      battery: "5000 mAh",
      ram: "8GB",
      vapor_chamber_cooling: "Stainless Steel 4000mm²",
      charging: "45W Fast Charging",
    },
    {
      battery: "5000 مللي أمبير",
      vapor_chamber_cooling: "غرفة بخار من الفولاذ 4000 مم²",
      charging: "   ",
      ar_extra_feature: "يدعم اللغة العربية",
    },
    "ar"
  );

  assert.equal(specs.length, 5);
  assert.deepEqual(specs[0], {
    key: "battery",
    label: "سعة البطارية",
    value: "5000 مللي أمبير",
    keyAvailability: "localized",
    valueAvailability: "localized",
  });
  assert.deepEqual(specs[1], {
    key: "ram",
    label: "الذاكرة العشوائية (رام)",
    value: "8GB",
    keyAvailability: "localized",
    valueAvailability: "fallback",
  });
  assert.deepEqual(specs[2], {
    key: "vapor_chamber_cooling",
    label: "Vapor Chamber Cooling",
    value: "غرفة بخار من الفولاذ 4000 مم²",
    keyAvailability: "fallback",
    valueAvailability: "localized",
  });
  assert.deepEqual(specs[3], {
    key: "charging",
    label: "الشحن",
    value: "45W Fast Charging",
    keyAvailability: "localized",
    valueAvailability: "fallback",
  });
  assert.equal(specs[4].key, "ar_extra_feature");
  assert.equal(specs[4].value, "يدعم اللغة العربية");

  // Full frozen product immutability and resolution
  const product: Product = Object.freeze({
    id: "prod-1",
    name: "iPhone 16",
    name_ar: "آيفون 16",
    slug: "iphone-16",
    brand_id: "brand-1",
    category_id: "cat-1",
    short_description: "A18 chip",
    short_description_ar: null,
    description: "Full description",
    description_ar: "وصف كامل",
    price: 3499,
    compare_at_price: 3699,
    stock: 10,
    warranty: "1 Year",
    warranty_ar: "سنة واحدة",
    free_gift: null,
    free_gift_ar: "غطاء مجاني",
    badge_text: "Hot",
    badge_text_ar: "عرض",
    is_featured: true,
    is_best_deal: false,
    is_today_deal: true,
    is_best_seller: false,
    is_new_arrival: true,
    deal_ends_at: null,
    specifications: { battery: "3561 mAh" },
    specifications_ar: { battery: "3561 مللي أمبير" },
    is_active: true,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-14T00:00:00Z",
    is_arabic_reviewed: true,
    arabic_updated_at: "2026-11-14T01:00:00Z",
    translation_metadata: { name: { source: "manual", reviewed: true } },
    product_images: [image1, image2, image3],
    product_variants: [],
  });

  const resolvedProd = resolveProductContent(product, "ar");
  assert.equal(resolvedProd.displayName, "آيفون 16");
  assert.equal(resolvedProd.displayFreeGift, "غطاء مجاني");
  assert.equal(resolvedProd.displayShortDescription, "A18 chip");
  assert.equal(resolvedProd.availabilityReport.availableFieldCount, 5);
  assert.equal(resolvedProd.availabilityReport.fallbackFieldCount, 1);
  assert.equal(resolvedProd.availabilityReport.totalApplicableFields, 6);
  assert.equal(resolvedProd.reviewStatus.reviewTracking, "tracked");
  assert.equal(resolvedProd.reviewStatus.isReviewed, true);
});

// ============================================================================
// SUITE 2: Search Sanitization, PostgREST v2.115.0 Serialization & Projections
// ============================================================================

test("SearchSanitizer: passes all 12 adversarial & bilingual vectors + underscore escaping", () => {
  const vectors: Array<[string, string, string | null]> = [
    ["iPhone, Samsung", "iPhone Samsung", '"*iPhone Samsung*"'],
    ["Galaxy S24 (256GB)", "Galaxy S24 256GB", '"*Galaxy S24 256GB*"'],
    ['"iPhone" OR 1=1--', "iPhone OR 1 1", '"*iPhone OR 1 1*"'],
    ["iOS 18.2", "iOS 18.2", '"*iOS 18.2*"'],
    ["SM_S928B_DS", "SM_S928B_DS", '"*SM\\\\_S928B\\\\_DS*"'],
    ["100% genuine *deal*", "100 genuine deal", '"*100 genuine deal*"'],
    ["سامسونج جالكسي", "سامسونج جالكسي", '"*سامسونج جالكسي*"'],
    ["ايفون 16 Pro Max", "ايفون 16 Pro Max", '"*ايفون 16 Pro Max*"'],
    ["   iPad   Pro   ", "iPad Pro", '"*iPad Pro*"'],
    [
      "),id.is.not.null,name.ilike.(",
      "id.is.not.null name.ilike",
      '"*id.is.not.null name.ilike*"',
    ],
    ["Type-C; DROP TABLE products;", "Type-C DROP TABLE products", '"*Type-C DROP TABLE products*"'],
    ["___...---   ", "", null],
    ["100% _deal_", "100 _deal_", '"*100 \\\\_deal\\\\_*"'],
    ["a__b___c", "a__b___c", '"*a\\\\_\\\\_b\\\\_\\\\_\\\\_c*"'],
  ];

  for (const [raw, expectedClean, expectedPattern] of vectors) {
    assert.equal(sanitizeSearchQuery(raw), expectedClean, `sanitizeSearchQuery(${raw})`);
    assert.equal(
      formatPostgrestIlikePattern(raw),
      expectedPattern,
      `formatPostgrestIlikePattern(${raw})`
    );
  }

  // Runtime character-level check: two backslashes (0x5c, 0x5c) before each '_'
  const smPattern = formatPostgrestIlikePattern("SM_S928B_DS");
  assert.ok(smPattern);
  const firstUnderscoreIdx = smPattern.indexOf("_");
  assert.ok(firstUnderscoreIdx >= 2);
  assert.equal(smPattern.charCodeAt(firstUnderscoreIdx - 1), 0x5c);
  assert.equal(smPattern.charCodeAt(firstUnderscoreIdx - 2), 0x5c);
  assert.equal((smPattern.match(/\\\\_/g) || []).length, 2);

  const multiProductFilter = buildProductSearchOrFilter("a__b___c");
  assert.ok(multiProductFilter);
  assert.ok(multiProductFilter.includes('name.ilike."*a\\\\_\\\\_b\\\\_\\\\_\\\\_c*"'));
  assert.ok(multiProductFilter.includes('name_ar.ilike."*a\\\\_\\\\_b\\\\_\\\\_\\\\_c*"'));
  assert.ok(
    multiProductFilter.includes('short_description.ilike."*a\\\\_\\\\_b\\\\_\\\\_\\\\_c*"')
  );
  assert.ok(
    multiProductFilter.includes('short_description_ar.ilike."*a\\\\_\\\\_b\\\\_\\\\_\\\\_c*"')
  );
  assert.ok(multiProductFilter.includes('free_gift.ilike."*a\\\\_\\\\_b\\\\_\\\\_\\\\_c*"'));
  assert.ok(multiProductFilter.includes('free_gift_ar.ilike."*a\\\\_\\\\_b\\\\_\\\\_\\\\_c*"'));

  const multiNameFilter = buildNameBilingualOrFilter("SM_S928B_DS");
  assert.equal(
    multiNameFilter,
    'name.ilike."*SM\\\\_S928B\\\\_DS*",name_ar.ilike."*SM\\\\_S928B\\\\_DS*"'
  );

  assert.equal(buildProductSearchOrFilter("___...---   "), null);
  assert.equal(buildNameBilingualOrFilter(""), null);
});

test("PostgREST v2.115.0 Builder Serialization: encodes bilingual .or() filters safely", () => {
  const client = new PostgrestClient("https://example.supabase.co/rest/v1", {
    headers: { apikey: "anon-key" },
  });

  const filterClause = buildProductSearchOrFilter("),id.is.not.null,iPhone 16_Pro%");
  assert.ok(filterClause);

  const productBuilder = client
    .from("products")
    .select("id,name,name_ar")
    .eq("is_active", true)
    .or(filterClause)
    .limit(20);

  const productUrl = (productBuilder as unknown as { url: URL }).url;
  const orParam = productUrl.searchParams.get("or");
  assert.ok(orParam && orParam.startsWith("(") && orParam.endsWith(")"));
  assert.ok(orParam.includes('name.ilike."*id.is.not.null iPhone 16\\\\_Pro*"'));
  assert.ok(orParam.includes('name_ar.ilike."*id.is.not.null iPhone 16\\\\_Pro*"'));
  assert.ok(orParam.includes('short_description.ilike."*id.is.not.null iPhone 16\\\\_Pro*"'));
  assert.ok(
    orParam.includes('short_description_ar.ilike."*id.is.not.null iPhone 16\\\\_Pro*"')
  );
  assert.ok(orParam.includes('free_gift.ilike."*id.is.not.null iPhone 16\\\\_Pro*"'));
  assert.ok(orParam.includes('free_gift_ar.ilike."*id.is.not.null iPhone 16\\\\_Pro*"'));
  assert.equal(productUrl.searchParams.get("limit"), "20");

  // Also verify multi-underscore & percentage queries serialize both backslashes on wire & decoded
  const smFilter = buildProductSearchOrFilter("SM_S928B_DS");
  assert.ok(smFilter);
  const smBuilder = client.from("products").select("id").eq("is_active", true).or(smFilter);
  const smUrl = (smBuilder as unknown as { url: URL }).url;
  const smOrParam = smUrl.searchParams.get("or");
  assert.ok(smOrParam?.includes('name.ilike."*SM\\\\_S928B\\\\_DS*"'));
  assert.ok(smUrl.search.includes("SM%5C%5C_S928B%5C%5C_DS"));

  const dealFilter = buildProductSearchOrFilter("100% _deal_");
  assert.ok(dealFilter);
  const dealBuilder = client.from("products").select("id").eq("is_active", true).or(dealFilter);
  const dealOrParam = (dealBuilder as unknown as { url: URL }).url.searchParams.get("or");
  assert.ok(dealOrParam?.includes('name.ilike."*100 \\\\_deal\\\\_*"'));

  const nameOr = buildNameBilingualOrFilter("سامسونج");
  assert.ok(nameOr);
  const brandBuilder = client
    .from("brands")
    .select("id,name,name_ar,slug")
    .or(nameOr)
    .eq("is_active", true)
    .limit(4);

  const brandUrl = (brandBuilder as unknown as { url: URL }).url;
  assert.equal(
    brandUrl.searchParams.get("or"),
    '(name.ilike."*سامسونج*",name_ar.ilike."*سامسونج*")'
  );
  assert.equal(brandUrl.searchParams.get("limit"), "4");

  const bilingualUnderscoreNameOr = buildNameBilingualOrFilter("سامسونج_SM_S928B");
  assert.ok(bilingualUnderscoreNameOr);
  const catBuilder = client
    .from("categories")
    .select("id,name,name_ar,slug")
    .or(bilingualUnderscoreNameOr)
    .eq("is_active", true)
    .limit(4);
  const catUrl = (catBuilder as unknown as { url: URL }).url;
  assert.equal(
    catUrl.searchParams.get("or"),
    '(name.ilike."*سامسونج\\\\_SM\\\\_S928B*",name_ar.ilike."*سامسونج\\\\_SM\\\\_S928B*")'
  );
  assert.ok(catUrl.search.includes("%5C%5C_SM%5C%5C_S928B"));
});

test("Stage 1 Data & Search Projections: include all required bilingual & tracking fields", () => {
  const rootDir = path.resolve(import.meta.dirname, "..");
  const searchRouteSrc = fs.readFileSync(
    path.join(rootDir, "src/app/api/search/route.ts"),
    "utf8"
  );
  const dataSrc = fs.readFileSync(path.join(rootDir, "src/lib/data.ts"), "utf8");

  // /api/search/route.ts assertions
  for (const field of [
    "name_ar",
    "short_description_ar",
    "badge_text_ar",
    "free_gift_ar",
    "category:categories (id, name, name_ar, slug)",
    "brand:brands (id, name, name_ar, slug)",
    "product_images (id, image_url, alt_text, alt_text_ar, is_primary)",
  ]) {
    assert.ok(
      searchRouteSrc.includes(field),
      `/api/search/route.ts missing required field in SEARCH_PRODUCT_SELECT: ${field}`
    );
  }
  assert.ok(
    !searchRouteSrc.includes('.ilike("name"'),
    "/api/search/route.ts must not use raw English-only .ilike on categories/brands"
  );
  assert.ok(searchRouteSrc.includes("buildNameBilingualOrFilter"));
  assert.ok(searchRouteSrc.includes("buildProductSearchOrFilter"));

  // src/lib/data.ts assertions
  for (const field of [
    "name_ar",
    "short_description_ar",
    "description, description_ar",
    "badge_text_ar",
    "free_gift_ar",
    "warranty_ar",
    "specifications_ar",
    "is_arabic_reviewed, arabic_updated_at, translation_metadata",
    "brand:brands (id, name, name_ar, slug)",
    "category:categories (id, name, name_ar, slug)",
  ]) {
    assert.ok(dataSrc.includes(field), `src/lib/data.ts missing required projection: ${field}`);
  }
  assert.ok(
    dataSrc.includes('.select("id, name, name_ar, slug, logo_url, is_active")'),
    "getBrands() must select name_ar"
  );
});

// ============================================================================
// SUITE 3: Locale-Aware Formatters (Western Digits + Qatar Currency)
// ============================================================================

test("Formatters: formats prices, currency & numbers consistently with Western digits", () => {
  assert.equal(formatPrice(4299, "en"), "QAR 4,299");
  assert.equal(formatPrice(4299, "ar"), "4,299 ر.ق");
  assert.equal(formatPrice(4299), "QAR 4,299");
  assert.equal(formatPrice(null, "ar"), "0 ر.ق");
  assert.equal(formatPrice(undefined, "en"), "QAR 0");

  assert.equal(formatNumber(1250, "en"), "1,250");
  assert.equal(formatNumber(1250, "ar"), "1,250");

  const enCurr = formatCurrency(2499, "en");
  assert.ok(enCurr.includes("2,499") && enCurr.includes("QAR"));
  const arCurr = formatCurrency(2499, "ar");
  assert.ok(arCurr.includes("2,499") && arCurr.includes("ر.ق"));
});

