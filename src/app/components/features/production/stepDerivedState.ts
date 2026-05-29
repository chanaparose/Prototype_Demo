import type { MergedProductionStep } from '@/components/features/production/types';

export type StepDerivedState = 'completed' | 'active' | 'upcoming' | 'blocked' | 'rejected';

// PD = ชำระแล้ว รอโรงงานยืนยันรับงาน (step_id=0 จะเป็น active)
const ACTIVE_ORDER_STATUSES = new Set(['PD', 'PR', 'QC', 'SH']);
const BLOCKING_ORDER_STATUSES = new Set(['PP', 'PE', 'WF']);

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
    // PD order status = ชำระแล้ว รอโรงงานยืนยันรับงาน (step_id=0)
    // เฉพาะ step_id=0 เท่านั้นที่ active — step อื่นยัง upcoming
    if (ostatus === 'PD') {
      return m.template.step_id === 0 ? 'active' : 'upcoming';
    }
    // PR/QC/SH: promote first PD step to active/blocked
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
