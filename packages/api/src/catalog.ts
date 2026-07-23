/**
 * @repo/api — Catalog API client types
 *
 * This file contains ONLY types. API functions are defined in the apps.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MediaBrief {
  id: string;
  cdn_url: string;
  width: number | null;
  height: number | null;
  processing_status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  original_filename: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  sort_order: number;
  is_active: boolean;
  children_count: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  attribute_name_1: string;
  attribute_value_1: string;
  attribute_name_2: string;
  attribute_value_2: string;
  price_override: string | null;
  weight_override_grams: number | null;
  stock_quantity: number;
  is_active: boolean;
  effective_price: string;
  image: MediaBrief | null;
  created_at: string;
}

export interface ProductMedia {
  id: string;
  media: MediaBrief;
  sort_order: number;
  is_thumbnail: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "OUT_OF_STOCK" | "ARCHIVED";
  base_price: string;
  compare_at_price: string | null;
  tax_rate: string;
  total_stock: number;
  thumbnail: string | null;
  category_name: string | null;
  is_digital: boolean;
  vector_status?: "PENDING" | "CREATED" | "SKIPPED" | "FAILED";
  sort_order: number;
  created_at: string;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  publish_at: string | null;
  weight_grams: number | null;
  length_cm: string | null;
  width_cm: string | null;
  height_cm: string | null;
  specifications: Record<string, unknown>;
  seo_title: string;
  seo_description: string;
  category: Category | null;
  variants: ProductVariant[];
  product_media: ProductMedia[];
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  num_pages: number;
  results: T[];
}

export interface ShopTrackingConfig {
  id: string;
  fb_pixel_id: string;
  ga4_measurement_id: string;
  gtm_id: string;
  updated_at: string;
}

export interface StorefrontShop {
  id: string;
  name: string;
  subdomain: string;
  base_currency: string;
}

export interface PresignedUploadResponse {
  upload_url: string;
  s3_key: string;
  cdn_url: string;
}

export interface MediaRecord {
  id: string;
  original_filename: string;
  cdn_url: string;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string;
  processing_status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  created_at: string;
}
