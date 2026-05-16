/**
 * Chat & Messaging API Types
 */

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

export interface MessageDTO {
  msg_id: number;
  conv_id: number;
  sender_id: number;
  sender_role: 'CT' | 'FT';
  body: string;
  created_at: string;
  read_at?: string | null;
  attachments?: Array<{
    attachment_id: string;
    url: string;
    mime_type: string;
    size: number;
  }>;
}

export interface MessageSendPayload {
  body: string;
  rfq_id?: number;
  quote_id?: number;
  order_id?: number;
}

export interface ThreadResponse {
  thread_id: number;
  customer_id: number;
  factory_id: number;
  subject: string;
  messages: MessageDTO[];
  created_at: string;
}
