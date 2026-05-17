export type {
  IRfqImageResponse,
  IRfqNestedResponse,
  IQuoteNestedResponse,
  IOrderDetailResponse,
  OrderStatus,
} from '@/services/api/types/order.types';

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
