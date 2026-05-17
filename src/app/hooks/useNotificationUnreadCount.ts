import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { notificationKeys } from '@/lib/queryKeys';
import { useNotificationUnreadCountQuery } from '@/domain/notifications/queries/useNotificationQueries';

export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

export function useNotificationUnreadCount(enabled: boolean) {
  const { data = 0, refetch } = useNotificationUnreadCountQuery(enabled);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setInterval(() => void refetch(), 60_000);
    const onChanged = () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    };
  }, [enabled, refetch]);

  return enabled ? data : 0;
}
