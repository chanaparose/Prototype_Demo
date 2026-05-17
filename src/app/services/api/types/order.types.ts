export type OrderStatus = 'PP' | 'PE' | 'PD' | 'PR' | 'QC' | 'SH' | 'CP' | 'CN';

export interface IRfqImageResponse {
  image_id: string;
  image_url: string;
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
  deadline_date?: string | null;
  created_at: string;
  images: IRfqImageResponse[];
}

export interface IQuoteNestedResponse {
  quote_id: number;
  price_per_piece: number;
  mold_cost: number;
  lead_time_days: number;
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
