export interface ICategoryResponse {
  id?: number;
  category_id?: number;
  name: string;
  category_name?: string;
  image_url?: string;
  image?: string;
  display_order?: number;
  sort_order?: number;
  sub_categories_count?: number;
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

export interface IFactoryTypeResponse {
  id?: number;
  factory_type_id?: number;
  name: string;
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
  factory_types?: IFactoryTypeResponse[];
  materials?: IMaterialResponse[];
}
