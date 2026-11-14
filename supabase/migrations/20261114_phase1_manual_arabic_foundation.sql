-- =====================================================================
-- CANONICAL MIGRATION: Phase 1 — Manual Arabic Catalog Foundation
-- File: 20261114_phase1_manual_arabic_foundation.sql
-- Status: CANONICAL (The single migration file to execute for Phase 1)
-- Target: PostgreSQL / Supabase
--
-- Description:
--   Adds manual Arabic localization fields and manual review tracking
--   columns to admin-managed catalog entities:
--     - products
--     - categories
--     - product_variants
--     - product_images
--     - banners
--     - brands
--
-- Safety Guarantees:
--   - 100% additive using "ADD COLUMN IF NOT EXISTS"
--   - All new columns are nullable or have non-breaking defaults
--   - Zero index locks: removed low-cardinality boolean indexes to avoid
--     table lock contention and unnecessary write overhead
--   - Idempotent: safe to run multiple times without failure
--   - Zero data loss: existing production data remains completely untouched
-- =====================================================================

-- 1. PRODUCTS TABLE
-- Add Arabic catalog content, specifications, and manual review metadata
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

-- 2. CATEGORIES TABLE
-- Add Arabic category title, description, and manual review metadata
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS name_ar TEXT,
    ADD COLUMN IF NOT EXISTS description_ar TEXT,
    ADD COLUMN IF NOT EXISTS is_arabic_reviewed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS arabic_updated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS translation_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. PRODUCT VARIANTS TABLE
-- Add Arabic variant name (e.g. Arabic color, memory specifications)
ALTER TABLE public.product_variants
    ADD COLUMN IF NOT EXISTS name_ar TEXT;

-- 4. PRODUCT IMAGES TABLE
-- Add Arabic accessible alt-text for screen readers and SEO
ALTER TABLE public.product_images
    ADD COLUMN IF NOT EXISTS alt_text_ar TEXT;

-- 5. BANNERS TABLE
-- Add Arabic headlines, highlight accents, descriptions, CTA buttons, and review tracking
ALTER TABLE public.banners
    ADD COLUMN IF NOT EXISTS title_ar TEXT,
    ADD COLUMN IF NOT EXISTS highlighted_text_ar TEXT,
    ADD COLUMN IF NOT EXISTS description_ar TEXT,
    ADD COLUMN IF NOT EXISTS primary_cta_text_ar TEXT,
    ADD COLUMN IF NOT EXISTS secondary_cta_text_ar TEXT,
    ADD COLUMN IF NOT EXISTS is_arabic_reviewed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS arabic_updated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS translation_metadata JSONB DEFAULT '{}'::jsonb;

-- 6. BRANDS TABLE
-- Optional Arabic brand name display while preserving official Latin trademarks
ALTER TABLE public.brands
    ADD COLUMN IF NOT EXISTS name_ar TEXT;

