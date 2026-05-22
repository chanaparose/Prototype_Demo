import { useEffect, useRef, useState } from 'react';
import { getToken } from '@/services/api/tokenManager';

function resolveStreamURL(): string {
  // Always use the relative path so the request goes through the Vite dev-server
  // proxy (same origin → no CORS issues). The proxy config already disables
  // response buffering for SSE streams.
  return '/api/v1/notifications/stream';
}

type SSECallbacks = {
  onNewMessage?: (msg: unknown) => void;
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
      } catch { /* ignore */ }
    });

    es.addEventListener('new_notification', (e: MessageEvent) => {
      try {
        const noti = JSON.parse(e.data as string) as { unread_count: number };
        setUnreadCount(noti.unread_count);
      } catch { /* ignore */ }
    });

    es.addEventListener('read', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as { unread_count: number };
        setUnreadCount(data.unread_count);
      } catch { /* ignore */ }
    });

    es.addEventListener('new_message', (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string);
        sseCallbacks.onNewMessage?.(msg);
      } catch { /* ignore */ }
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [enabled]);

  return { unreadCount };
}
