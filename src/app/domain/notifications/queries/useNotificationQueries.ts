import { useQuery } from '@tanstack/react-query';
import { notificationKeys } from '@/lib/queryKeys';
import { notificationsApi } from '@/services/api/chatApi';
import {
  mapNotificationsPageFromApi,
  mapNotificationsFromApi,
} from '@/domain/notifications/mappers/mapNotification';
import { pickScalarNumber } from '@/utils/pickScalarString';

export async function fetchNotificationsPage(
  filter: 'all' | 'rfq' | 'order' = 'all',
  limit = 20,
  offset = 0,
) {
  const raw = await notificationsApi.list({ filter, limit, offset });
  const page = Math.floor(offset / limit) + 1;
  return mapNotificationsPageFromApi(raw, page);
}

export async function fetchNotificationUnreadCount(): Promise<number> {
  const raw = await notificationsApi.unreadCount();
  return pickScalarNumber((raw as { count?: unknown })?.count) ?? 0;
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
