export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  compare_at_price: number | null;
  stock: number;
  attributes: Record<string, string>;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  cloudinary_public_id: string | null;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  warranty: string | null;
  free_gift: string | null;
  badge_text: string | null;
  is_featured: boolean;
  is_best_deal: boolean;
  is_today_deal: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  deal_ends_at: string | null;
  specifications: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  brand?: Brand | null;
  category?: Category | null;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
}

export interface Banner {
  id: string;
  title: string | null;
  highlighted_text: string | null;
  description: string | null;
  primary_cta_text: string | null;
  primary_cta_link: string | null;
  secondary_cta_text: string | null;
  secondary_cta_link: string | null;
  desktop_image_url: string;
  mobile_image_url: string | null;
  cloudinary_public_id: string | null;
  position: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string | null;
  product_name: string;
  variant_name: string | null;
  price: number;
  quantity: number;
  total_price: number;
  product_image_url?: string | null;
  created_at?: string;
}

export interface Order {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  area: string;
  zone: string | null;
  street: string | null;
  building: string | null;
  delivery_notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_method: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface SiteSettings {
  store_name: string;
  whatsapp_number: string;
  support_phone: string;
  store_email: string;
  currency: string;
  shipping_charge?: number;
  free_delivery_threshold?: number;
  announcement_bar?: {
    enabled: boolean;
    items: string[];
  };
  trust_badges?: {
    items: Array<{
      title: string;
      subtitle?: string;
      icon: string;
    }>;
  };
}

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string | null;
  variantName?: string | null;
  price: number;
  quantity: number;
  imageUrl: string;
}

export type ServiceEnquiryStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface ServiceEnquiry {
  id: string;
  reference_no: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  preferred_contact: string;
  service_type: string;
  product_name: string;
  product_model?: string | null;
  issue_description: string;
  additional_details?: string | null;
  status: ServiceEnquiryStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

