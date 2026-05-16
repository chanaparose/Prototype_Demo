/**
 * Factory API Types
 */

export interface FactoryBase {
  factory_id?: number;
  id?: string | number;
  factory_name: string;
  name?: string;
  image_url?: string;
  image?: string;
  logo_url?: string;
  location?: string;
  city?: string;
  province_name?: string;
  provinceName?: string;
  avg_rating?: number;
  rating?: number;
  review_count?: number;
  reviews?: number;
  specialization?: string;
  tags?: string[];
  min_order?: number;
  minOrder?: number;
  lead_time?: string;
  leadTime?: string;
  is_verified?: boolean;
  verified?: boolean;
  completed_orders?: number;
  completedOrders?: number;
  price_range?: string;
  priceRange?: string;
}

export interface FactoryProfile extends FactoryBase {
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  established_year?: number;
  employees_count?: number;
  certifications?: string[];
}

export interface FactoryWithDetails {
  factory: FactoryProfile;
  profile: Record<string, unknown>;
  reviews: unknown[];
  products: unknown[];
  promotions: unknown[];
  ideas: unknown[];
}

export interface FactoryCategoriesPayload {
  category_ids: number[];
}

export interface FactorySubCategoriesPayload {
  sub_category_ids: number[];
}

export interface FactoryDashboardResponse {
  total_rfqs: number;
  pending_quotes: number;
  active_orders: number;
  completed_orders: number;
  revenue_this_month: number;
  recent_inquiries: unknown[];
}

export interface FactoryAnalyticsResponse {
  total_revenue: number;
  total_orders: number;
  average_rating: number;
  total_reviews: number;
  orders_by_month: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
}
