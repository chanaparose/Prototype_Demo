import { useEffect, useRef, useState } from 'react';
import { getToken } from '@/services/api/tokenManager';
import { httpClient } from '@/services/api/httpClient';
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

// Mint a short-lived, single-use ticket so the long-lived JWT never appears in
// the SSE URL (URLs leak into access/proxy logs and browser history).
async function fetchStreamTicket(): Promise<string | null> {
  try {
    const res = await httpClient.post<{ ticket?: string }>('/notifications/stream-ticket');
    return res?.ticket ?? null;
  } catch {
    return null;
  }
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

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 3000; // grows on repeated failures, capped below

    const attach = (es: EventSource) => {
      es.addEventListener('init', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data as string) as { unread_count: number };
          setUnreadCount(data.unread_count);
          retryDelay = 3000; // healthy connection → reset backoff
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

      es.onerror = () => {
        // A ticket is single-use, so the browser's native reconnect (which
        // replays the same URL) can't work. Take over: close and reconnect
        // manually with a freshly minted ticket, backing off on repeated fails.
        if (cancelled) return;
        es.close();
        if (esRef.current === es) esRef.current = null;
        scheduleReconnect();
      };
    };

    const connect = async () => {
      if (cancelled) return;
      const ticket = await fetchStreamTicket();
      if (cancelled) return;

      // Prefer ticket auth; fall back to the legacy token-in-URL only if the
      // ticket endpoint is unavailable, so notifications never fully break.
      // TODO: drop the token fallback once ticket auth is verified in prod.
      const url = ticket
        ? `${resolveStreamURL()}?ticket=${encodeURIComponent(ticket)}`
        : `${resolveStreamURL()}?token=${encodeURIComponent(token)}`;

      const es = new EventSource(url);
      esRef.current = es;
      attach(es);
    };

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        retryDelay = Math.min(retryDelay * 2, 30000);
        connect();
      }, retryDelay);
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [enabled]);

  return { unreadCount };
}
