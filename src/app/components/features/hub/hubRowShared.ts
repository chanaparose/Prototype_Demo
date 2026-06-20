export const HUB_SCOPE_LABELS: Record<string, string> = {
  PD: 'โรงงานรับผลิต',
  MT: 'วัตถุดิบ',
};

export type HubScope = 'PD' | 'MT';

export const VISIBLE_CARDS_MOBILE = 2;
export const VISIBLE_CARDS_DESKTOP = 5;
/** แถว desktop ออกรับสูงสุด 5 หมวด + การ์ดดูครบ = 6 ช่อง */
export const DESKTOP_ROW_SLOTS = 6;

export const hubRowCardClass =
  'flex h-[124px] w-[calc((100vw-2.5rem)/2)] shrink-0 flex-col overflow-hidden rounded-xl p-3 text-left lg:h-[120px] lg:w-[calc((100%-3.125rem)/6)] lg:flex-none';

/** Lightweight section group — no parent card shell, only the category tiles are interactive. */
export const hubSectionShellClass = 'space-y-2.5';

export const hubSectionDividerClass = '';

export function getHubRowVisibleCount(categoryCount: number, isLgUp: boolean) {
  const maxCategories = isLgUp ? VISIBLE_CARDS_DESKTOP : VISIBLE_CARDS_MOBILE;
  if (categoryCount <= maxCategories) return categoryCount;
  return maxCategories;
}
