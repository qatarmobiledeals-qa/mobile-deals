-- =====================================================================
-- MIGRATION: Arabic Localization Foundation (Phase 1)
-- Description: Additive schema migration adding nullable Arabic text
--              and JSONB columns, plus translation review tracking.
-- Target: PostgreSQL / Supabase
-- Safety: 100% additive, non-destructive, safe for production with existing data.
-- =====================================================================

-- 1. PRODUCTS TABLE
-- Add Arabic content fields, specifications, and review tracking
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS name_ar TEXT,
    ADD COLUMN IF NOT EXISTS short_description_ar TEXT,
    ADD COLUMN IF NOT EXISTS description_ar TEXT,
    ADD COLUMN IF NOT EXISTS badge_text_ar TEXT,
    ADD COLUMN IF NOT EXISTS free_gift_ar TEXT,
    ADD COLUMN IF NOT EXISTS warranty_ar TEXT,
    ADD COLUMN IF NOT EXISTS specifications_ar JSONB,
    ADD COLUMN IF NOT EXISTS is_arabic_reviewed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS arabic_updated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS translation_metadata JSONB DEFAULT '{}'::jsonb;

-- Fast lookup index for admin filtering by Arabic review status
CREATE INDEX IF NOT EXISTS idx_products_arabic_reviewed ON public.products(is_arabic_reviewed);

-- 2. CATEGORIES TABLE
-- Add Arabic name and description
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS name_ar TEXT,
    ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- 3. PRODUCT VARIANTS TABLE
-- Add Arabic variant name (e.g., color, storage in Arabic)
ALTER TABLE public.product_variants
    ADD COLUMN IF NOT EXISTS name_ar TEXT;

-- 4. BANNERS TABLE
-- Add Arabic promotional copy and CTA text
ALTER TABLE public.banners
    ADD COLUMN IF NOT EXISTS title_ar TEXT,
    ADD COLUMN IF NOT EXISTS highlighted_text_ar TEXT,
    ADD COLUMN IF NOT EXISTS description_ar TEXT,
    ADD COLUMN IF NOT EXISTS primary_cta_text_ar TEXT,
    ADD COLUMN IF NOT EXISTS secondary_cta_text_ar TEXT;

-- 5. PRODUCT IMAGES TABLE
-- Add Arabic accessible alt-text
ALTER TABLE public.product_images
    ADD COLUMN IF NOT EXISTS alt_text_ar TEXT;

