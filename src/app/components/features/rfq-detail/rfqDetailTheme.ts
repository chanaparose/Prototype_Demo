/** Re-export chrome tokens shared with /orders list for visual continuity. */
export {
  factoryIdeasChromeGradientClass as rfqDetailChromeGradientClass,
  factoryIdeasContentSurfaceClass as rfqDetailContentSurfaceClass,
} from '@/components/features/factory-ideas/factoryIdeasTheme';

export const RFQ_DETAIL_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-wider text-brand-violet-deep/55';

export const RFQ_DETAIL_SUB_HEADER_ROW_CLASS =
  'mt-2 mb-2 flex min-w-0 items-center gap-1.5';

export const RFQ_DETAIL_BACK_BUTTON_CLASS =
  '-ml-1 inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-brand-purple active:opacity-70';

export const RFQ_DETAIL_CARD_EYEBROW_CLASS =
  'mb-2.5 truncate text-[13px] font-semibold leading-tight text-brand-navy-ink';

export const RFQ_DETAIL_CARD_EYEBROW_LABEL_CLASS = 'text-brand-violet-deep/85';

export const RFQ_DETAIL_CARD_EYEBROW_DOT_CLASS = 'mx-1 font-normal text-slate-300';

export const RFQ_DETAIL_CARD_EYEBROW_ID_CLASS = 'font-semibold text-brand-navy-ink';

/** Tab chrome — subtle brand tint on the bar. */
export const RFQ_DETAIL_TAB_LIST_CLASS =
  'grid grid-cols-2 border-b border-brand-purple/12 bg-gradient-to-b from-white via-white to-[var(--brand-page)]/35';

export const RFQ_DETAIL_TAB_ACTIVE_CLASS = 'text-brand-violet-deep';

export const RFQ_DETAIL_TAB_IDLE_CLASS =
  'text-slate-500 hover:bg-[var(--brand-page)]/50 hover:text-brand-violet-deep/85';

export const RFQ_DETAIL_TAB_ICON_ACTIVE_CLASS = 'text-brand-purple';

export const RFQ_DETAIL_TAB_ICON_IDLE_CLASS = 'text-slate-400';

export const RFQ_DETAIL_TAB_INDICATOR_CLASS =
  'absolute inset-x-3 bottom-[-1px] h-0.5 rounded-full bg-gradient-to-r from-brand-purple/70 via-brand-violet-deep to-brand-purple/70';

/** Spec rows (mobile bare). */
export const RFQ_DETAIL_SPEC_LABEL_CLASS = 'text-[13px] text-slate-400';

export const RFQ_DETAIL_SPEC_VALUE_CLASS = 'text-[13px] font-semibold text-right text-brand-navy-ink';

export const RFQ_DETAIL_SPEC_DIVIDER_CLASS = 'border-brand-purple/8';

export const RFQ_DETAIL_SPEC_NOTE_TEXT_CLASS = 'text-[13px] leading-relaxed text-brand-navy-ink/90';

/** Desktop offers comparison table — compact density */
export const RFQ_COMPARE_TABLE_WRAPPER_CLASS =
  'overflow-hidden rounded-lg border border-brand-purple/10 bg-white';

export const RFQ_COMPARE_TABLE_SCROLL_CLASS = 'overflow-x-auto';

export const RFQ_COMPARE_CORNER_HEADER_CLASS =
  'sticky left-0 z-20 w-[132px] min-w-[132px] border-b border-r border-brand-purple/10 bg-slate-50/90 px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500';

export const RFQ_COMPARE_FACTORY_HEADER_CLASS =
  'border-b border-brand-purple/10 bg-slate-50/90 px-2 py-2 align-middle';

export const RFQ_COMPARE_RECOMMENDED_HEADER_CLASS =
  'border-b border-brand-purple/20 bg-brand-lavender-chip/55 px-2 py-2 align-middle ring-1 ring-inset ring-brand-purple/15';

export const RFQ_COMPARE_RECOMMENDED_COL_CLASS = 'bg-brand-lavender-chip/28';

export const RFQ_COMPARE_LABEL_STICKY_CLASS =
  'sticky left-0 z-10 w-[132px] min-w-[132px] border-r border-brand-purple/8 bg-slate-50/70 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-500 shadow-[3px_0_6px_-3px_rgba(74,38,125,0.06)]';

export const RFQ_COMPARE_SECTION_ROW_CLASS = 'bg-brand-lavender-chip/25';

export const RFQ_COMPARE_SECTION_TOGGLE_CLASS =
  'flex w-full items-center gap-1.5 border-0 bg-transparent px-2.5 py-1 text-left text-[10px] font-bold uppercase tracking-wider text-brand-violet-deep/70 hover:text-brand-violet-deep';

export const RFQ_COMPARE_BEST_CELL_CLASS =
  'bg-emerald-50/80 ring-1 ring-inset ring-emerald-200/60';

export const RFQ_COMPARE_HIGHLIGHT_ROW_LABEL_CLASS =
  'sticky left-0 z-10 border-r border-brand-purple/8 bg-slate-50/70 px-2.5 py-2 text-left text-[11px] font-medium text-slate-500 shadow-[3px_0_6px_-3px_rgba(74,38,125,0.06)]';

export const RFQ_COMPARE_ACTIONS_ROW_CLASS = 'border-t border-brand-purple/10 bg-slate-50/40';
