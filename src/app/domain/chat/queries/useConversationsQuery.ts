import { useQuery } from '@tanstack/react-query';
import { chatKeys } from '@/lib/queryKeys';
import { conversationsApi } from '@/services/api/chatApi';
import { mapConversationsFromApi } from '@/domain/chat/mappers/mapConversation';

export async function fetchConversations() {
  const raw = await conversationsApi.list();
  return mapConversationsFromApi(raw);
}

export function useConversationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: fetchConversations,
    enabled,
    placeholderData: (previous) => previous,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
