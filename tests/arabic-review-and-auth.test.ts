import test from "node:test";
import assert from "node:assert/strict";
import { signAdminPayload, verifyAdminToken } from "../src/lib/auth/admin-session.ts";
import { resolveProductArabicReviewState } from "../src/lib/product/arabic-review.ts";

// ============================================================================
// TEST SUITE 1: HMAC-SHA256 Admin Session Authentication & Anti-Tamper Security
// ============================================================================

test("Auth: generates valid signed tokens that verify successfully", () => {
  const adminPayload = { email: "admin@qatarmobiles.qa", role: "admin" };
  const token = signAdminPayload(adminPayload);
  assert.ok(token.includes("."), "Signed token must be formatted as data.signature");

  const verified = verifyAdminToken(token);
  assert.ok(verified, "Token verification must succeed for legitimate signature");
  assert.strictEqual(verified?.email, adminPayload.email);
  assert.strictEqual(verified?.role, "admin");
});

test("Auth: rejects forged, tampered, and unsigned raw JSON tokens", () => {
  // Attack 1: Unsigned raw JSON string
  const rawJson = JSON.stringify({ email: "attacker@evil.com", role: "admin" });
  assert.strictEqual(verifyAdminToken(rawJson), null, "Raw unsigned JSON must be rejected");

  // Attack 2: Tampered payload with original signature
  const legitimateToken = signAdminPayload({ email: "admin@qatarmobiles.qa", role: "admin" });
  const [dataPart, sigPart] = legitimateToken.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ email: "attacker@evil.com", role: "admin" })
  ).toString("base64url");
  const forgedToken = `${tamperedPayload}.${sigPart}`;
  assert.strictEqual(verifyAdminToken(forgedToken), null, "Tampered payload with mismatched signature must be rejected");

  // Attack 3: Altered signature
  const corruptedSigToken = `${dataPart}.invalidSignature1234567890`;
  assert.strictEqual(verifyAdminToken(corruptedSigToken), null, "Invalid signature must be rejected");
});

// ============================================================================
// TEST SUITE 2: Manual Translation Review Status Enforcement Rule
// ============================================================================

test("ReviewRule: product CANNOT be marked reviewed if any applicable field is missing Arabic", () => {
  // English name exists, but name_ar is empty
  const payloadWithMissingArabic = {
    name: "Apple iPhone 16 Pro Max",
    name_ar: "", // MISSING
    slug: "apple-iphone-16-pro-max",
    price: 4999,
    description: "The ultimate iPhone with titanium design.",
    description_ar: "أفضل هاتف آيفون بتصميم التيتانيوم.",
    is_arabic_reviewed: true, // Admin attempts to mark reviewed
  };

  const result = resolveProductArabicReviewState(payloadWithMissingArabic, null);

  assert.strictEqual(
    result.is_arabic_reviewed,
    false,
    "Product must NOT be marked reviewed while applicable English field lacks Arabic"
  );
  assert.strictEqual(result.translation_metadata.name?.reviewed, false);
});

test("ReviewRule: product is marked reviewed when all applicable fields have manual Arabic and reviewed is set", () => {
  const completePayload = {
    name: "Apple iPhone 16 Pro Max",
    name_ar: "أبل آيفون 16 برو ماكس",
    slug: "apple-iphone-16-pro-max",
    price: 4999,
    short_description: "Titanium design with A18 Pro chip",
    short_description_ar: "تصميم تيتانيوم مع شريحة A18 برو",
    description: "Detailed description here",
    description_ar: "الوصف التفصيلي هنا",
    specifications: { Screen: "6.9 inch OLED" },
    specifications_ar: { Screen: "شاشة أوليد 6.9 بوصة" },
    variants: [{ name: "256GB - Desert Titanium", name_ar: "256 جيجابايت - تيتانيوم صحراوي" }],
    is_arabic_reviewed: true,
  };

  const result = resolveProductArabicReviewState(completePayload, null);

  assert.strictEqual(result.is_arabic_reviewed, true, "Complete translation must be marked reviewed");
  assert.strictEqual(result.translation_metadata.name?.reviewed, true);
  assert.strictEqual(result.translation_metadata.specifications?.reviewed, true);
  assert.strictEqual(result.translation_metadata.variants?.reviewed, true);
});

test("ReviewRule: variants missing Arabic block review approval", () => {
  const payloadWithUntranslatedVariant = {
    name: "Apple iPhone 16 Pro Max",
    name_ar: "أبل آيفون 16 برو ماكس",
    slug: "apple-iphone-16-pro-max",
    price: 4999,
    variants: [
      { name: "256GB Black", name_ar: "256 جيجابايت أسود" },
      { name: "512GB Natural", name_ar: "" }, // MISSING Arabic
    ],
    is_arabic_reviewed: true,
  };

  const result = resolveProductArabicReviewState(payloadWithUntranslatedVariant, null);

  assert.strictEqual(result.is_arabic_reviewed, false, "Untranslated variant must prevent product review approval");
  assert.strictEqual(result.translation_metadata.variants?.reviewed, false);
});

test("ReviewRule: editing English field invalidates review status on that field and product", () => {
  const existingProduct = {
    name: "Apple iPhone 15 Pro",
    name_ar: "أبل آيفون 15 برو",
    is_arabic_reviewed: true,
    translation_metadata: {
      name: { source: "manual" as const, reviewed: true, updated_at: "2026-01-01T00:00:00Z" },
    },
  };

  // English name updated to iPhone 16 Pro, but Arabic was not yet updated
  const updatedPayload = {
    name: "Apple iPhone 16 Pro", // CHANGED English
    name_ar: "أبل آيفون 15 برو", // Old Arabic
    slug: "apple-iphone-16-pro",
    price: 4499,
    is_arabic_reviewed: true, // Admin checked reviewed
  };

  const result = resolveProductArabicReviewState(updatedPayload, existingProduct);

  assert.strictEqual(
    result.is_arabic_reviewed,
    false,
    "Editing English must invalidate Arabic review status"
  );
  assert.strictEqual(result.translation_metadata.name?.reviewed, false);
});
