import type { IConversationResponse } from '@/services/api/types/chat.types';
import { pickScalarString } from '@/utils/pickScalarString';

function rowObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function mapConversationFromApi(row: Record<string, unknown>): IConversationResponse | null {
  const convId = Number(row.conv_id ?? row.conversation_id ?? row.id);
  if (!Number.isFinite(convId)) return null;

  const customerId = Number(row.customer_id ?? row.customerId ?? 0);
  const factoryId = Number(row.factory_id ?? row.factoryId ?? 0);
  const customerObj = rowObject(row.customer);
  const factoryObj = rowObject(row.factory);

  return {
    conv_id: convId,
    customer_id: Number.isFinite(customerId) ? customerId : 0,
    factory_id: Number.isFinite(factoryId) ? factoryId : 0,
    last_message: pickScalarString(row.last_message, row.lastMessage),
    unread_customer: Number(row.unread_customer ?? row.unread_count ?? row.unread ?? 0),
    unread_factory: Number(row.unread_factory ?? row.unread_factory_count ?? 0),
    has_quote: Boolean(row.has_quote ?? row.hasQuote ?? false),
    updated_at: pickScalarString(row.updated_at, row.time),
    viewer_role: row.viewer_role === 'FT' ? 'FT' : row.viewer_role === 'CT' ? 'CT' : undefined,
    counterparty_user_id:
      row.counterparty_user_id != null ? Number(row.counterparty_user_id) : undefined,
    customer: {
      user_id: Number(customerObj.user_id ?? customerId ?? 0),
      first_name: pickScalarString(customerObj.first_name),
      last_name: pickScalarString(customerObj.last_name),
      display_name: pickScalarString(customerObj.display_name, row.customer_name),
    },
    factory: {
      user_id: Number(factoryObj.user_id ?? factoryId ?? 0),
      factory_name: pickScalarString(factoryObj.factory_name, row.factory_name),
      image_url: pickScalarString(factoryObj.image_url, row.factory_image, row.factory_image_url),
      is_verified: factoryObj.is_verified === true,
      specialization: pickScalarString(factoryObj.specialization),
    },
  };
}

export function mapConversationsFromApi(raw: unknown): IConversationResponse[] {
  const rows = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
  return rows
    .map(mapConversationFromApi)
    .filter((conversation): conversation is IConversationResponse => conversation != null);
}
