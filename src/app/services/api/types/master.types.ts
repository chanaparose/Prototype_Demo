/**
 * Master Data API Types (Categories, Units, etc)
 */

export interface CategoryDTO {
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

export interface SubCategoryDTO {
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

export interface UnitDTO {
  id?: number;
  unit_id?: number;
  name: string;
  unit_name?: string;
  abbreviation?: string;
}

export interface CertificationDTO {
  id?: number;
  certification_id?: number;
  name: string;
  code?: string;
  description?: string;
}

export interface ShippingMethodDTO {
  id?: number;
  shipping_method_id?: number;
  name: string;
  description?: string;
}

export interface FactoryTypeDTO {
  id?: number;
  factory_type_id?: number;
  name: string;
  description?: string;
}

export interface MaterialDTO {
  id?: number;
  material_id?: number;
  name: string;
  description?: string;
  category_id?: number;
}

export interface MasterDataResponse {
  categories?: CategoryDTO[];
  units?: UnitDTO[];
  certifications?: CertificationDTO[];
  shipping_methods?: ShippingMethodDTO[];
  factory_types?: FactoryTypeDTO[];
  materials?: MaterialDTO[];
}
