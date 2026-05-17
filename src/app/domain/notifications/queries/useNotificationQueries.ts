import { useQuery } from '@tanstack/react-query';
import { notificationKeys } from '@/lib/queryKeys';
import { notificationsApi } from '@/services/api/chatApi';
import {
  mapNotificationsPageFromApi,
  mapNotificationsFromApi,
} from '@/domain/notifications/mappers/mapNotification';
import { pickScalarNumber } from '@/utils/pickScalarString';

export async function fetchNotificationsPage(page = 1, limit = 20, unread = false) {
  const raw = await notificationsApi.list({ page, limit, unread });
  return mapNotificationsPageFromApi(raw, page);
}

export async function fetchNotificationUnreadCount(): Promise<number> {
  const raw = await notificationsApi.unreadCount();
  return pickScalarNumber(
    (raw as { count?: unknown })?.count,
    (raw as { total?: unknown })?.total,
  ) ?? 0;
}

export async function fetchNotificationsList() {
  const raw = await notificationsApi.list();
  return mapNotificationsFromApi(raw);
}

export function useNotificationUnreadCountQuery(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: fetchNotificationUnreadCount,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
