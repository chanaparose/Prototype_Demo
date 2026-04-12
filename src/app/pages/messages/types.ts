export type ApiConversation = {
  conv_id: number;
  customer_id: number;
  factory_id: number;
  factory_name?: string;
  factory_image?: string;
  rfq_id?: number | null;
  rfq_title?: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_customer: number;
  unread_factory: number;
  has_quote: boolean;
  updated_at: string;
};

export type UiConversation = {
  id: string;
  factoryId: string;
  factoryName: string;
  factoryImage: string;
  rfqName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  hasQuote: boolean;
};

export function normalizeConversation(
  row: ApiConversation,
  viewerRole: 'CU' | 'FT',
): UiConversation {
  return {
    id: String(row.conv_id),
    factoryId: String(row.factory_id),
    factoryName: row.factory_name ?? '',
    factoryImage: row.factory_image ?? '',
    rfqName: row.rfq_title ?? '',
    lastMessage: row.last_message ?? '',
    lastMessageAt: row.last_message_at ?? row.updated_at ?? '',
    unread: viewerRole === 'CU' ? row.unread_customer : row.unread_factory,
    hasQuote: Boolean(row.has_quote),
  };
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
