/**
 * chatTime — shared chat timestamp helpers
 *
 * The backend now emits proper UTC/RFC3339 timestamps. These helpers keep all
 * chat views consistent by parsing the instant once and formatting it for the
 * Bangkok locale on display.
 */

export function parseChatInstant(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const trimmed = String(iso).trim();
  if (!trimmed || trimmed.startsWith('0001-01-01')) return null;
  const normalized = trimmed.replace(/(\.\d{1,3})\d+/, '$1');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatChatTime(iso: string | null | undefined): string {
  const d = parseChatInstant(iso);
  if (!d) return '';
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  });
}

export function formatChatDateLabel(iso: string | null | undefined): string {
  const d = parseChatInstant(iso);
  if (!d) return '-';
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });
}

export function bangkokDateKey(iso: string | null | undefined): string {
  const d = parseChatInstant(iso);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return y && m && day ? `${y}-${m}-${day}` : '';
}

export function chatNowIso(): string {
  return new Date().toISOString();
}
