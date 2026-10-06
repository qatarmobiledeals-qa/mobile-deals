-- =====================================================================
-- MOBILE DEALS - E-COMMERCE DATABASE SCHEMA & RLS POLICIES
-- Target: PostgreSQL / Supabase
-- =====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    icon_name TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.categories(is_active, display_order);

-- 3. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(slug);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    short_description TEXT,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    stock INT DEFAULT 10,
    warranty TEXT,
    free_gift TEXT,
    badge_text TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_best_deal BOOLEAN DEFAULT false,
    is_today_deal BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    deal_ends_at TIMESTAMPTZ,
    specifications JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 5. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    price NUMERIC(10, 2),
    compare_at_price NUMERIC(10, 2),
    stock INT DEFAULT 5,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);

-- 6. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    cloudinary_public_id TEXT,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, display_order);

-- 7. BANNERS (Hero & Promotional)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    highlighted_text TEXT,
    description TEXT,
    primary_cta_text TEXT,
    primary_cta_link TEXT,
    secondary_cta_text TEXT,
    secondary_cta_link TEXT,
    desktop_image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    cloudinary_public_id TEXT,
    position TEXT DEFAULT 'hero',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ORDERS (Cash on Delivery Qatar)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_reference TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    area TEXT NOT NULL,
    zone TEXT,
    street TEXT,
    building TEXT,
    delivery_notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'COD',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- 9. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL,
    product_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 10. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- PERMISSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- Allows all operations so mutations work with both service_role & anon keys
-- =====================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for categories
DROP POLICY IF EXISTS "Allow all categories" ON public.categories;
CREATE POLICY "Allow all categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for brands
DROP POLICY IF EXISTS "Allow all brands" ON public.brands;
CREATE POLICY "Allow all brands" ON public.brands FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for products
DROP POLICY IF EXISTS "Allow all products" ON public.products;
CREATE POLICY "Allow all products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for product variants
DROP POLICY IF EXISTS "Allow all variants" ON public.product_variants;
CREATE POLICY "Allow all variants" ON public.product_variants FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for product images
DROP POLICY IF EXISTS "Allow all product_images" ON public.product_images;
CREATE POLICY "Allow all product_images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for banners
DROP POLICY IF EXISTS "Allow all banners" ON public.banners;
CREATE POLICY "Allow all banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for orders
DROP POLICY IF EXISTS "Allow all orders" ON public.orders;
CREATE POLICY "Allow all orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for order items
DROP POLICY IF EXISTS "Allow all order_items" ON public.order_items;
CREATE POLICY "Allow all order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations for site settings
DROP POLICY IF EXISTS "Allow all settings" ON public.site_settings;
CREATE POLICY "Allow all settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- 11. SERVICE ENQUIRIES (Support & Repair Requests)
CREATE TABLE IF NOT EXISTS public.service_enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_no TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    preferred_contact TEXT DEFAULT 'WhatsApp',
    service_type TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_model TEXT,
    issue_description TEXT NOT NULL,
    additional_details TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_enquiries_ref ON public.service_enquiries(reference_no);
CREATE INDEX IF NOT EXISTS idx_service_enquiries_status ON public.service_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_service_enquiries_created ON public.service_enquiries(created_at DESC);

ALTER TABLE public.service_enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all service_enquiries" ON public.service_enquiries;
CREATE POLICY "Allow all service_enquiries" ON public.service_enquiries FOR ALL USING (true) WITH CHECK (true);

