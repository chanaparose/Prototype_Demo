export interface ICustomerPartyInfoResponse {
  user_id: number;
  first_name: string;
  last_name: string;
  display_name: string;
}

export interface IFactoryPartyInfoResponse {
  user_id: number;
  factory_name: string;
  image_url: string;
  is_verified: boolean;
  specialization: string;
}

export interface IConversationResponse {
  conv_id: number;
  customer_id: number;
  factory_id: number;
  last_message: string;
  unread_customer: number;
  unread_factory: number;
  has_quote: boolean;
  updated_at: string;
  customer: ICustomerPartyInfoResponse;
  factory: IFactoryPartyInfoResponse;
  viewer_role?: 'CT' | 'FT';
  counterparty_user_id?: number;
}

export interface IMessageResponse {
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

export interface IMessageSendRequest {
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
  messages: IMessageResponse[];
  created_at: string;
}

export type CustomerPartyInfoDTO = ICustomerPartyInfoResponse;
export type FactoryPartyInfoDTO = IFactoryPartyInfoResponse;
export type ConversationDTO = IConversationResponse;
export type MessageDTO = IMessageResponse;
export type MessageSendPayload = IMessageSendRequest;
