/**
 * Order API Types
 */

export type OrderStatus = 'PP' | 'PE' | 'PD' | 'PR' | 'QC' | 'SH' | 'CP' | 'CN';

export interface RfqImageDTO {
  image_id: string;
  image_url: string;
}

export interface RfqNestedDTO {
  rfq_id: number;
  title: string;
  details: string;
  quantity: number;
  unit_name: string;
  budget_per_piece: number;
  category_id: number;
  category_name: string;
  deadline_date?: string | null;
  created_at: string;
  images: RfqImageDTO[];
}

export interface QuoteNestedDTO {
  quote_id: number;
  price_per_piece: number;
  mold_cost: number;
  lead_time_days: number;
}

export interface OrderDetailDTO {
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
  rfq?: RfqNestedDTO | null;
  quotation?: QuoteNestedDTO | null;
}

export interface OrderCreatePayload {
  quote_id: number;
}

export interface OrderUpdatePayload {
  status?: OrderStatus;
  estimated_delivery?: string;
}
