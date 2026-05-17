import type {
  DerivedCardState,
  FactoryOrderRow,
} from '@/pages/factory-portal/factory-orders/types';

function dayDiffFromNow(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - n.getTime()) / 86400000);
}

export function deriveOrderCardState(row: FactoryOrderRow, now: Date): DerivedCardState {
  const daysRemaining = dayDiffFromNow(row.estimated_delivery, now);
  const daysOverdue = daysRemaining != null && daysRemaining < 0 ? Math.abs(daysRemaining) : 0;
  const isOverdue = daysOverdue > 0 && !['CP', 'CN'].includes(row.status);
  const isNearDeadline =
    daysRemaining != null &&
    daysRemaining >= 0 &&
    daysRemaining <= 3 &&
    !isOverdue &&
    !['CP', 'CN'].includes(row.status);
  const hasRejected = row.production_summary?.has_rejected === true;
  const isStaleUpdate =
    row.status === 'PR' &&
    (!row.production_summary?.last_updated_at ||
      (() => {
        const t = new Date(row.production_summary?.last_updated_at ?? '');
        return Number.isNaN(t.getTime()) || now.getTime() - t.getTime() > 86400000;
      })());

  const s = row.production_summary;
  let primaryCta: DerivedCardState['primaryCta'] = { kind: 'view_only' };
  if (
    ['PR', 'QC'].includes(row.status) &&
    s?.current_update_status === 'IP' &&
    s.current_step_id != null
  ) {
    primaryCta = {
      kind: 'update_step',
      stepId: s.current_step_id,
      stepNameTh: s.current_step_name_th ?? 'ขั้นตอน',
    };
  } else if (
    ['PR', 'QC'].includes(row.status) &&
    !!s &&
    s.total_count > 0 &&
    s.completed_count === s.total_count
  ) {
    primaryCta = { kind: 'start_qc' };
  } else if (row.status === 'SH') {
    primaryCta = { kind: 'mark_shipped' };
  } else if (['PP', 'PE'].includes(row.status)) {
    primaryCta = { kind: 'waiting_customer' };
  }

  return {
    flags: { isOverdue, daysOverdue, isNearDeadline, hasRejected, isStaleUpdate },
    primaryCta,
  };
}
