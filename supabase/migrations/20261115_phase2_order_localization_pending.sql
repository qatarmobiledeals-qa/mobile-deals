-- =====================================================================
-- PENDING MIGRATION: Phase 2 — Order History & Customer Locale Snapshots
-- File: 20261115_phase2_order_localization_pending.sql
-- Status: PENDING PHASE 2 — DO NOT EXECUTE IN PHASE 1
-- Target: PostgreSQL / Supabase
--
-- Description:
--   Adds customer locale tracking and Arabic product snapshot columns
--   for historical order fidelity, localized invoices, and WhatsApp
--   order notifications in Phase 2.
--
-- Safety:
--   - 100% additive using "ADD COLUMN IF NOT EXISTS"
--   - Non-breaking default ('en') on orders.customer_locale
--   - Nullable snapshot fields on order_items
-- =====================================================================

-- 1. ORDERS TABLE
-- Records whether customer placed the order in English ('en') or Arabic ('ar')
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS customer_locale VARCHAR(10) DEFAULT 'en';

-- 2. ORDER ITEMS TABLE
-- Point-in-time snapshot of Arabic product and variant names on invoices
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS product_name_ar TEXT,
    ADD COLUMN IF NOT EXISTS variant_name_ar TEXT;

