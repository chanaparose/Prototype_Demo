import type { User } from '@/stores';

export type ChatReferenceType = 'RQ' | 'OD' | 'PD' | 'PM' | 'ID';

export type ChatReference = {
  type: ChatReferenceType;
  id: number;
  title?: string;
};

export type ApiMessage = {
  message_id: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type: 'TX' | 'QT' | 'IM' | 'rfq_card' | 'quotation_card' | 'system';
  reference_type: '' | ChatReferenceType;
  reference_id: number;
  created_at: string;
  quote_data?: string | null;
};

export type ApiConversation = {
  conv_id: number;
  customer_id: number;
  factory_id: number;
  factory_name?: string;
  factory_image?: string;
  customer_name?: string;
  customer_image?: string;
  rfq_id?: number | null;
  rfq_title?: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_customer: number;
  unread_factory: number;
  has_quote: boolean;
  created_at?: string;
  updated_at: string;
};

export type MessagesSendBody = {
  conv_id: number;
  receiver_id: number;
  content: string;
  message_type: 'TX' | 'QT' | 'IM' | 'rfq_card' | 'quotation_card' | 'system';
  reference_type?: ChatReferenceType;
  reference_id?: number;
  quote_data?: string;
  attachment_url?: string;
};

export function getCurrentUserId(user: User | null): number | null {
  if (!user) return null;
  const raw = (user as { user_id?: unknown }).user_id ?? user.id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function resolveReceiverId(conv: ApiConversation, currentUserId: number): number {
  return currentUserId === conv.customer_id ? conv.factory_id : conv.customer_id;
}

export function buildSendPayload(params: {
  conv: ApiConversation;
  currentUserId: number;
  content: string;
  reference?: ChatReference | null;
  messageType?: 'TX' | 'QT' | 'IM' | 'rfq_card' | 'quotation_card' | 'system';
  quoteData?: string;
}): MessagesSendBody {
  const { conv, currentUserId, content, reference, messageType = 'TX', quoteData } = params;
  return {
    conv_id: conv.conv_id,
    receiver_id: resolveReceiverId(conv, currentUserId),
    content,
    message_type: messageType,
    ...(reference && {
      reference_type: reference.type,
      reference_id: Number(reference.id),
    }),
    ...(quoteData ? { quote_data: quoteData } : {}),
  };
}

export function initialMessageForReference(ref: ChatReference): string {
  const t = ref.title?.trim() || 'รายการนี้';
  switch (ref.type) {
    case 'PD':
      return `สนใจสินค้า: ${t}`;
    case 'PM':
      return `สนใจโปรโมชัน: ${t}`;
    case 'ID':
      return `สนใจไอเดียนี้: ${t}`;
    case 'RQ':
      return `สอบถามเกี่ยวกับ RFQ: ${t}`;
    case 'OD':
      return `สอบถามเกี่ยวกับคำสั่งซื้อ: ${t}`;
    default:
      return `สอบถามเกี่ยวกับ "${t}"`;
  }
}

export function chatRoomPath(convId: string | number): string {
  return `/chat-room/${convId}`;
}

export function parseApiConversation(row: Record<string, unknown>): ApiConversation | null {
  const conv_id = Number(row.conv_id ?? row.conversation_id ?? row.id);
  if (!Number.isFinite(conv_id) || conv_id <= 0) return null;
  const customer_id = Number(row.customer_id ?? row.customerId ?? 0);
  const factory_id = Number(row.factory_id ?? row.factoryId ?? 0);
  const customerObj = (
    row.customer && typeof row.customer === 'object'
      ? (row.customer as Record<string, unknown>)
      : {}
  ) as Record<string, unknown>;
  const customerFirst = customerObj.first_name != null ? String(customerObj.first_name).trim() : '';
  const customerLast = customerObj.last_name != null ? String(customerObj.last_name).trim() : '';
  const customerFullName = [customerFirst, customerLast].filter(Boolean).join(' ').trim();
  const resolvedCustomerName =
    row.customer_name != null && String(row.customer_name).trim()
      ? String(row.customer_name)
      : customerObj.display_name != null && String(customerObj.display_name).trim()
        ? String(customerObj.display_name)
        : customerFullName || undefined;
  return {
    conv_id,
    customer_id: Number.isFinite(customer_id) ? customer_id : 0,
    factory_id: Number.isFinite(factory_id) ? factory_id : 0,
    factory_name: row.factory_name != null ? String(row.factory_name) : undefined,
    factory_image:
      row.factory_image != null
        ? String(row.factory_image)
        : row.factory_image_url != null
          ? String(row.factory_image_url)
          : row.factory_avatar != null
            ? String(row.factory_avatar)
            : undefined,
    customer_name: resolvedCustomerName,
    customer_image: row.customer_image != null ? String(row.customer_image) : undefined,
    rfq_id: row.rfq_id != null ? Number(row.rfq_id) : null,
    rfq_title:
      row.rfq_title != null
        ? String(row.rfq_title)
        : row.rfq_name != null
          ? String(row.rfq_name)
          : null,
    last_message:
      row.last_message != null
        ? String(row.last_message)
        : row.lastMessage != null
          ? String(row.lastMessage)
          : undefined,
    last_message_at:
      row.last_message_at != null
        ? String(row.last_message_at)
        : row.lastMessageAt != null
          ? String(row.lastMessageAt)
          : undefined,
    unread_customer: Number(row.unread_customer ?? row.unread_count ?? 0),
    unread_factory: Number(row.unread_factory ?? row.unread_factory_count ?? 0),
    has_quote: Boolean(row.has_quote ?? row.hasQuote),
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    updated_at: String(row.updated_at ?? row.time ?? row.created_at ?? ''),
  };
}

export function mergeConversationFromCreate(
  res: Record<string, unknown>,
  customer_id: number,
  factory_id: number,
): ApiConversation {
  const parsed = parseApiConversation(res);
  if (parsed) return parsed;
  const conv_id = Number(res.conv_id ?? res.conversation_id ?? res.id ?? 0);
  return {
    conv_id: Number.isFinite(conv_id) ? conv_id : 0,
    customer_id,
    factory_id,
    unread_customer: 0,
    unread_factory: 0,
    has_quote: false,
    updated_at: new Date().toISOString(),
  };
}
