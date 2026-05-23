import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/stores/useAuthStore';
import { type Conversation } from '@/stores/types';
import { conversationsApi, messagesApi } from '@/services/api/chatApi';
import { refreshConversationsCache } from '@/domain/chat/chatCache';
import { mapConversationFromApi } from '@/domain/chat/mappers/mapConversation';
import { mapConversationToApiConversation } from '@/domain/chat/mappers/mapConversationStore';
import { getCurrentUserId, type ApiConversation } from '@/utils/chatContract';
import { pickScalarString } from '@/utils/pickScalarString';
import { rowToRoomMessage, type RoomMessage } from '@/components/chat/MessageBubble';
import { dedupeByKey, sortMessagesByCreatedAt } from '@/pages/messages/selectors';
import { useMarkAsRead } from '@/pages/messages/useMarkAsRead';
import { setSSECallbacks } from '@/hooks/useNotificationSSE';

export type ChatRoomPreview = {
  factoryId?: string;
  factoryName: string;
  factoryImage: string;
  rfqName: string;
  hasQuote?: boolean;
};

export function messagesFromApi(raw: unknown): RoomMessage[] {
  const arr = Array.isArray(raw) ? raw : [];
  const msgs = (arr as Record<string, unknown>[])
    .map(rowToRoomMessage)
    // rowToRoomMessage already returns null for messages with no renderable body,
    // so a simple null-check here is sufficient. We use message_type (not reference_type)
    // to determine renderability — that logic lives inside rowToRoomMessage.
    .filter((m): m is RoomMessage => m != null);
  return sortMessagesByCreatedAt(msgs);
}

export function useChatRoomSession(conversationId: string, preview?: ChatRoomPreview) {
  const { user } = useAuth();
  const currentUserId = getCurrentUserId(user);
  const markAsRead = useMarkAsRead();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [apiConv, setApiConv] = useState<ApiConversation | null>(null);
  const [header, setHeader] = useState({
    factoryId: preview?.factoryId ?? '',
    factoryName: preview?.factoryName ?? '',
    factoryAvatar: preview?.factoryImage ?? '',
    rfqName: preview?.rfqName ?? '',
    hasQuote: Boolean(preview?.hasQuote),
  });

  const refreshConversations = useCallback(async () => {
    await refreshConversationsCache();
  }, []);

  useEffect(() => {
    setHeader({
      factoryId: preview?.factoryId ?? '',
      factoryName: preview?.factoryName ?? '',
      factoryAvatar: preview?.factoryImage ?? '',
      rfqName: preview?.rfqName ?? '',
      hasQuote: Boolean(preview?.hasQuote),
    });
  }, [
    preview?.factoryId,
    preview?.factoryName,
    preview?.factoryImage,
    preview?.rfqName,
    preview?.hasQuote,
  ]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setMsgLoading(false);
      setApiConv(null);
      return;
    }
    let cancelled = false;
    setMsgLoading(true);
    Promise.all([
      messagesApi.list(conversationId).catch(() => [] as unknown[]),
      conversationsApi.get(conversationId).catch(() => null),
    ])
      .then(([rawMsgs, rawConv]) => {
        if (cancelled) return;
        setMessages(messagesFromApi(rawMsgs));

        if (rawConv && typeof rawConv === 'object') {
          const rawConvRow = rawConv as unknown as Record<string, unknown>;
          const mapped = mapConversationFromApi(rawConvRow);
          if (mapped) {
            const parsed = mapConversationToApiConversation(mapped);
            setApiConv({
              ...parsed,
              rfq_title: pickScalarString(
                rawConvRow.rfq_title,
                rawConvRow.rfq_name,
              ) || null,
            });
            setHeader((h) => ({
              factoryId: String(mapped.factory_id) || h.factoryId,
              factoryName: mapped.factory.factory_name || h.factoryName,
              factoryAvatar: mapped.factory.image_url || h.factoryAvatar,
              rfqName:
                pickScalarString(
                  rawConvRow.rfq_title,
                  rawConvRow.rfq_name,
                ) || h.rfqName,
              hasQuote: mapped.has_quote,
            }));
          }
        }

        void (async () => {
          await markAsRead(conversationId);
          await refreshConversations();
        })();
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setMsgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, markAsRead, refreshConversations]);

  useEffect(() => {
    if (!conversationId) return;
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void (async () => {
        await markAsRead(conversationId, { force: true });
        await refreshConversations();
      })();
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [conversationId, markAsRead, refreshConversations]);

  // Use SSE for real-time message updates instead of polling
  const convIdRef = useRef(conversationId);
  convIdRef.current = conversationId;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (raw: unknown) => {
      if (!raw || typeof raw !== 'object') return;
      const msgObj = raw as Record<string, unknown>;
      // Only process messages belonging to the current conversation
      const msgConvId = String(msgObj.conv_id ?? '');
      if (msgConvId !== String(convIdRef.current)) return;

      const incoming = rowToRoomMessage(msgObj);
      if (!incoming) return;

      setMessages((prev) => {
        const merged = dedupeByKey([...prev, incoming]);
        return sortMessagesByCreatedAt(merged);
      });

      // If the message is for me, mark as read
      const uid = currentUserIdRef.current;
      if (uid != null && incoming.receiver_id === uid && incoming.sender_id !== uid) {
        void (async () => {
          await markAsRead(conversationId, { force: true });
          await refreshConversations();
        })();
      }
    };

    const handleMessagesRead = (data: { conv_id: number; reader_id: number }) => {
      // Only process if this event belongs to current conversation
      if (String(data.conv_id) !== String(convIdRef.current)) return;
      // Flip all MY sent messages (where receiver = reader) to is_read = true
      setMessages((prev) =>
        prev.map((m) =>
          m.receiver_id === data.reader_id && m.sender_id !== data.reader_id
            ? { ...m, is_read: true }
            : m,
        ),
      );
    };

    setSSECallbacks({ onNewMessage: handleNewMessage, onMessagesRead: handleMessagesRead });
    return () => {
      setSSECallbacks({});
    };
  }, [conversationId, markAsRead, refreshConversations]);

  const conv: Conversation = useMemo(
    () => ({
      id: conversationId,
      factoryId: header.factoryId || '',
      rfqId: '',
      factoryName: header.factoryName,
      factoryAvatar: header.factoryAvatar,
      rfqName: header.rfqName,
      lastMessage: '',
      time: '',
      unread: 0,
      hasQuote: header.hasQuote,
      messages: [],
    }),
    [conversationId, header],
  );

  return {
    conv,
    apiConv,
    messages,
    setMessages,
    msgLoading,
    refreshConversations,
    // @deprecated Use `refreshConversations`
    refetchConversations: refreshConversations,
  };
}
