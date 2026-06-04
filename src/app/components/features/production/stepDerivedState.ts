import type { MergedProductionStep } from '@/components/features/production/types';

export type StepDerivedState = 'completed' | 'active' | 'upcoming' | 'blocked' | 'rejected';

// PR/QC/SH = production กำลังดำเนินการ
const ACTIVE_ORDER_STATUSES = new Set(['PR', 'QC', 'SH']);
// WS/WA/PP/PE/WF = ยังไม่เริ่ม production
const BLOCKING_ORDER_STATUSES = new Set(['WS', 'WA', 'PP', 'PE', 'WF']);

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
    if (st === 'CD') {
      // step_id=5 (จัดส่งสำเร็จ) ถือว่าเสร็จก็ต่อเมื่อ order.status = CP เท่านั้น
      if (m.template.step_id === 5 && ostatus !== 'CP') return 'active';
      return 'completed';
    }
    if (st === 'IP') return 'active';
    // PD = ชำระแล้ว รอโรงงานกดยืนยันรับงาน
    // step_id=0 = "รอยืนยันรับงาน" (blocked) ไม่ใช่ "กำลังดำเนินการ"
    if (ostatus === 'PD') {
      return m.template.step_id === 0 ? 'blocked' : 'upcoming';
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
