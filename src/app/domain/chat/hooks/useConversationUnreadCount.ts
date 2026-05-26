import { useMemo } from 'react';
import { useAuth } from '@/stores/useAuthStore';
import { getCurrentUserId } from '@/utils/chatContract';
import { useConversationsQuery } from '@/domain/chat/queries/useConversationsQuery';
import { resolveUnreadCount } from '@/pages/messages/types';

export function useConversationUnreadCount(): number {
  const { user, isAuthenticated } = useAuth();
  const currentUserId = getCurrentUserId(user);
  const enabled = isAuthenticated && currentUserId != null;
  const conversationsQ = useConversationsQuery(enabled);

  return useMemo(() => {
    if (!enabled || currentUserId == null) return 0;
    return (conversationsQ.data ?? []).reduce(
      (sum, conv) => sum + resolveUnreadCount(conv, currentUserId),
      0,
    );
  }, [conversationsQ.data, currentUserId, enabled]);
}
