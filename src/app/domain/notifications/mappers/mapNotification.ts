import type {
  INotificationModel,
  INotificationsPageModel,
} from '@/domain/notifications/types/notification.model';
import type { Notification as BootstrapNotificationModel } from '@/stores/types';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

/**
 * Notification type supersede rules
 *
 * ถ้ามี notification ประเภท `specificType` สำหรับ reference_id เดียวกัน
 * → ซ่อน notification ประเภท `broadType` ของ reference_id นั้นออก
 *
 * ปรับ type codes ตามที่ backend ส่งมาจริง เช่น:
 *   { broadType: 'rfq_new_category',    specificType: 'rfq_new_subcategory' }
 *   { broadType: 'RC',                  specificType: 'RS' }  ← ถ้า backend ใช้ CHAR(2)
 */
export const NOTI_SUPERSEDE_RULES: Array<{
  /** notification ประเภทกว้าง (category-level) — จะถูกซ่อนถ้ามี specificType อยู่ */
  broadType: string;
  /** notification ประเภทเฉพาะ (subcategory-level) — เมื่อมีแล้ว broadType จะถูก suppress */
  specificType: string;
}> = [
  // TODO: ใส่ type codes จริงจาก backend เช่น:
  // { broadType: 'rfq_new_category', specificType: 'rfq_new_subcategory' },
  // { broadType: 'RC',               specificType: 'RS' },
];

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
  const referenceId = pickScalarNumber(row.reference_id, row.referenceId) ?? undefined;

  // rfq_id: ใช้ค่า explicit ก่อน ถ้าไม่มีให้ลอง reference_id (backend บางครั้งส่ง reference_id เท่านั้น)
  const rfqId =
    row.rfq_id != null
      ? pickScalarString(row.rfq_id)
      : referenceId != null
        ? String(referenceId)
        : undefined;

  return {
    noti_id: notiId,
    type: pickScalarString(row.type),
    title: pickScalarString(row.title, 'การแจ้งเตือน'),
    message: pickScalarString(row.message, row.body),
    ...(linkTo ? { link_to: linkTo } : {}),
    is_read: Boolean(row.is_read ?? row.read ?? false),
    created_at: pickScalarString(row.created_at, row.time),
    avatar: pickScalarString(row.avatar) || undefined,
    rfq_id: rfqId,
    order_id: row.order_id != null ? pickScalarString(row.order_id) : undefined,
    conversation_id:
      row.conversation_id != null ? pickScalarString(row.conversation_id) : undefined,
    ...(referenceId != null ? { reference_id: referenceId } : {}),
  };
}

/**
 * Suppress broad-type notifications when a more-specific type exists for the same rfq_id.
 * ใช้ NOTI_SUPERSEDE_RULES เป็น config — ต้องใส่ type codes จริงก่อนถึงจะทำงาน
 */
function applySupersedeDeduplicate(items: INotificationModel[]): INotificationModel[] {
  if (NOTI_SUPERSEDE_RULES.length === 0) return items;

  // สร้าง Set ของ (specificType + rfq_id) ที่มีอยู่จริงใน list
  const specificKeys = new Set<string>();
  for (const item of items) {
    for (const rule of NOTI_SUPERSEDE_RULES) {
      if (item.type === rule.specificType && item.rfq_id) {
        specificKeys.add(`${rule.specificType}__${item.rfq_id}`);
      }
    }
  }

  if (specificKeys.size === 0) return items;

  // กรอง broad-type ออกถ้ามี specific-type สำหรับ rfq_id เดียวกัน
  return items.filter((item) => {
    for (const rule of NOTI_SUPERSEDE_RULES) {
      if (item.type === rule.broadType && item.rfq_id) {
        const key = `${rule.specificType}__${item.rfq_id}`;
        if (specificKeys.has(key)) return false; // suppress
      }
    }
    return true;
  });
}

export function mapNotificationsFromApi(raw: unknown): INotificationModel[] {
  const seen = new Set<number>();
  const unique = extractRows(raw)
    .map(mapNotificationFromApi)
    .filter((item): item is INotificationModel => {
      if (item == null) return false;
      if (seen.has(item.noti_id)) return false;
      seen.add(item.noti_id);
      return true;
    });
  return applySupersedeDeduplicate(unique);
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
