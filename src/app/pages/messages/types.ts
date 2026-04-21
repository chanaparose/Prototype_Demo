import type { ConversationDTO } from '../../types/api';
import type { CounterpartyView } from '../../utils/counterparty';

export type UiConversation = {
  id: string;
  conv: ConversationDTO;
  view: CounterpartyView;
  rfqName: string;
  lastMessage: string;
  lastMessageAt: string;
  updatedAt: string;
  unread: number;
  hasQuote: boolean;
};

export function unreadForViewer(conv: ConversationDTO, role: 'CT' | 'FT') {
  return role === 'CT' ? conv.unread_customer : conv.unread_factory;
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
