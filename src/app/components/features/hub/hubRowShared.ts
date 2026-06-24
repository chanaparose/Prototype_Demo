export const HUB_SCOPE_LABELS: Record<string, string> = {
  PD: 'โรงงานรับผลิต',
  MT: 'วัตถุดิบ',
};

export type HubScope = 'PD' | 'MT';

export const VISIBLE_CATEGORIES_PER_HUB = 5;
/** 5 หมวด + การ์ดโรงงานในกลุ่ม = 6 ช่องต่อแถว */
export const DESKTOP_ROW_SLOTS = VISIBLE_CATEGORIES_PER_HUB + 1;

export const hubRowCardClass =
  'group flex h-[96px] w-[155px] shrink-0 flex-col rounded-lg border border-gray-100 bg-white px-2.5 py-2.5 text-left transition-colors hover:border-brand-purple/40 hover:bg-slate-50/50 active:bg-slate-50 lg:h-28 lg:w-[calc((100%-3.125rem)/6)] lg:flex-none lg:border-slate-200 lg:px-3 lg:py-3';

/** Lightweight section group — no parent card shell, only the category tiles are interactive. */
export const hubSectionShellClass = 'space-y-2.5';

export const hubSectionDividerClass = '';

export function getHubRowVisibleCount(categoryCount: number) {
  return Math.min(categoryCount, VISIBLE_CATEGORIES_PER_HUB);
}
