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
export type IShowcasesGroupedResponse = Partial<Record<'PD' | 'PM' | 'ID' | 'MT', IExploreShowcaseResponse[]>>;

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
