export type OrderStatus = 'PP' | 'PE' | 'PD' | 'PR' | 'QC' | 'SH' | 'CP' | 'CN';

export interface IRfqImageResponse {
  image_id: string;
  image_url: string;
}

export interface IRfqAddressNested {
  address_detail: string;
  sub_district_name: string;
  district_name: string;
  province_name: string;
  zip_code: string;
}

export interface IRfqNestedResponse {
  rfq_id: number;
  title: string;
  details: string;
  quantity: number;
  unit_name: string;
  budget_per_piece: number;
  category_id: number;
  category_name: string;
  sub_category_id?: number | null;
  sub_category_name?: string | null;
  shipping_method_name?: string | null;
  material_grade?: string | null;
  certifications_required?: string[];
  target_lead_time_days?: number | null;
  target_price?: number | null;
  address?: IRfqAddressNested | null;
  deadline_date?: string | null;
  created_at: string;
  images: IRfqImageResponse[];
}

export interface IQuoteNestedResponse {
  quote_id: number;
  price_per_piece: number;
  mold_cost: number;
  tooling_mold_cost: number;
  lead_time_days: number;
  grand_total: number;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  packaging_cost: number;
  vat_rate: number;
  vat_amount: number;
  validity_days: number;
  valid_until?: string | null;
  payment_terms?: string | null;
  image_urls?: string[];
  factory_highlight?: string | null;
}

export interface IOrderDetailResponse {
  order_id: number;
  quote_id: number;
  user_id: number;
  factory_id: number;
  total_amount: number;
  deposit_amount: number;
  status: OrderStatus;
  payment_type?: string | null;
  estimated_delivery?: string | null;
  created_at: string;
  updated_at: string;
  rfq?: IRfqNestedResponse | null;
  quotation?: IQuoteNestedResponse | null;
}

export interface IOrderCreateRequest {
  quote_id: number;
}

export interface IOrderUpdateRequest {
  status?: OrderStatus;
  estimated_delivery?: string;
}
