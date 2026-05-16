/**
 * RFQ API Types
 */

export type RfqStatus = 'OP' | 'CL' | 'CC';
export type QuotationStatus = 'PD' | 'AC' | 'RJ';
export type QuotationEventType = 'CR' | 'UP' | 'ST';

export interface RfqListItem {
  rfq_id: number;
  user_id: number;
  category_id: number;
  sub_category_id?: number;
  title: string;
  quantity: number;
  details?: string;
  description?: string;
  unit?: string;
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
  sample_required?: boolean;
  sample_qty?: number;
  inspection_type?: 'self' | 'third_party' | 'buyer_onsite';
}

export interface RfqDetailResponse {
  rfq: RfqListItem;
}

export interface RfqCreatePayload {
  category_id: number;
  sub_category_id?: number;
  title: string;
  quantity: number;
  details?: string;
  unit?: string;
  address_id: number;
  target_price?: number;
  target_lead_time_days?: number;
  required_delivery_date?: string;
  certifications_required?: string[];
  sample_required?: boolean;
  sample_qty?: number;
  inspection_type?: 'self' | 'third_party' | 'buyer_onsite';
}

export interface QuotationRow {
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

export type QuotationHistoryEntry = {
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
