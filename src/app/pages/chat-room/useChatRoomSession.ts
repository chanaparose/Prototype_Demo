import { useCallback, useEffect, useMemo, useState } from 'react';

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
    .filter(
      (m): m is RoomMessage =>
        m != null &&
        (m.content.trim() !== '' ||
          m.message_type === 'QT' ||
          m.message_type === 'quotation_card' ||
          m.message_type === 'rfq_card' ||
          m.message_type === 'system' ||
          m.message_type === 'IM'),
    );
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
          const mapped = mapConversationFromApi(rawConv as Record<string, unknown>);
          if (mapped) {
            const parsed = mapConversationToApiConversation(mapped);
            setApiConv({
              ...parsed,
              rfq_title: pickScalarString(
                (rawConv as Record<string, unknown>).rfq_title,
                (rawConv as Record<string, unknown>).rfq_name,
              ) || null,
            });
            setHeader((h) => ({
              factoryId: String(mapped.factory_id) || h.factoryId,
              factoryName: mapped.factory.factory_name || h.factoryName,
              factoryAvatar: mapped.factory.image_url || h.factoryAvatar,
              rfqName:
                pickScalarString(
                  (rawConv as Record<string, unknown>).rfq_title,
                  (rawConv as Record<string, unknown>).rfq_name,
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

  useEffect(() => {
    if (!conversationId) return;
    let stop = false;
    const timer = window.setInterval(() => {
      if (stop || document.hidden) return;
      void messagesApi
        .list(conversationId)
        .then((raw) => {
          if (stop) return;
          const serverRows = messagesFromApi(raw);
          const hasUnreadForMe =
            currentUserId != null &&
            serverRows.some(
              (m) =>
                m.receiver_id === currentUserId &&
                m.sender_id !== currentUserId &&
                m.is_read === false,
            );
          setMessages((prev) => {
            const pending = prev.filter((m) => m.status === 'sending' || m.status === 'error');
            const next = sortMessagesByCreatedAt(dedupeByKey([...serverRows, ...pending]));
            if (next.length === prev.length) {
              let same = true;
              for (let i = 0; i < next.length; i++) {
                const a = next[i];
                const b = prev[i];
                if (
                  a.key !== b.key ||
                  a.created_at !== b.created_at ||
                  a.status !== b.status ||
                  a.is_read !== b.is_read
                ) {
                  same = false;
                  break;
                }
              }
              if (same) return prev;
            }
            return next;
          });
          if (hasUnreadForMe) {
            void (async () => {
              await markAsRead(conversationId, { force: true });
              await refreshConversations();
            })();
          }
        })
        .catch(() => {});
    }, 4000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [conversationId, currentUserId, markAsRead, refreshConversations]);

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
    /** @deprecated Use `refreshConversations` */
    refetchConversations: refreshConversations,
  };
}
