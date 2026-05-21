import { useEffect, useRef, useState } from 'react';
import { getToken } from '@/services/api/tokenManager';

function resolveStreamURL(): string {
  // In dev, VITE_BE_URL points directly to the Go server (e.g. http://localhost:3000).
  // Connect EventSource directly to avoid the Vite proxy buffering chunked SSE responses.
  const directBE = (import.meta.env.VITE_BE_URL as string | undefined)?.replace(/\/$/, '');
  if (directBE) return `${directBE}/api/v1/notifications/stream`;

  // Production: use VITE_API_BASE_URL (absolute or relative)
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
  const base =
    raw
      ? raw.startsWith('http') && !/\/api\/v\d+(\/|$)/.test(raw)
        ? `${raw}/api/v1`
        : raw
      : '/api/v1';
  return `${base}/notifications/stream`;
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

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [enabled]);

  return { unreadCount };
}
