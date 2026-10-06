-- =====================================================================
-- MOBILE DEALS - COMPLETE SEED DATA FOR SUPABASE SQL EDITOR
-- Run this AFTER running schema.sql in your Supabase Dashboard SQL Editor
-- =====================================================================

-- 1. SEED INITIAL 10 CATEGORIES
INSERT INTO public.categories (name, slug, description, image_url, icon_name, display_order, is_active)
VALUES
    ('Keyboard & Mouse', 'keyboard-mouse', 'Gaming keyboards, wireless mice and desktop accessories', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80', 'keyboard', 1, true),
    ('Mobile & Tablet Holder', 'mobile-tablet-holder', 'Desk stands, car mounts and ergonomic holders', 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=300&auto=format&fit=crop&q=80', 'smartphone', 2, true),
    ('Earphones & Buds', 'earphones-buds', 'TWS earbuds, noise cancelling headphones & earphones', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80', 'headphones', 3, true),
    ('Charger & Adapter', 'charger-adapter', 'Fast charging wall adapters, GaN chargers and cables', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80', 'zap', 4, true),
    ('Watch & Straps', 'watch-straps', 'Smartwatches, fitness bands and premium straps', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80', 'watch', 5, true),
    ('Perfume', 'perfume', 'Luxury Arabian and French fragrances for men and women', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80', 'sparkles', 6, true),
    ('Covers & Glasses', 'covers-glasses', 'Shockproof phone cases, screen protectors and lens guards', 'https://images.unsplash.com/photo-1601593346740-925612772716?w=300&auto=format&fit=crop&q=80', 'shield', 7, true),
    ('Power Bank', 'power-bank', 'High-capacity portable battery packs with fast charging', 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&auto=format&fit=crop&q=80', 'battery-charging', 8, true),
    ('Speaker', 'speaker', 'Bluetooth portable speakers and home audio soundbars', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80', 'volume-2', 9, true),
    ('Toys', 'toys', 'RC cars, drones and smart interactive toys', 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=300&auto=format&fit=crop&q=80', 'gamepad-2', 10, true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order;

-- 2. SEED BRANDS
INSERT INTO public.brands (name, slug, is_active)
VALUES
    ('Apple', 'apple', true),
    ('Samsung', 'samsung', true),
    ('Xiaomi', 'xiaomi', true),
    ('Anker', 'anker', true),
    ('Huawei', 'huawei', true)
ON CONFLICT (slug) DO NOTHING;

-- 3. SEED HERO BANNER
INSERT INTO public.banners (title, highlighted_text, description, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, desktop_image_url, position, display_order, is_active)
VALUES
    (
        'Latest Tech Best Deals in Qatar',
        'Best Deals',
        'Mobiles, accessories and more at the best prices. Cash on delivery. Fast & reliable doorstep shipping across Qatar.',
        'Shop Deals',
        '/#deals',
        'Order on WhatsApp',
        'https://wa.me/97455000000',
        'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=1200&auto=format&fit=crop&q=80',
        'hero',
        1,
        true
    )
ON CONFLICT DO NOTHING;

-- 4. SEED SAMPLE PRODUCTS
INSERT INTO public.products (name, slug, short_description, price, compare_at_price, stock, free_gift, badge_text, is_today_deal, is_best_deal, is_featured, is_best_seller, is_active)
VALUES
    ('Samsung Galaxy Z Fold 8 5G', 'samsung-galaxy-z-fold-8-5g', '12GB RAM / 256GB Storage - Qatar Official Warranty', 5649.00, 6199.00, 8, 'Samsung 65W GaN Super Charger', 'Free Gift', true, true, true, false, true),
    ('Samsung Galaxy S25 FE 5G', 'samsung-galaxy-s25-fe-5g', '8GB RAM / 256GB Storage - Fast Charging', 1829.00, 2199.00, 14, NULL, 'Best Seller', true, false, true, true, true),
    ('Redmi 17 5G Tech Bundle', 'redmi-17-5g-tech-bundle', '8GB RAM / 256GB Storage + TWS Earbuds Included', 769.00, 899.00, 18, NULL, 'With Buds', true, false, false, false, true)
ON CONFLICT (slug) DO UPDATE
SET price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    stock = EXCLUDED.stock;
