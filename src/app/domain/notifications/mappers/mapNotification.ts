import type {
  INotificationModel,
  INotificationsPageModel,
} from '@/domain/notifications/types/notification.model';
import type { Notification as BootstrapNotificationModel } from '@/stores/types';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

function extractRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
    if (Array.isArray(obj.rows)) return obj.rows as Record<string, unknown>[];
  }
  return [];
}

export function mapNotificationFromApi(row: Record<string, unknown>): INotificationModel | null {
  const notiId = pickScalarNumber(row.noti_id, row.notification_id, row.id) ?? 0;
  if (!Number.isFinite(notiId) || notiId <= 0) return null;

  const linkTo = pickScalarString(row.link_to, row.linkTo, row.link);
  return {
    noti_id: notiId,
    type: pickScalarString(row.type),
    title: pickScalarString(row.title, 'การแจ้งเตือน'),
    message: pickScalarString(row.message, row.body),
    ...(linkTo ? { link_to: linkTo } : {}),
    is_read: Boolean(row.is_read ?? row.read ?? false),
    created_at: pickScalarString(row.created_at, row.time),
    avatar: pickScalarString(row.avatar) || undefined,
    rfq_id: row.rfq_id != null ? pickScalarString(row.rfq_id) : undefined,
    order_id: row.order_id != null ? pickScalarString(row.order_id) : undefined,
    conversation_id:
      row.conversation_id != null ? pickScalarString(row.conversation_id) : undefined,
  };
}

export function mapNotificationsFromApi(raw: unknown): INotificationModel[] {
  return extractRows(raw)
    .map(mapNotificationFromApi)
    .filter((item): item is INotificationModel => item != null);
}

export function mapNotificationsPageFromApi(
  raw: unknown,
  fallbackPage: number,
): INotificationsPageModel {
  const root =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const items = mapNotificationsFromApi(raw);
  return {
    items,
    page: pickScalarNumber(root.page) ?? fallbackPage,
    total: pickScalarNumber(root.total) ?? items.length,
    unreadCount:
      pickScalarNumber(root.unread_count, root.unreadCount) ??
      items.filter((n) => !n.is_read).length,
  };
}

export function mapNotificationToBootstrapModel(n: INotificationModel): BootstrapNotificationModel {
  return {
    id: String(n.noti_id),
    type: n.type,
    title: n.title,
    message: n.message,
    time: n.created_at,
    read: n.is_read,
    linkTo: n.link_to ?? '',
    avatar: n.avatar ?? '',
    rfqId: n.rfq_id,
    orderId: n.order_id,
    conversationId: n.conversation_id,
  };
}
