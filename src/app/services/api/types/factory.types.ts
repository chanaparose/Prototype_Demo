export interface IFactoryBaseResponse {
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
  /** Distinct lbi_categories.scope values from map_factory_categories ("PD", "MT") */
  category_scopes?: string[];
}

export interface IFactoryProfileResponse extends IFactoryBaseResponse {
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  established_year?: number;
  employees_count?: number;
  certifications?: string[];
}

export interface IFactoryWithDetailsResponse {
  factory: IFactoryProfileResponse;
  profile: Record<string, unknown>;
  reviews: unknown[];
  products: unknown[];
  promotions: unknown[];
  ideas: unknown[];
}

export interface IFactoryCategoriesRequest {
  category_ids: number[];
}

export interface IFactorySubCategoriesRequest {
  sub_category_ids: number[];
}

export interface IFactoryPublicDetailResponse {
  factory_id: number;
  factory_name: string;
  factory_type_id: number;
  factory_type_name?: string;
  tax_id?: string;
  specialization?: string;
  min_order?: number;
  lead_time_desc?: string;
  is_verified: boolean;
  rating?: number;
  review_count: number;
  completed_orders: number;
  image_url?: string;
  background_image_url?: string;
  description?: string;
  price_range?: string;
  province_id?: number;
  province_name?: string;
  categories: Array<{ category_id: number; name: string }>;
  sub_categories: Array<{
    sub_category_id: number;
    category_id: number;
    category_name: string;
    name: string;
    sub_category_name: string;
  }>;
  certificates: Array<{
    map_id: number;
    cert_id: number;
    cert_name: string;
    verify_status: string;
    document_url?: string;
    cert_number?: string;
    expire_date?: string;
  }>;
  reviews: unknown[];
}

export interface IFactoryDashboardResponse {
  total_rfqs: number;
  pending_quotes: number;
  active_orders: number;
  completed_orders: number;
  revenue_this_month: number;
  recent_inquiries: unknown[];
}

export interface IFactoryAnalyticsResponse {
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
