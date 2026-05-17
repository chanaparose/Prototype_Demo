import type { IUser } from '@/domain/auth/types/user.model';
import { mapConversationFromApi } from '@/domain/chat/mappers/mapConversation';
import { mapConversationToApiConversation } from '@/domain/chat/mappers/mapConversationStore';
import type { IMessageSendRequest } from '@/services/api/types/chat.types';
import { pickScalarString } from '@/utils/pickScalarString';

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

export type IChatMessageSendRequest = IMessageSendRequest;

export function getCurrentUserId(user: IUser | null): number | null {
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
}): IMessageSendRequest {
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

export function chatRoomPath(convId: string | number): string {
  return `/chat-room/${convId}`;
}

export function parseApiConversation(row: Record<string, unknown>): ApiConversation | null {
  const mapped = mapConversationFromApi(row);
  if (!mapped) return null;
  const api = mapConversationToApiConversation(mapped);
  const rfqId = row.rfq_id != null ? Number(row.rfq_id) : null;
  const rfqTitle = pickScalarString(row.rfq_title, row.rfq_name);
  return {
    ...api,
    rfq_id: rfqId != null && Number.isFinite(rfqId) ? rfqId : null,
    rfq_title: rfqTitle || null,
    customer_image: pickScalarString(row.customer_image) || undefined,
    last_message_at: pickScalarString(row.last_message_at, row.lastMessageAt, api.last_message_at),
    created_at: pickScalarString(row.created_at) || undefined,
    updated_at: pickScalarString(row.updated_at, row.time, row.created_at, api.updated_at),
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
