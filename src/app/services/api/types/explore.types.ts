export type ExploreContentType = 'product' | 'promotion' | 'idea' | 'material' | 'factory';

export interface IExploreShowcaseResponse {
  id: string;
  factory_id: string;
  factory_name: string;
  title: string;
  description?: string;
  excerpt?: string;
  image?: string;
  image_url?: string;
  images?: string[];
  content_type: ExploreContentType;
  category?: string;
  category_id?: number;
  sub_category?: string;
  sub_category_id?: number;
  sub_category_name?: string;
  posted_at?: string;
  created_at?: string;
  likes?: number;
  min_order?: number;
  lead_time?: string;
  tags?: string[];
}

export interface IExploreCategoryResponse {
  category_id: number;
  id?: number;
  name: string;
  category_name?: string;
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

export interface IPromoSlideResponse {
  slide_id: string;
  id?: string;
  title: string;
  image_url: string;
  image?: string;
  link?: string;
  order?: number;
  display_order?: number;
}

export interface IPromoSlidesResponse {
  slides: IPromoSlideResponse[];
}
