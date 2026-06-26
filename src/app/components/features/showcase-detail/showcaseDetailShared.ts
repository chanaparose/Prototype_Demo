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

/** Section card title — showcase detail section headings */
export const SHOWCASE_SECTION_HEADER_TITLE_CLASS =
  'text-[16px] font-semibold tracking-[0.01em] text-[var(--brand-navy-ink)]';

/** Page / card title on showcase detail */
export const SHOWCASE_DETAIL_TITLE_CLASS =
  'text-[16px] font-bold leading-snug text-[var(--brand-ink)]';

/** Body copy — showcase detail primary content */
export const SHOWCASE_DETAIL_DATA_TEXT_CLASS = 'text-[14px]';

/** Muted meta line — secondary content on showcase detail */
export const SHOWCASE_DETAIL_META_TEXT_CLASS = 'text-[14px] text-gray-500';

/** Price / primary emphasis */
export const SHOWCASE_DETAIL_EMPHASIS_CLASS =
  'text-[14px] font-bold leading-none text-[var(--brand-violet)]';

/** Flat typography for markdown in showcase detail — body 13px, headings/strong 14px */
export const SHOWCASE_DETAIL_MARKDOWN_CLASS = [
  'max-w-none text-[13px] text-gray-700 leading-relaxed',
  '[&_p]:my-2 [&_p]:text-[13px]',
  '[&_li]:my-1 [&_li]:text-[13px]',
  '[&_ul]:list-disc [&_ul]:my-2 [&_ul]:pl-6 [&_ul]:text-[13px]',
  '[&_ol]:list-decimal [&_ol]:my-2 [&_ol]:pl-6 [&_ol]:text-[13px]',
  '[&_li>ul]:my-1 [&_li>ol]:my-1',
  '[&_td]:text-[13px] [&_th]:text-[13px]',
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-x-auto [&_table]:text-[13px]',
  '[&_a]:text-[13px] [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-700',
  '[&_blockquote]:text-[13px]',
  '[&_p_strong]:text-[14px] [&_p_strong]:font-semibold [&_li_strong]:text-[14px] [&_li_strong]:font-semibold',
  '[&_p_em]:italic [&_li_em]:italic',
  '[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-[14px] [&_h1]:font-semibold [&_h1]:leading-snug [&_h1]:text-[var(--brand-ink)]',
  '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:text-[var(--brand-ink)]',
  '[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-[var(--brand-ink)]',
  '[&_h4]:mb-2 [&_h4]:mt-3 [&_h4]:text-[14px] [&_h4]:font-semibold [&_h4]:leading-snug [&_h4]:text-[var(--brand-ink)]',
  '[&_h5]:mb-1 [&_h5]:mt-2 [&_h5]:text-[14px] [&_h5]:font-semibold [&_h5]:leading-snug [&_h5]:text-[var(--brand-ink)]',
  '[&_h6]:mb-1 [&_h6]:mt-2 [&_h6]:text-[14px] [&_h6]:font-semibold [&_h6]:leading-snug [&_h6]:text-[var(--brand-ink)]',
  '[&_img]:mx-auto [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg',
  '[&_hr]:my-5 [&_hr]:border-gray-200',
  '[&_th]:border [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:px-3 [&_td]:py-2',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-50 [&_pre]:p-3 [&_pre]:text-[13px]',
  '[&_code]:font-mono [&_code]:text-[13px]',
  '[&_p_code]:rounded [&_p_code]:bg-gray-100 [&_p_code]:px-1.5 [&_p_code]:py-0.5',
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
