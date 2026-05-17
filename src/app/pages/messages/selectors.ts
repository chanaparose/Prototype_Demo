import type { RoomMessage } from '@/components/chat/MessageBubble';
import type { UiConversation } from '@/pages/messages/types';
import { parseChatInstant } from '@/utils/chatTime';

/**
 * Normalize an ISO-8601 / RFC-3339 timestamp so JavaScript's Date parser
 * handles it reliably across all browsers (Safari is strict about fractional
 * seconds — it only accepts up to 3 digits).  Go's time.Time marshals with
 * up to 9 nanosecond digits; truncate the excess here.
 */
export function normalizeIso(iso: string): string {
  if (!iso) return '';
  // Guard: Go zero time "0001-01-01T..." is meaningless on the frontend.
  if (iso.startsWith('0001-01-01')) return '';

  return iso.replace(/(\.\d{1,3})\d+/, '$1');
}

function messageTimeMs(iso: string): number {
  const d = parseChatInstant(iso);
  if (!d) return 0;
  const t = d.getTime();
  return Number.isFinite(t) && t > 0 ? t : 0;
}

/** Sort by created_at ASC, tiebreak by key (message_id). */
export function sortMessagesByCreatedAt(msgs: RoomMessage[]): RoomMessage[] {
  return [...msgs].sort((a, b) => {
    const ta = messageTimeMs(a.created_at);
    const tb = messageTimeMs(b.created_at);
    if (ta !== tb) return ta - tb;
    const ia = Number(a.key);
    const ib = Number(b.key);
    if (Number.isFinite(ia) && Number.isFinite(ib)) return ia - ib;
    return 0;
  });
}

/** Insert one message preserving sort order. O(n) but n is small. */
export function insertMessageSorted(list: RoomMessage[], next: RoomMessage): RoomMessage[] {
  const clone = [...list];
  const t = messageTimeMs(next.created_at);
  const i = clone.findIndex((m) => messageTimeMs(m.created_at) > t);
  if (i === -1) clone.push(next);
  else clone.splice(i, 0, next);
  return clone;
}

/** Dedupe by key (server id wins over temp-*). */
export function dedupeByKey(list: RoomMessage[]): RoomMessage[] {
  const seen = new Map<string, RoomMessage>();
  for (const m of list) {
    const existing = seen.get(m.key);
    if (!existing) seen.set(m.key, m);
    else if (m.status === 'ok' && existing.status !== 'ok') seen.set(m.key, m);
  }
  return Array.from(seen.values());
}

/** Sort conversation list by lastMessageAt desc, fallback updatedAt desc. */
export function sortConversations(items: UiConversation[]): UiConversation[] {
  return [...items].sort((a, b) => {
    const ta = new Date(a.lastMessageAt || a.updatedAt || 0).getTime();
    const tb = new Date(b.lastMessageAt || b.updatedAt || 0).getTime();
    return tb - ta;
  });
}
