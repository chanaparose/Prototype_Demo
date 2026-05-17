import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '@/services/api';

/** TanStack Query hook for listing messages in a conversation (optional use from screens). */
export function useChatMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => messagesApi.list(conversationId!),
    enabled: Boolean(conversationId),
  });
}
