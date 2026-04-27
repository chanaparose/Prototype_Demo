/**
 * chatTime — workaround for BE timestamp bug
 *
 * The chat backend currently emits Bangkok wall-clock timestamps but stamps
 * them with a trailing `Z` (UTC marker). Example:
 *   user sends a message at 00:53 Bangkok time
 *   BE returns "2026-04-27T00:53:44Z"   ← wrong: claims UTC
 *
 * This util normalizes both directions:
 *  - parseBangkokWallClock(): strips the bogus `Z` and reinterprets the
 *    wall-clock components as Bangkok local time (UTC+7).
 *  - bangkokWallClockNow(): generates an optimistic timestamp in the same
 *    shape, so optimistic + server-echo messages sort and display identically.
 *
 * Once BE is fixed (to emit either real UTC or `+07:00` offset), delete this
 * file and revert callers to plain `new Date()` / `toISOString()`.
 */

const BANGKOK_OFFSET_MIN = 7 * 60;

/**
 * Parse a server `created_at` string treating its wall-clock components
 * as Bangkok local time, regardless of any trailing `Z` or offset.
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
 * Generate an optimistic timestamp in the same broken shape the BE emits:
 * Bangkok wall-clock components, suffixed with `Z`. This keeps optimistic
 * messages sortable and visually consistent with server-echoed ones until
 * BE is fixed.
 *
 * Example output: `"2026-04-27T00:53:44.105Z"`
 *
 * Implementation: shift `now` forward by exactly the Bangkok UTC offset
 * (independent of the browser's local TZ) so that calling `toISOString()`
 * — which always formats UTC components — produces the Bangkok wall-clock
 * digits with a `Z` suffix. This matches what BE writes when its process
 * runs with `time.Local = Asia/Bangkok` and marshals via RFC3339.
 */
export function bangkokWallClockNow(): string {
  const now = new Date();
  const shifted = new Date(now.getTime() + BANGKOK_OFFSET_MIN * 60_000);
  return shifted.toISOString();
}
