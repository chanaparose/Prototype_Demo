import { useEffect, useRef, useState } from 'react';
import { getToken } from '@/services/api/tokenManager';
import {
  setConversationReadInCache,
  incrementConversationUnreadInCache,
} from '@/domain/chat/chatCache';
import { useAuthStore } from '@/stores/useAuthStore';
import { getCurrentUserId } from '@/utils/chatContract';

function resolveStreamURL(): string {
  // Always use the relative path so the request goes through the Vite dev-server
  // proxy (same origin → no CORS issues). The proxy config already disables
  // response buffering for SSE streams.
  return '/api/v1/notifications/stream';
}

type SSECallbacks = {
  onNewMessage?: (msg: unknown) => void;
  onMessagesRead?: (data: { conv_id: number; reader_id: number }) => void;
};

let sseCallbacks: SSECallbacks = {};

export function setSSECallbacks(cbs: SSECallbacks) {
  sseCallbacks = cbs;
}

export function useNotificationSSE(enabled: boolean): { unreadCount: number } {
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = getToken();
    if (!token) return;

    const url = `${resolveStreamURL()}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('init', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as { unread_count: number };
        setUnreadCount(data.unread_count);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener('new_notification', (e: MessageEvent) => {
      try {
        const noti = JSON.parse(e.data as string) as { unread_count: number };
        setUnreadCount(noti.unread_count);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener('read', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as { unread_count: number };
        setUnreadCount(data.unread_count);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener('new_message', (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string) as Record<string, unknown>;
        // Update conversations list unread badge instantly, before any refetch.
        const convId = Number(msg.conv_id ?? 0);
        const senderId = Number(msg.sender_id ?? 0);
        if (convId > 0 && senderId > 0) {
          incrementConversationUnreadInCache(convId, senderId);
        }
        sseCallbacks.onNewMessage?.(msg);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener('messages_read', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as { conv_id: number; reader_id: number };
        // Only zero OUR unread when we are the reader.
        const uid = getCurrentUserId(useAuthStore.getState().user);
        if (uid != null && data.reader_id === uid) {
          setConversationReadInCache(data.conv_id);
        }
        sseCallbacks.onMessagesRead?.(data);
      } catch {
        /* ignore */
      }
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [enabled]);

  return { unreadCount };
}
