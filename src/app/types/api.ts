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
  status: 'PP' | 'PE' | 'PD' | 'PR' | 'QC' | 'SH' | 'CP' | 'CN';
  payment_type?: string | null;
  estimated_delivery?: string | null;
  created_at: string;
  updated_at: string;
  rfq?: RfqNestedDTO | null;
  quotation?: QuoteNestedDTO | null;
}

export interface CustomerPartyInfoDTO {
  user_id: number;
  first_name: string;
  last_name: string;
  display_name: string;
}

export interface FactoryPartyInfoDTO {
  user_id: number;
  factory_name: string;
  image_url: string;
  is_verified: boolean;
  specialization: string;
}

export interface ConversationDTO {
  conv_id: number;
  customer_id: number;
  factory_id: number;
  last_message: string;
  unread_customer: number;
  unread_factory: number;
  has_quote: boolean;
  updated_at: string;
  customer: CustomerPartyInfoDTO;
  factory: FactoryPartyInfoDTO;
  viewer_role?: 'CT' | 'FT';
  counterparty_user_id?: number;
}
