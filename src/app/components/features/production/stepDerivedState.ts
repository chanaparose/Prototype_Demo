import type { MergedProductionStep } from '@/components/features/production/types';

export type StepDerivedState = 'completed' | 'active' | 'upcoming' | 'blocked' | 'rejected';

const ACTIVE_ORDER_STATUSES = new Set(['PR', 'QC', 'SH']);
const BLOCKING_ORDER_STATUSES = new Set(['PP', 'PE', 'WF']);

/**
 * Derive per-row UI state from the (status, order_status, position) triple.
 *
 * Invariant: while the order is in an active production status, exactly one row
 * is 'active' (or 'blocked') — never zero. This guarantees the customer always
 * sees where they are, even when BE has not yet written an IP row for step 1.
 */
export function deriveStepStates(
  merged: MergedProductionStep[],
  orderStatus: string | undefined,
): StepDerivedState[] {
  const ostatus = (orderStatus ?? '').toUpperCase();
  const isActiveOrder = ACTIVE_ORDER_STATUSES.has(ostatus);
  const isBlockingOrder = BLOCKING_ORDER_STATUSES.has(ostatus);

  const hasAnyIp = merged.some((m) => m.update.status === 'IP');
  const firstPdIdx = merged.findIndex((m) => m.update.status === 'PD');

  return merged.map((m, i) => {
    const st = m.update.status;
    if (st === 'RJ') return 'rejected';
    if (st === 'CD') return 'completed';
    if (st === 'IP') return 'active';
    // PD branch — promote the first PD to active/blocked when order is live
    const isFirstPd = i === firstPdIdx;
    if (!hasAnyIp && isFirstPd) {
      if (isActiveOrder) return 'active';
      if (isBlockingOrder) return 'blocked';
    }
    return 'upcoming';
  });
}

export interface StepVisualConfig {
  ariaLabel: string;
  chipLabel: string | null;
  chipClass: string;
}

/** Labels + chip colors for each derived state (pure presentational). */
export const STEP_VISUAL: Record<StepDerivedState, StepVisualConfig> = {
  completed: {
    ariaLabel: 'สถานะ: เสร็จแล้ว',
    chipLabel: 'เสร็จแล้ว',
    chipClass: 'bg-emerald-50 text-emerald-700',
  },
  active: {
    ariaLabel: 'สถานะ: กำลังดำเนินการ',
    chipLabel: 'กำลังดำเนินการ',
    chipClass: 'bg-violet-100 text-violet-800',
  },
  upcoming: {
    ariaLabel: 'ยังไม่ถึงขั้นตอนนี้',
    chipLabel: null,
    chipClass: '',
  },
  blocked: {
    ariaLabel: 'สถานะ: รอดำเนินการ',
    chipLabel: 'รอดำเนินการ',
    chipClass: 'bg-amber-100 text-amber-800',
  },
  rejected: {
    ariaLabel: 'สถานะ: ต้องแก้ไข',
    chipLabel: 'ต้องแก้ไข',
    chipClass: 'bg-red-100 text-red-800',
  },
};
