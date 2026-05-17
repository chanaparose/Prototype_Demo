import { queryClient } from '@/lib/queryClient';
import { chatKeys } from '@/lib/queryKeys';
import { fetchConversations } from '@/domain/chat/queries/useConversationsQuery';
import { mapConversationToStoreModel } from '@/domain/chat/mappers/mapConversationStore';
import { useAuth } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';
import { getCurrentUserId } from '@/utils/chatContract';
import { isFactoryRole } from '@/utils/factoryUser';

function resolveViewerRole(
  list: Awaited<ReturnType<typeof fetchConversations>>,
): 'CT' | 'FT' | undefined {
  const { user, isAuthenticated } = useAuth.getState();
  if (!isAuthenticated || !user) return undefined;
  if (isFactoryRole(user)) return 'FT';

  const currentUserId = getCurrentUserId(user);
  if (currentUserId != null && list.some((c) => c.customer_id === currentUserId)) return 'CT';
  if (currentUserId != null && list.some((c) => c.factory.user_id === currentUserId)) return 'FT';
  return 'CT';
}

/** Invalidate TanStack cache and sync legacy store slice for sidebar / ChatRoom preview. */
export async function refreshConversationsCache(): Promise<void> {
  const { isAuthenticated } = useAuth.getState();
  if (!isAuthenticated) return;

  await queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });

  try {
    const list = await fetchConversations();
    const viewerRole = resolveViewerRole(list);
    useDataStore.setState({
      conversations: list.map((c) => mapConversationToStoreModel(c, viewerRole)),
    });
  } catch {
    /* keep cached conversations in store */
  }
}
