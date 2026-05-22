import { useNotificationSSE } from '@/hooks/useNotificationSSE';

export function useNotificationUnreadCount(enabled: boolean): number {
  return useNotificationSSE(enabled).unreadCount;
}
