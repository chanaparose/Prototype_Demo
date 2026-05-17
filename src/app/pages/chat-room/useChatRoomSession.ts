import { useEffect, useMemo, useState } from 'react';

import { useAuth, useData } from '../../stores';
import type { Conversation } from '../../stores';
import { conversationsApi, messagesApi } from '../../services/api';
import { getCurrentUserId, parseApiConversation, type ApiConversation } from '../../utils/chatContract';
import { rowToRoomMessage, type RoomMessage } from '../../components/chat/MessageBubble';
import { dedupeByKey, sortMessagesByCreatedAt } from '../messages/selectors';
import { useMarkAsRead } from '../messages/useMarkAsRead';

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
        (m.content.trim() !== "" ||
          m.message_type === "QT" ||
          m.message_type === "quotation_card" ||
          m.message_type === "rfq_card" ||
          m.message_type === "system" ||
          m.message_type === "IM"),
    );
  return sortMessagesByCreatedAt(msgs);
}


export function useChatRoomSession(conversationId: string, preview?: ChatRoomPreview) {
  const { user } = useAuth();
  const currentUserId = getCurrentUserId(user);
  const { refetchConversations } = useData();
  const markAsRead = useMarkAsRead();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [apiConv, setApiConv] = useState<ApiConversation | null>(null);
  const [header, setHeader] = useState({
    factoryId: preview?.factoryId ?? "",
    factoryName: preview?.factoryName ?? "",
    factoryAvatar: preview?.factoryImage ?? "",
    rfqName: preview?.rfqName ?? "",
    hasQuote: Boolean(preview?.hasQuote),
  });

  useEffect(() => {
    setHeader({
      factoryId: preview?.factoryId ?? "",
      factoryName: preview?.factoryName ?? "",
      factoryAvatar: preview?.factoryImage ?? "",
      rfqName: preview?.rfqName ?? "",
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
      messagesApi
        .list(conversationId)
        .catch(() => [] as unknown[]),
      conversationsApi
        .get(conversationId)
        .catch(() => null as Record<string, unknown> | null),
    ])
      .then(([rawMsgs, rawConv]) => {
        if (cancelled) return;
        setMessages(messagesFromApi(rawMsgs));

        if (rawConv && typeof rawConv === "object") {
          const r = rawConv as Record<string, unknown>;
          const parsed = parseApiConversation(r);
          if (parsed) setApiConv(parsed);
          setHeader((h) => ({
            factoryId:
              r.factory_id != null && String(r.factory_id).trim()
                ? String(r.factory_id)
                : r.factoryId != null && String(r.factoryId).trim()
                  ? String(r.factoryId)
                  : h.factoryId,
            factoryName:
              r.factory_name != null && String(r.factory_name).trim()
                ? String(r.factory_name)
                : h.factoryName,
            factoryAvatar:
              r.factory_image != null && String(r.factory_image).trim()
                ? String(r.factory_image)
                : r.factory_image_url != null &&
                    String(r.factory_image_url).trim()
                  ? String(r.factory_image_url)
                  : r.factory_avatar != null && String(r.factory_avatar).trim()
                    ? String(r.factory_avatar)
                    : h.factoryAvatar,
            rfqName:
              r.rfq_title != null && String(r.rfq_title).trim()
                ? String(r.rfq_title)
                : r.rfq_name != null && String(r.rfq_name).trim()
                  ? String(r.rfq_name)
                  : h.rfqName,
            hasQuote: Boolean(r.has_quote ?? r.hasQuote ?? h.hasQuote),
          }));
        }

        void (async () => {
          await markAsRead(conversationId);
          await refetchConversations();
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
  }, [conversationId, markAsRead, refetchConversations]);

  useEffect(() => {
    if (!conversationId) return;
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void (async () => {
        await markAsRead(conversationId, { force: true });
        await refetchConversations();
      })();
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [conversationId, markAsRead, refetchConversations]);

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
            const pending = prev.filter(
              (m) => m.status === "sending" || m.status === "error",
            );
            const next = sortMessagesByCreatedAt(
              dedupeByKey([...serverRows, ...pending]),
            );
            // Bail out if nothing actually changed — prevents the visible
            // flicker / re-render every 4 s when poll returns the same set.
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
              await refetchConversations();
            })();
          }
        })
        .catch(() => {
          /* ignore polling errors */
        });
    }, 4000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [conversationId, currentUserId, markAsRead, refetchConversations]);

  const conv: Conversation = useMemo(
    () => ({
      id: conversationId,
      factoryId: header.factoryId || "",
      rfqId: "",
      factoryName: header.factoryName,
      factoryAvatar: header.factoryAvatar,
      rfqName: header.rfqName,
      lastMessage: "",
      time: "",
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
    refetchConversations,
  };
}
