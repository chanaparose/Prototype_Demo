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

/** Card section header — formal calm purple/blue with clear readability */
export const SHOWCASE_SECTION_HEADER_CLASS =
  'border-b border-[color-mix(in_srgb,var(--brand-indigo)_18%,var(--neutral-border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--brand-lavender-muted)_84%,var(--neutral-white))_0%,color-mix(in_srgb,var(--brand-lavender-muted)_72%,var(--brand-sky)_8%)_100%)] px-6 py-3';

export const SHOWCASE_SECTION_HEADER_TITLE_CLASS =
  'text-[14px] font-semibold tracking-[0.01em] text-[var(--brand-navy-ink)]';

/** Spec table + product-detail markdown — 14px mobile & desktop */
export const SHOWCASE_DETAIL_DATA_TEXT_CLASS = 'text-[14px]';

/** Flat typography for markdown in showcase detail (matches SHOWCASE_DETAIL_DATA_TEXT_CLASS) */
export const SHOWCASE_DETAIL_MARKDOWN_CLASS = [
  'max-w-none text-gray-700 leading-relaxed',
  SHOWCASE_DETAIL_DATA_TEXT_CLASS,
  '[&_p]:my-2',
  '[&_p]:text-[14px]',
  '[&_li]:text-[14px]',
  '[&_ul]:text-[14px]',
  '[&_ol]:text-[14px]',
  '[&_td]:text-[14px]',
  '[&_th]:text-[14px]',
  '[&_table]:text-[14px]',
  '[&_a]:text-[14px]',
  '[&_blockquote]:text-[14px]',
  '[&_strong]:text-[14px]',
  '[&_em]:text-[14px]',
  '[&_span]:text-[14px]',
  '[&_code]:text-[14px]',
  '[&_h1]:text-[14px] [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2',
  '[&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2',
  '[&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2',
  '[&_h4]:text-[14px] [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-2',
  '[&_h5]:text-[14px] [&_h5]:font-semibold [&_h5]:mt-2 [&_h5]:mb-1',
  '[&_h6]:text-[14px] [&_h6]:font-semibold [&_h6]:mt-2 [&_h6]:mb-1',
  '[&_strong]:font-semibold',
  '[&_em]:italic',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2',
  '[&_li]:my-1',
  '[&_li>ul]:my-1 [&_li>ol]:my-1',
  '[&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-700',
  '[&_img]:rounded-lg [&_img]:mx-auto [&_img]:max-w-full [&_img]:my-3',
  '[&_hr]:my-5 [&_hr]:border-gray-200',
  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:overflow-x-auto',
  '[&_th]:bg-gray-50 [&_th]:border [&_td]:border [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2',
  '[&_pre]:overflow-x-auto [&_pre]:bg-gray-50 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-3',
  '[&_code]:font-mono',
  '[&_p_code]:bg-gray-100 [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded',
].join(' ');

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
