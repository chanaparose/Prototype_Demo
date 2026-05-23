export type ShowcaseType = 'PD' | 'PM' | 'ID' | 'MT';
export type ShowcaseScope = 'PD' | 'MT';
export type ShowcaseStatus = 'DR' | 'AC' | 'HI' | 'AR';
export type ShowcaseSubmitStatus = 'DR' | 'AC';

export const SHOWCASE_TYPES = ['PD', 'PM', 'ID', 'MT'] as const satisfies readonly ShowcaseType[];
export const SHOWCASE_SCOPES = ['PD', 'MT'] as const satisfies readonly ShowcaseScope[];
export const SHOWCASE_STATUSES = ['DR', 'AC', 'HI', 'AR'] as const satisfies readonly ShowcaseStatus[];

export const DEFAULT_SHOWCASE_TYPE: ShowcaseType = 'PD';
export const DEFAULT_SHOWCASE_STATUS: ShowcaseStatus = 'DR';

export const SHOWCASE_TYPE_META: Record<
  ShowcaseType,
  { icon: string; label: string; sublabel: string; badgeClass: string }
> = {
  PD: {
    icon: '🏷',
    label: 'สินค้า',
    sublabel: 'Product Design',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  PM: {
    icon: '🎁',
    label: 'โปรโมชัน',
    sublabel: 'Promotion',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  ID: {
    icon: '💡',
    label: 'ไอเดีย',
    sublabel: 'Industrial Design',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  MT: {
    icon: '🧱',
    label: 'วัตถุดิบ',
    sublabel: 'Materials',
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
  },
};

export const SHOWCASE_LIST_TAB_META: Record<
  ShowcaseType,
  { icon: string; label: string; btnLabel: string; empty: string }
> = {
  PD: { icon: '🏷', label: 'สินค้า', btnLabel: 'เพิ่มสินค้า', empty: 'ยังไม่มีสินค้า' },
  PM: { icon: '🎁', label: 'โปรโมชัน', btnLabel: 'เพิ่มโปรโมชัน', empty: 'ยังไม่มีโปรโมชัน' },
  ID: { icon: '💡', label: 'ไอเดีย', btnLabel: 'เพิ่มไอเดีย', empty: 'ยังไม่มีไอเดีย' },
  MT: { icon: '🧱', label: 'วัตถุดิบ', btnLabel: 'เพิ่มวัตถุดิบ', empty: 'ยังไม่มีวัตถุดิบ' },
};

export const SHOWCASE_STATUS_META: Record<ShowcaseStatus, { label: string; bg: string; color: string }> = {
  DR: { label: 'ร่าง', bg: 'rgba(107,114,128,0.12)', color: 'var(--neutral-subtle)' },
  AC: { label: 'Active', bg: 'rgba(16,185,129,0.12)', color: 'var(--status-success)' },
  HI: { label: 'ซ่อน', bg: 'rgba(245,158,11,0.12)', color: 'var(--status-warning-deep)' },
  AR: { label: 'Archived', bg: 'rgba(107,114,128,0.10)', color: 'var(--neutral-placeholder)' },
};

export function normalizeShowcaseType(value: unknown): ShowcaseType {
  const type = String(value ?? '').toUpperCase();
  return SHOWCASE_TYPES.includes(type as ShowcaseType)
    ? (type as ShowcaseType)
    : DEFAULT_SHOWCASE_TYPE;
}

export function normalizeShowcaseStatus(value: unknown): ShowcaseStatus {
  const status = String(value ?? '').toUpperCase();
  return SHOWCASE_STATUSES.includes(status as ShowcaseStatus)
    ? (status as ShowcaseStatus)
    : DEFAULT_SHOWCASE_STATUS;
}
