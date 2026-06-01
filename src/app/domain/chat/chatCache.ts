import { queryClient } from '@/lib/queryClient';
import { chatKeys } from '@/lib/queryKeys';
import { fetchConversations } from '@/domain/chat/queries/useConversationsQuery';
import { useAuthStore } from '@/stores/useAuthStore';
import { getCurrentUserId } from '@/utils/chatContract';
import type { IConversationResponse } from '@/services/api/types/chat.types';

/** Refresh the TanStack conversation cache with a single network request. */
export async function refreshConversationsCache(): Promise<void> {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) return;

  try {
    await queryClient.fetchQuery({
      queryKey: chatKeys.conversations(),
      queryFn: fetchConversations,
      staleTime: 0,
    });
  } catch {
    /* keep cached conversations */
  }
}

/** Derive which counter field belongs to the viewer for a given conversation. */
function viewerRole(conv: IConversationResponse, currentUserId: number): 'CT' | 'FT' {
  if (conv.viewer_role) return conv.viewer_role;
  return conv.customer_id === currentUserId ? 'CT' : 'FT';
}

/**
 * Optimistically zero the unread count for a conversation in the TanStack cache.
 * Uses viewer_role (or derives it from customer_id) to pick the right counter.
 */
export function setConversationReadInCache(convId: string | number): void {
  const numId = Number(convId);
  const user = useAuthStore.getState().user;
  const uid = getCurrentUserId(user);
  if (uid == null) return;

  queryClient.setQueryData<IConversationResponse[]>(chatKeys.conversations(), (old) => {
    if (!old) return old;
    return old.map((conv) => {
      if (conv.conv_id !== numId) return conv;
      const role = viewerRole(conv, uid);
      return {
        ...conv,
        unread_customer: role === 'CT' ? 0 : conv.unread_customer,
        unread_factory: role === 'FT' ? 0 : conv.unread_factory,
      };
    });
  });
}

/**
 * Optimistically increment the unread counter for a conversation in the cache.
 * Only increments if the current user is NOT the sender of the message.
 */
export function incrementConversationUnreadInCache(convId: number, senderId: number): void {
  const user = useAuthStore.getState().user;
  const uid = getCurrentUserId(user);
  if (uid == null || senderId === uid) return;

  queryClient.setQueryData<IConversationResponse[]>(chatKeys.conversations(), (old) => {
    if (!old) return old;
    return old.map((conv) => {
      if (conv.conv_id !== convId) return conv;
      const role = viewerRole(conv, uid);
      return {
        ...conv,
        unread_customer: role === 'CT' ? conv.unread_customer + 1 : conv.unread_customer,
        unread_factory: role === 'FT' ? conv.unread_factory + 1 : conv.unread_factory,
      };
    });
  });
}
