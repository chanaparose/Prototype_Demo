import type { ProductionLockContext } from '@/components/features/production/types';
import type { LockReason } from '@/pages/order-detail/getOrderUiMode';
import { getOrderUiMode } from '@/pages/order-detail/getOrderUiMode';

export type NextAction = {
  actor: string;
  type: string;
  amount: number;
  currency: string;
  due_date: string;
  cta_url: string;
  cta_label_th: string;
};

export type PaymentScheduleItem = {
  stage: string;
  percent: number;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  triggered_by_step: string | null;
};

export { ORDER_API_STATUS_LABEL_TH, orderStatusLabelTh } from '@/domain/order/constants';

export function parsePaymentSchedule(row: Record<string, unknown>): PaymentScheduleItem[] {
  const raw = row.payment_schedule;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((x) => {
      const r = x as Record<string, unknown>;
      return {
        stage: String(r.stage ?? '').toUpperCase(),
        percent: Number(r.percent ?? 0) || 0,
        amount: Number(r.amount ?? 0) || 0,
        status: String(r.status ?? 'LOCKED').toUpperCase(),
        due_date: r.due_date != null ? String(r.due_date) : null,
        paid_at: r.paid_at != null ? String(r.paid_at) : null,
        triggered_by_step: r.triggered_by_step != null ? String(r.triggered_by_step) : null,
      };
    });
  }

  const total = Number(row.total_amount ?? 0);
  if (!Number.isFinite(total) || total <= 0) return [];

  const apiSt = String(row.status ?? '').toUpperCase();
  const paid = apiSt !== 'PP' && apiSt !== 'PE';
  const overdue = apiSt === 'PE';
  const due = row.deposit_due_date != null ? String(row.deposit_due_date) : null;

  // Business rule: 100% upfront payment — single FULL_PAYMENT stage.
  return [
    {
      stage: 'FULL_PAYMENT',
      percent: 100,
      amount: total,
      status: overdue ? 'OVERDUE' : paid ? 'PAID' : 'PENDING',
      due_date: due,
      paid_at: paid ? String(row.updated_at ?? row.created_at ?? '') || null : null,
      triggered_by_step: null,
    },
  ];
}

export function parseNextAction(
  row: Record<string, unknown>,
  orderId: string,
  apiStatus: string,
): NextAction | null {
  const na = row.next_action;
  if (na && typeof na === 'object' && !Array.isArray(na)) {
    const o = na as Record<string, unknown>;
    if (o.type === 'NONE' || o.type === null) return null;
    return {
      actor: String(o.actor ?? 'CUSTOMER'),
      type: String(o.type ?? 'NONE'),
      amount: Number(o.amount ?? 0) || 0,
      currency: String(o.currency ?? 'THB'),
      due_date: String(o.due_date ?? ''),
      cta_url: String(o.cta_url ?? `/orders/${orderId}/payment?stage=full`),
      cta_label_th: String(o.cta_label_th ?? 'ชำระเงินเต็มจำนวน'),
    };
  }

  const u = String(apiStatus ?? '').toUpperCase();
  if (u !== 'PP' && u !== 'PE') return null;
  const sched = parsePaymentSchedule(row);
  const fullPay = sched.find((s) => s.stage === 'FULL_PAYMENT' || s.stage === 'DEPOSIT');
  if (!fullPay) return null;
  const due = fullPay.due_date ?? '';
  return {
    actor: 'CUSTOMER',
    type: 'PAY_FULL_AMOUNT',
    amount: fullPay.amount,
    currency: 'THB',
    due_date: due,
    cta_url: `/orders/${orderId}/payment?stage=full`,
    cta_label_th: 'ชำระเงินเต็มจำนวน',
  };
}

export function buildFallbackLockContext(
  orderId: string,
  row: Record<string, unknown>,
  schedule: PaymentScheduleItem[],
): ProductionLockContext {
  const fullPay = schedule.find((s) => s.stage === 'FULL_PAYMENT' || s.stage === 'DEPOSIT');
  const amount = (fullPay?.amount ?? Number(row.total_amount ?? row.deposit_amount ?? 0)) || 0;
  const deposit_due_date =
    (fullPay?.due_date ?? (row.deposit_due_date != null ? String(row.deposit_due_date) : '')) || '';
  return {
    deposit_amount: amount,
    deposit_currency: 'THB',
    deposit_due_date: deposit_due_date || undefined,
    deposit_percent: fullPay?.percent ?? 100,
    payment_url: `/orders/${orderId}/payment?stage=full`,
  };
}

export function normalizeLockReason(fromApi: string | undefined, apiStatus: string): LockReason {
  const r = String(fromApi ?? '').toUpperCase();
  if (r === 'PENDING_DEPOSIT' || r === 'DEPOSIT_EXPIRED' || r === 'ORDER_CANCELLED') {
    return r as LockReason;
  }
  return getOrderUiMode(apiStatus).lockReason ?? 'UNKNOWN';
}
