import { queryClient } from '@/lib/queryClient';
import { chatKeys } from '@/lib/queryKeys';
import { fetchConversations } from '@/domain/chat/queries/useConversationsQuery';
import { useAuth } from '@/stores/useAuthStore';

/** Invalidate and refresh the TanStack conversation cache. */
export async function refreshConversationsCache(): Promise<void> {
  const { isAuthenticated } = useAuth.getState();
  if (!isAuthenticated) return;

  await queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });

  try {
    const list = await fetchConversations();
    queryClient.setQueryData(chatKeys.conversations(), list);
  } catch {
    /* keep cached conversations */
  }
}
