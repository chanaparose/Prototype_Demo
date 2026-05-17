import type { Conversation } from '@/stores/types';
import { normalizeFactoryRow } from '@/utils/normalizeFactoryRow';

export { normalizeFactoryRow };

export function mapConversationRowsFromApi(rawConvs: Record<string, unknown>[]): Conversation[] {
  return rawConvs
    .map((r) => ({
      id: String(r.conversation_id ?? r.id ?? ''),
      factoryId: String(r.factory_id ?? r.factoryId ?? ''),
      rfqId: String(r.rfq_id ?? r.rfqId ?? ''),
      factoryName: String(r.factory_name ?? r.factoryName ?? ''),
      factoryAvatar: String(r.factory_avatar ?? r.factoryAvatar ?? ''),
      rfqName: String(r.rfq_name ?? r.rfqName ?? ''),
      lastMessage: String(r.last_message ?? r.lastMessage ?? ''),
      time: String(r.updated_at ?? r.time ?? ''),
      unread: Number(r.unread_count ?? r.unread ?? 0),
      hasQuote: Boolean(r.has_quote ?? r.hasQuote ?? false),
      messages: [],
    }))
    .filter((c) => c.id);
}
