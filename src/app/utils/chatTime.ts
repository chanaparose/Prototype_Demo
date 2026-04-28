/**
 * chatTime utilities
 *
 * Chat backend currently returns Bangkok wall-clock with a trailing `Z`.
 * For chat only, we must treat `...Z` as local Bangkok wall-clock to keep
 * on-screen times consistent with API payload values.
 */

const BANGKOK_OFFSET_MIN = 7 * 60;

/**
 * Parse chat timestamp safely across browsers.
 * - `...Z` from chat API is treated as Bangkok wall-clock (legacy BE behavior).
 * - Explicit numeric offsets (`+07:00`, `-0500`) are parsed as standard ISO.
 * - Missing timezone falls back to Bangkok-local interpretation.
 */
export function parseBangkokWallClock(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const trimmed = String(iso).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('0001-01-01')) return null;

  // Truncate fractional seconds to 3 digits (Safari max), strip trailing
  // Z or +HH:MM / -HHMM / +HHMM offsets.
  const naive = trimmed
    .replace(/(\.\d{3})\d+/, '$1')
    .replace(/Z$/i, '')
    .replace(/[+-]\d{2}:?\d{2}$/, '');
  // Treat remaining wall-clock as Bangkok local time.
  // This mirrors the known chat timestamp behavior in current BE.
  // eslint-disable-next-line no-restricted-syntax
  const d = new Date(naive + '+07:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format an ISO timestamp as `HH:mm` in Bangkok time, after running it
 * through {@link parseBangkokWallClock}.
 */
export function formatChatTime(iso: string | null | undefined): string {
  const d = parseBangkokWallClock(iso);
  if (!d) return '';
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  });
}

/**
 * Format an ISO timestamp as a Thai date label (e.g. `27 เม.ย. 2569`),
 * after running it through {@link parseBangkokWallClock}.
 */
export function formatChatDateLabel(iso: string | null | undefined): string {
  const d = parseBangkokWallClock(iso);
  if (!d) return '-';
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });
}

/**
 * `YYYY-MM-DD` Bangkok date key, used for grouping messages by day.
 */
export function bangkokDateKey(iso: string | null | undefined): string {
  const d = parseBangkokWallClock(iso);
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

/**
 * Generate optimistic timestamp in the same shape BE chat API emits
 * (Bangkok wall-clock digits suffixed with `Z`).
 */
export function bangkokWallClockNow(): string {
  const now = new Date();
  const shifted = new Date(now.getTime() + BANGKOK_OFFSET_MIN * 60_000);
  return shifted.toISOString();
}
