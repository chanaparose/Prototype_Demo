export interface ICategoryResponse {
  id?: number;
  category_id?: number;
  name: string;
  scope?: string;
  hub_id?: number;
  category_name?: string;
  image_url?: string;
  image?: string;
  display_order?: number;
  sort_order?: number;
  sub_categories_count?: number;
}

export interface ICategoryForHubResponse {
  category_id: number;
  name: string;
  factory_count: number;
  sub_preview: string[];
  img?: string;
  image_url?: string;
  image?: string;
}

export interface IHubResponse {
  hub_id: number;
  name: string;
  scope: string;
  /** Hub cover image URL (admin upload via PATCH /admin/hubs/:id/img). */
  img?: string | null;
  image_url?: string | null;
  image?: string | null;
  categories: ICategoryForHubResponse[];
}

/** Showcase preview item from GET /hubs/showcases */
export interface IHubShowcaseItem {
  showcase_id: number;
  factory_id: number;
  content_type: string;
  title: string;
  factory_name: string;
  province_name?: string;
  factory_rating?: number;
  factory_verified?: boolean;
  factory_image_url?: string;
  base_price?: number | null;
  promo_price?: number | null;
  linked_showcases?: string[];
  likes_count?: number;
  moq?: number;
  unit_name_th?: string;
}

/** Hub + top showcases from GET /hubs/showcases */
export interface IHubWithShowcases {
  hub_id: number;
  hub_name: string;
  hub_img?: string | null;
  showcases: IHubShowcaseItem[];
}

export interface IHubShowcasesResponse {
  hubs: IHubWithShowcases[];
}

export interface ISubCategoryResponse {
  id?: number;
  sub_category_id?: number;
  category_id: number;
  name: string;
  sub_category_name?: string;
  image_url?: string;
  image?: string;
  display_order?: number;
  sort_order?: number;
}

export interface IUnitResponse {
  id?: number;
  unit_id?: number;
  code?: string;
  name?: string;
  name_th?: string;
  name_en?: string;
  unit_name?: string;
  unit_name_th?: string;
  abbreviation?: string;
  /** กลุ่มหน่วยจาก lbi_units.group_th */
  group_th?: string;
  /** กลุ่มหน่วยจาก lbi_units.group_en */
  group_en?: string;
  sort_order?: number;
}

export interface ICertificationResponse {
  id?: number;
  certification_id?: number;
  name: string;
  code?: string;
  description?: string;
}

export interface IShippingMethodResponse {
  id?: number;
  shipping_method_id?: number;
  name: string;
  method_name?: string;
  name_th?: string;
  description?: string;
}

export interface IMaterialResponse {
  id?: number;
  material_id?: number;
  name: string;
  description?: string;
  category_id?: number;
}

export interface IMasterDataResponse {
  categories?: ICategoryResponse[];
  units?: IUnitResponse[];
  certifications?: ICertificationResponse[];
  shipping_methods?: IShippingMethodResponse[];
  materials?: IMaterialResponse[];
}
