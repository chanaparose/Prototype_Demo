import type { IConversationResponse } from '@/services/api/types/chat.types';
import { pickScalarString } from '@/utils/pickScalarString';

function rowObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nonNegativeInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseUnreadCounts(row: Record<string, unknown>): {
  unread_customer: number;
  unread_factory: number;
  viewer_unread?: number;
} {
  const role =
    row.viewer_role === 'FT' ? 'FT' : row.viewer_role === 'CT' ? 'CT' : undefined;

  const hasExplicitCustomer =
    row.unread_customer != null || row.unread_customer_count != null;
  const hasExplicitFactory =
    row.unread_factory != null || row.unread_factory_count != null;

  let unread_customer = hasExplicitCustomer
    ? nonNegativeInt(row.unread_customer ?? row.unread_customer_count)
    : 0;
  let unread_factory = hasExplicitFactory
    ? nonNegativeInt(row.unread_factory ?? row.unread_factory_count)
    : 0;

  const genericRaw =
    row.unread ?? row.unread_count ?? row.unreadCount ?? row.my_unread ?? row.unread_for_me;
  const hasGeneric = genericRaw != null;
  const generic = hasGeneric ? nonNegativeInt(genericRaw) : 0;

  if (!hasExplicitCustomer && !hasExplicitFactory) {
    if (!hasGeneric) return { unread_customer: 0, unread_factory: 0 };
    if (role === 'CT') return { unread_customer: generic, unread_factory: 0 };
    if (role === 'FT') return { unread_customer: 0, unread_factory: generic };
    return { unread_customer: 0, unread_factory: 0, viewer_unread: generic };
  }

  if (unread_customer === 0 && unread_factory === 0 && hasGeneric) {
    if (role === 'CT') unread_customer = generic;
    else if (role === 'FT') unread_factory = generic;
    else return { unread_customer: 0, unread_factory: 0, viewer_unread: generic };
  }

  return { unread_customer, unread_factory };
}

function unwrapConversationRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const root = raw as Record<string, unknown>;
    for (const key of ['conversations', 'data', 'items', 'results']) {
      const nested = root[key];
      if (Array.isArray(nested)) return nested as Record<string, unknown>[];
    }
  }
  return [];
}

export function mapConversationFromApi(row: Record<string, unknown>): IConversationResponse | null {
  const convId = Number(row.conv_id ?? row.conversation_id ?? row.id);
  if (!Number.isFinite(convId)) return null;

  const customerId = Number(row.customer_id ?? row.customerId ?? 0);
  const factoryId = Number(row.factory_id ?? row.factoryId ?? 0);
  const customerObj = rowObject(row.customer);
  const factoryObj = rowObject(row.factory);
  const unread = parseUnreadCounts(row);

  return {
    conv_id: convId,
    customer_id: Number.isFinite(customerId) ? customerId : 0,
    factory_id: Number.isFinite(factoryId) ? factoryId : 0,
    last_message: pickScalarString(row.last_message, row.lastMessage),
    unread_customer: unread.unread_customer,
    unread_factory: unread.unread_factory,
    ...(unread.viewer_unread != null ? { viewer_unread: unread.viewer_unread } : {}),
    has_quote: Boolean(row.has_quote ?? row.hasQuote ?? false),
    updated_at: pickScalarString(row.updated_at, row.time, row.last_message_at, row.lastMessageAt),
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
  return unwrapConversationRows(raw)
    .map(mapConversationFromApi)
    .filter((conversation): conversation is IConversationResponse => conversation != null);
}
