export const SHOWCASE_DETAIL_BRAND = {
  rose: '#E11D48',
  roseSoft: 'var(--surface-rose-soft)',
  orange: 'var(--brand-orange)',
  orangeDark: 'var(--brand-orange-vivid)',
  orangeSoft: 'var(--surface-orange-tint)',
  purple: 'var(--brand-purple)',
  purpleSoft: '#F5F3FF',
  ink: 'var(--brand-ink)',
  border: '#E7E2F0',
} as const;

export function formatShowcaseThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function normalizeShowcaseMarkdown(raw: unknown): string {
  const s = String(raw ?? '');
  if (!s) return '';
  return s
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .trim();
}

export function formatShowcaseTHB(value: number | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function daysBetween(a: Date, b: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / oneDay));
}
