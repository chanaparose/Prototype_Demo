import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '../services/api';

export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

export function useNotificationUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }
    try {
      const res = await notificationsApi.unreadCount();
      setCount(Number((res as { count?: number })?.count ?? 0));
    } catch {
      // keep previous count on transient errors
    }
  }, [enabled]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    const onChanged = () => void load();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    };
  }, [load]);

  return count;
}

