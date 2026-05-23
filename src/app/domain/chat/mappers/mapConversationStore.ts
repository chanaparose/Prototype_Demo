import type { IConversationResponse } from '@/services/api/types/chat.types';
import type { Conversation } from '@/stores/types';
import type { ApiConversation } from '@/utils/chatContract';
import { pickScalarString } from '@/utils/pickScalarString';

export function mapConversationToStoreModel(
  conv: IConversationResponse,
  viewerRole?: 'CT' | 'FT',
): Conversation {
  const unread =
    viewerRole === 'FT'
      ? conv.unread_factory
      : viewerRole === 'CT'
        ? conv.unread_customer
        : Math.max(conv.unread_customer, conv.unread_factory);

  return {
    id: String(conv.conv_id),
    factoryId: String(conv.factory_id),
    rfqId: '',
    factoryName: conv.factory.factory_name,
    factoryAvatar: conv.factory.image_url,
    rfqName: '',
    lastMessage: conv.last_message,
    time: conv.updated_at,
    unread,
    hasQuote: conv.has_quote,
    messages: [],
  };
}

export function mapConversationToApiConversation(conv: IConversationResponse): ApiConversation {
  const customerFirst = pickScalarString(conv.customer.first_name);
  const customerLast = pickScalarString(conv.customer.last_name);
  const customerFullName = [customerFirst, customerLast].filter(Boolean).join(' ').trim();

  return {
    conv_id: conv.conv_id,
    customer_id: conv.customer_id,
    factory_id: conv.factory_id,
    factory_name: conv.factory.factory_name || undefined,
    factory_image: conv.factory.image_url || undefined,
    customer_name: pickScalarString(conv.customer.display_name, customerFullName) || undefined,
    customer_image: undefined,
    rfq_id: null,
    rfq_title: null,
    last_message: conv.last_message || undefined,
    last_message_at: conv.updated_at || undefined,
    unread_customer: conv.unread_customer,
    unread_factory: conv.unread_factory,
    has_quote: conv.has_quote,
    updated_at: conv.updated_at,
  };
}
