export type ExploreContentType = 'product' | 'promotion' | 'idea' | 'material' | 'factory';

/** Response shape จาก GET /api/v1/showcases?types=...&limit=... */
export interface IExploreShowcaseResponse {
  showcase_id: number;
  factory_id: number;
  content_type: 'PD' | 'PM' | 'ID' | 'MT';
  title: string;
  image_url: string;
  category_id: number;
  category_name: string;
  sub_category_id: number | null;
  sub_category_name: string | null;
  moq: number;
  likes_count: number;
  published_at: string;
  factory_name: string;
  factory_image_url: string;
  factory_rating: number;
  factory_verified: boolean;
  start_date?: string;
  end_date?: string;
}

/** Grouped response: { PD: [...], MT: [...] } */
export type IShowcasesGroupedResponse = Partial<
  Record<'PD' | 'PM' | 'ID' | 'MT', IExploreShowcaseResponse[]>
>;

/** Response shape จาก GET /api/v1/categories?limit=N */
export interface IExploreCategoryResponse {
  category_id: number;
  id?: number;
  categoryId?: number;
  lbi_category_id?: number;
  product_category_id?: number;
  lbi_product_category_id?: number;
  name: string;
  name_th?: string;
  name_en?: string;
  category_name?: string;
  title?: string;
  label?: string;
  scope?: 'PD' | 'MT' | 'ALL';
  parent_id?: number | string | null;
  parentId?: number | string | null;
  display_order?: number;
  sort_order?: number;
}

export interface IExploreSubCategoryResponse {
  sub_category_id: number;
  id?: number;
  category_id: number;
  name: string;
  sub_category_name?: string;
  display_order?: number;
  sort_order?: number;
}

export interface IExploreResponse {
  products: IExploreShowcaseResponse[];
  promotions: IExploreShowcaseResponse[];
  promo_codes: unknown[];
  factories: unknown[];
  idea_articles: IExploreShowcaseResponse[];
  categories: IExploreCategoryResponse[];
}

/** Response shape จาก GET /api/v1/promo-slides?limit=N — direct array */
export interface IPromoSlideResponse {
  slide_id: number | string;
  title: string;
  image_url: string;
  link_to: string;
}

/** Response shape จาก GET /api/v1/explore — single call ที่รวม categories + showcases + promoSlides */
export interface IExploreApiResponse {
  categories: IExploreCategoryResponse[];
  showcases: IShowcasesGroupedResponse;
  promoSlides: IPromoSlideResponse[];
}

/** Response shape จาก GET /api/v1/categories?include_sub=true */
export interface ICategoryWithSubsResponse {
  category_id: number;
  name: string;
  scope?: string;
  sub_categories: IExploreSubCategoryResponse[];
}

/** Response shape จาก GET /api/v1/showcases?types=...&page=N&limit=N (paginated flat list) */
export interface IShowcasePaginatedResponse {
  total: number;
  page: number;
  limit: number;
  items: IExploreShowcaseResponse[];
}

/** /me/session types */
export interface ISessionOffer {
  quote_id: number;
  factory_id: number;
  factory_name: string;
  factory_image_url?: string;
  factory_verified: boolean;
  price_per_piece?: number;
  grand_total?: number;
  lead_time_days?: number;
  status: string;
}

export interface ISessionRFQ {
  rfq_id: number;
  title: string;
  status: string;
  quantity?: number;
  target_price?: number;
  category_name: string;
  created_at: string;
  offer_count: number;
  offers: ISessionOffer[];
}

export interface ISessionOrder {
  order_id: number;
  rfq_id?: number;
  title: string;
  factory_id: number;
  factory_name: string;
  factory_image_url?: string;
  status: string;
  total_amount?: number;
  deposit_amount?: number;
  estimated_delivery?: string;
  created_at: string;
  /**
   * ขั้นที่กำลัง active 0–5 (เช่น step 4 = CD + step 5 = IP → ส่ง 4)
   */
  current_step_id?: number | null;
}

export interface ISessionThread {
  conv_id: number;
  counterpart_id: number;
  counterpart_name: string;
  counterpart_image_url?: string;
  last_message: string;
  last_message_at: string;
  unread: number;
}

export interface ISessionResponse {
  currentUser: {
    id: number;
    role: string;
    name: string;
    email: string;
    phone: string;
    member_since: string;
  };
  wallet: {
    balance: number;
    pending_balance: number;
  };
  rfqs: ISessionRFQ[];
  orders: ISessionOrder[];
  threads: ISessionThread[];
  favorites: number[];
}
