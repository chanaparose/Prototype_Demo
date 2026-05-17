import { useQuery } from '@tanstack/react-query';
import { messagesApi } from '@/services/api/chatApi';

export function useChatMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => messagesApi.list(conversationId!),
    enabled: Boolean(conversationId),
  });
}
