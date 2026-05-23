import type { ProductionLockContext } from '@/components/features/production/types';
import type { LockReason } from '@/pages/order-detail/getOrderUiMode';
import { getOrderUiMode } from '@/pages/order-detail/getOrderUiMode';
import { asRecord, type ApiRecord } from '@/lib/apiShape';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

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

export { orderStatusLabelTh } from '@/domain/order/constants';

export function parsePaymentSchedule(row: ApiRecord): PaymentScheduleItem[] {
  const raw = row.payment_schedule;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((x) => {
      const r = asRecord(x);
      return {
        stage: pickScalarString(r.stage).toUpperCase(),
        percent: pickScalarNumber(r.percent) ?? 0,
        amount: pickScalarNumber(r.amount) ?? 0,
        status: (pickScalarString(r.status) || 'LOCKED').toUpperCase(),
        due_date: r.due_date != null ? pickScalarString(r.due_date) : null,
        paid_at: r.paid_at != null ? pickScalarString(r.paid_at) : null,
        triggered_by_step:
          r.triggered_by_step != null ? pickScalarString(r.triggered_by_step) : null,
      };
    });
  }

  const total = pickScalarNumber(row.total_amount) ?? 0;
  if (!Number.isFinite(total) || total <= 0) return [];

  const apiSt = pickScalarString(row.status).toUpperCase();
  const paid = apiSt !== 'PP' && apiSt !== 'PE';
  const overdue = apiSt === 'PE';
  const due = row.deposit_due_date != null ? pickScalarString(row.deposit_due_date) : null;

  // ชำระเต็มจำนวนล่วงหน้า 100% (stage เดียว)
  return [
    {
      stage: 'FULL_PAYMENT',
      percent: 100,
      amount: total,
      status: overdue ? 'OVERDUE' : paid ? 'PAID' : 'PENDING',
      due_date: due,
      paid_at: paid ? pickScalarString(row.updated_at, row.created_at) || null : null,
      triggered_by_step: null,
    },
  ];
}

export function parseNextAction(
  row: ApiRecord,
  orderId: string,
  apiStatus: string,
): NextAction | null {
  const na = row.next_action;
  if (na && typeof na === 'object' && !Array.isArray(na)) {
    const o = asRecord(na);
    if (o.type === 'NONE' || o.type === null) return null;
    return {
      actor: pickScalarString(o.actor) || 'CUSTOMER',
      type: pickScalarString(o.type) || 'NONE',
      amount: pickScalarNumber(o.amount) ?? 0,
      currency: pickScalarString(o.currency) || 'THB',
      due_date: pickScalarString(o.due_date),
      cta_url: pickScalarString(o.cta_url) || `/orders/${orderId}/payment?stage=full`,
      cta_label_th: pickScalarString(o.cta_label_th) || 'ชำระเงินเต็มจำนวน',
    };
  }

  const u = pickScalarString(apiStatus).toUpperCase();
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
  row: ApiRecord,
  schedule: PaymentScheduleItem[],
): ProductionLockContext {
  const fullPay = schedule.find((s) => s.stage === 'FULL_PAYMENT' || s.stage === 'DEPOSIT');
  const amount =
    fullPay?.amount ?? pickScalarNumber(row.total_amount, row.deposit_amount) ?? 0;
  const deposit_due_date =
    (fullPay?.due_date ??
      (row.deposit_due_date != null ? pickScalarString(row.deposit_due_date) : '')) ||
    '';
  return {
    deposit_amount: amount,
    deposit_currency: 'THB',
    deposit_due_date: deposit_due_date || undefined,
    deposit_percent: fullPay?.percent ?? 100,
    payment_url: `/orders/${orderId}/payment?stage=full`,
  };
}

export function normalizeLockReason(fromApi: string | undefined, apiStatus: string): LockReason {
  const r = pickScalarString(fromApi).toUpperCase();
  if (r === 'PENDING_DEPOSIT' || r === 'DEPOSIT_EXPIRED' || r === 'ORDER_CANCELLED') {
    return r as LockReason;
  }
  return getOrderUiMode(apiStatus).lockReason ?? 'UNKNOWN';
}
