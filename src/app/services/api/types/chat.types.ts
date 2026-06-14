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
  /** When API returns a single viewer-scoped unread without splitting by party */
  viewer_unread?: number;
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
  content?: string;
  message_type?: string;
  reference_type?: string;
  reference_id?: number;
  reference_title?: string;
  created_at: string;
  read_at?: string | null;
  attachments?: Array<{
    attachment_id: string;
    url: string;
    mime_type: string;
    size: number;
  }>;
}

/** POST /conversations/:id/messages — matches backend CreateMessageRequest */
export interface IMessageSendRequest {
  content: string;
  receiver_id: number;
  conv_id?: number;
  message_type?: string;
  reference_type?: string;
  reference_id?: number;
  quote_data?: string;
  attachment_url?: string;
}

export interface IThreadResponse {
  thread_id: number;
  customer_id: number;
  factory_id: number;
  subject: string;
  messages: IMessageResponse[];
  created_at: string;
}
