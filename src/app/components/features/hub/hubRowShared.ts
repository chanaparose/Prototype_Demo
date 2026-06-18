export const HUB_SCOPE_LABELS: Record<string, string> = {
  PD: 'โรงงานรับผลิต',
  MT: 'วัตถุดิบ',
};

export type HubScope = 'PD' | 'MT';

export const VISIBLE_CARDS_MOBILE = 4;
export const VISIBLE_CARDS_DESKTOP = 5;
/** แถว desktop ออกรับสูงสุด 5 หมวด + การ์ดดูครบ = 6 ช่อง */
export const DESKTOP_ROW_SLOTS = 6;

export const hubRowCardClass =
  'flex h-[104px] w-[108px] shrink-0 flex-col overflow-hidden rounded-xl p-3 text-left lg:h-[118px] lg:w-[calc((100%-3.75rem)/6)] lg:flex-none';

/** Single frosted layer — header + card row share the same fill (no nested opacity). */
export const hubSectionShellClass =
  'overflow-hidden rounded-[1.35rem] border border-white/65 bg-white/[0.52] shadow-[0_18px_55px_rgba(46,34,82,0.11)] backdrop-blur-xl ring-1 ring-white/35';

export const hubSectionDividerClass = 'border-t border-white/45';

export function getHubRowVisibleCount(categoryCount: number, isLgUp: boolean) {
  const maxCategories = isLgUp ? VISIBLE_CARDS_DESKTOP : VISIBLE_CARDS_MOBILE;
  if (categoryCount <= maxCategories) return categoryCount;
  return maxCategories;
}
