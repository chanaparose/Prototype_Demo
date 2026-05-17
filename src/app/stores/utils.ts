import { mapConversationsFromApi } from '@/domain/chat/mappers/mapConversation';
import { mapConversationToStoreModel } from '@/domain/chat/mappers/mapConversationStore';
import type { Conversation } from '@/stores/types';
import { normalizeFactoryRow } from '@/utils/normalizeFactoryRow';

export { normalizeFactoryRow };

/** @deprecated Prefer `fetchConversations` + `mapConversationToStoreModel`; kept for bootstrap sync. */
export function mapConversationRowsFromApi(raw: unknown): Conversation[] {
  return mapConversationsFromApi(raw).map((c) => mapConversationToStoreModel(c));
}
