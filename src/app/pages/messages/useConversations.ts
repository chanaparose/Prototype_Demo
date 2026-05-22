import { useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/useAuthStore';
import type { IConversationResponse } from '@/types/api';
import { useConversationsQuery } from '@/domain/chat/queries/useConversationsQuery';
import { getCurrentUserId } from '@/utils/chatContract';
import { resolveCounterparty } from '@/utils/counterparty';
import { unreadForViewer } from '@/pages/messages/types';
import { sortConversations } from '@/pages/messages/selectors';

export function useConversations() {
  const { user, isAuthenticated } = useAuth();
  const currentUserId = getCurrentUserId(user);
  const enabled = isAuthenticated && currentUserId != null;
  const conversationsQ = useConversationsQuery(enabled);

  const items = useMemo(() => {
    if (!enabled || currentUserId == null) return [];
    return sortConversations(
      (conversationsQ.data ?? []).map((conv: IConversationResponse) => {
        const view = resolveCounterparty(conv, currentUserId);
        return {
          id: String(conv.conv_id),
          conv,
          view,
          rfqName: '',
          lastMessage: conv.last_message ?? '',
          lastMessageAt: conv.updated_at ?? '',
          updatedAt: conv.updated_at ?? '',
          unread: unreadForViewer(conv, view.viewerRole),
          hasQuote: Boolean(conv.has_quote),
        };
      }),
    );
  }, [conversationsQ.data, currentUserId, enabled]);

  const reload = useCallback(async () => {
    await conversationsQ.refetch();
  }, [conversationsQ.refetch]);

  return {
    items,
    loading: enabled ? conversationsQ.isLoading || conversationsQ.isFetching : false,
    error: conversationsQ.error
      ? conversationsQ.error instanceof Error
        ? conversationsQ.error.message
        : 'โหลดข้อความไม่สำเร็จ'
      : null,
    reload,
  };
}
