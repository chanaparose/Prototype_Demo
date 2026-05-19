export type RfqStatus = 'OP' | 'CL' | 'CC';
export type QuotationStatus = 'PD' | 'AC' | 'RJ';
export type QuotationEventType = 'CR' | 'UP' | 'ST';

export interface IRfqListItem {
  rfq_id: number;
  user_id: number;
  category_id: number;
  sub_category_id?: number;
  title: string;
  quantity: number;
  details?: string;
  description?: string;
  address_id: number;
  delivery_address_id?: number;
  shipping_method_id?: number;
  status: RfqStatus;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  image_urls?: string[];
  reference_images?: string[];
  material_grade?: string;
  target_price?: number;
  target_lead_time_days?: number;
  required_delivery_date?: string;
  certifications_required?: string[];
}

export interface IRfqDetailResponse {
  rfq: IRfqListItem;
}

export interface IRfqCreateRequest {
  category_id: number;
  sub_category_id?: number;
  title: string;
  quantity: number;
  details?: string;
  address_id: number;
  target_price?: number;
  target_lead_time_days?: number;
  required_delivery_date?: string;
  certifications_required?: string[];
}

export interface IQuotationResponse {
  quote_id: number;
  rfq_id: number;
  factory_id: number;
  price_per_piece: number;
  mold_cost: number;
  lead_time_days: number;
  shipping_method_id: number;
  status: QuotationStatus;
  create_time: string;
  log_timestamp: string;
  version: number;
  is_locked: boolean;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  packaging_cost: number;
  tooling_mold_cost: number;
  vat_rate: number;
  vat_amount: number;
  platform_commission_rate: number;
  platform_commission_amount: number;
  grand_total: number;
  factory_net_receivable: number;
  validity_days: number;
  valid_until?: string | null;
  revision_no: number;
  image_urls?: string[];
  payment_terms?: string | null;
}

export type IQuotationHistoryEntry = {
  history_id: number;
  quote_id: number;
  event_type: QuotationEventType;
  version_after: number;
  price_per_piece: number | null;
  mold_cost: number | null;
  lead_time_days: number | null;
  shipping_method_id: number | null;
  status: string | null;
  reason: string | null;
  edited_by: number | null;
  created_at: string;
};

export interface IQuotationLineItem {
  item_no?: number;
  description: string;
  qty: number;
  unit?: string;
  unit_price: number;
  discount_pct?: number;
}

export interface IQuotationCreateRequest {
  rfq_id: number;
  items: IQuotationLineItem[];
  discount_amount?: number;
  shipping_cost?: number;
  packaging_cost?: number;
  tooling_mold_cost?: number;
  validity_days?: number;
}

export interface IQuotationBreakdown {
  subtotal: number;
  shipping_cost: number;
  packaging_cost: number;
  tooling_mold_cost: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  factory_net_receivable: number;
  platform_commission_rate: number;
  platform_commission_amount: number;
}

export interface IRfqWizardCreateInput {
  title: string;
  description?: string;
  category_id: number | string;
  sub_category_id?: number | string;
  qty: number;
  target_price?: number;
  target_lead_time_days?: number;
  material_grade?: string;
  reference_images?: string[];
  address_id?: number;
  delivery_address_id?: number;
  shipping_method_id?: number;
  certifications_required?: string[];
  request_kind?: string;
  source_showcase_id?: number;
}
