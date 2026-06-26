/** Re-export chrome tokens shared with /orders list for visual continuity. */
export {
  factoryIdeasChromeGradientClass as rfqDetailChromeGradientClass,
  factoryIdeasContentSurfaceClass as rfqDetailContentSurfaceClass,
} from '@/components/features/factory-ideas/factoryIdeasTheme';

export const RFQ_DETAIL_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-wider text-brand-violet-deep/55';

export const RFQ_DETAIL_SUB_HEADER_ROW_CLASS =
  'mb-1 flex min-w-0 items-center gap-1.5';

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
