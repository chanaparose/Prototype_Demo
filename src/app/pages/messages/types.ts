import type { IConversationResponse } from '@/types/api';
import type { CounterpartyView } from '@/utils/counterparty';

export type UiConversation = {
  id: string;
  conv: IConversationResponse;
  view: CounterpartyView;
  rfqName: string;
  lastMessage: string;
  lastMessageAt: string;
  updatedAt: string;
  unread: number;
  hasQuote: boolean;
};

export function unreadForViewer(conv: IConversationResponse, role: 'CT' | 'FT') {
  return role === 'CT' ? conv.unread_customer : conv.unread_factory;
}

/** Unread for the signed-in user (handles viewer_unread + party counters). */
export function resolveUnreadCount(conv: IConversationResponse, currentUserId: number): number {
  if (conv.viewer_unread != null && conv.viewer_unread > 0) {
    return conv.viewer_unread;
  }
  const role = conv.viewer_role ?? (conv.customer_id === currentUserId ? 'CT' : 'FT');
  return unreadForViewer(conv, role);
}

/** LINE-style list time: HH:mm today, เมื่อวาน, or short date */
export function formatConversationListTime(iso: string): string {
  if (!iso || !String(iso).trim()) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'เมื่อวาน';
  const diff = now.getTime() - d.getTime();
  const day = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (day < 7) {
    return d.toLocaleDateString('th-TH', { weekday: 'short' });
  }
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

/** Relative label for list timestamps (API ISO or free text fallback). */
export function formatConversationTime(iso: string): string {
  if (!iso || !String(iso).trim()) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return 'เมื่อสักครู่';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาที`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} วัน`;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}
