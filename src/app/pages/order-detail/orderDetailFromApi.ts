import type { ProductionLockContext } from '../../components/features/production/types';
import type { LockReason } from './getOrderUiMode';
import { getOrderUiMode } from './getOrderUiMode';

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

export const ORDER_API_STATUS_LABEL_TH: Record<string, string> = {
  PP: 'รอชำระมัดจำ',
  PE: 'หมดกำหนดชำระ',
  PD: 'ชำระมัดจำแล้ว',
  PR: 'กำลังผลิต',
  QC: 'ตรวจสอบคุณภาพ',
  SH: 'จัดส่งแล้ว',
  CP: 'เสร็จสิ้น',
  CN: 'ยกเลิก',
  WF: 'รอดำเนินการ',
};

export function orderStatusLabelTh(apiStatus: string, statusLabelFromApi?: string): string {
  const fromApi = statusLabelFromApi?.trim();
  if (fromApi) return fromApi;
  const u = String(apiStatus ?? '').toUpperCase();
  return ORDER_API_STATUS_LABEL_TH[u] ?? 'คำสั่งซื้อ';
}

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
  const dep = Number(row.deposit_amount ?? 0);
  if (!Number.isFinite(total) || total <= 0) return [];

  const apiSt = String(row.status ?? '').toUpperCase();
  const depositPaid = apiSt !== 'PP' && apiSt !== 'PE';
  const d1 = dep > 0 ? dep : Math.round(total * 0.3);
  const d2 = Math.max(0, Math.round((total - d1) * (40 / 70)));
  const d3 = Math.max(0, total - d1 - d2);
  const due = row.deposit_due_date != null ? String(row.deposit_due_date) : null;

  return [
    {
      stage: 'DEPOSIT',
      percent: Math.round((d1 / total) * 100) || 30,
      amount: d1,
      status: depositPaid ? 'PAID' : 'PENDING',
      due_date: due,
      paid_at: depositPaid ? String(row.updated_at ?? row.created_at ?? '') || null : null,
      triggered_by_step: null,
    },
    {
      stage: 'PRODUCTION',
      percent: Math.round((d2 / total) * 100) || 40,
      amount: d2,
      status: 'LOCKED',
      due_date: null,
      paid_at: null,
      triggered_by_step: 'PRODUCTION',
    },
    {
      stage: 'DELIVERY',
      percent: Math.round((d3 / total) * 100) || 30,
      amount: d3,
      status: 'LOCKED',
      due_date: null,
      paid_at: null,
      triggered_by_step: 'READY_TO_SHIP',
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
      cta_url: String(o.cta_url ?? `/orders/${orderId}/payment?stage=deposit`),
      cta_label_th: String(o.cta_label_th ?? 'ชำระเงินมัดจำ'),
    };
  }

  const u = String(apiStatus ?? '').toUpperCase();
  if (u !== 'PP' && u !== 'PE') return null;
  const sched = parsePaymentSchedule(row);
  const dep = sched.find((s) => s.stage === 'DEPOSIT');
  if (!dep) return null;
  const due = dep.due_date ?? '';
  return {
    actor: 'CUSTOMER',
    type: 'PAY_DEPOSIT',
    amount: dep.amount,
    currency: 'THB',
    due_date: due,
    cta_url: `/orders/${orderId}/payment?stage=deposit`,
    cta_label_th: 'ชำระเงินมัดจำ',
  };
}

export function buildFallbackLockContext(
  orderId: string,
  row: Record<string, unknown>,
  schedule: PaymentScheduleItem[],
): ProductionLockContext {
  const dep = schedule.find((s) => s.stage === 'DEPOSIT');
  const amount = (dep?.amount ?? Number(row.deposit_amount ?? 0)) || 0;
  const deposit_due_date =
    (dep?.due_date ?? (row.deposit_due_date != null ? String(row.deposit_due_date) : '')) || '';
  return {
    deposit_amount: amount,
    deposit_currency: 'THB',
    deposit_due_date: deposit_due_date || undefined,
    deposit_percent: dep?.percent,
    payment_url: `/orders/${orderId}/payment?stage=deposit`,
  };
}

export function normalizeLockReason(
  fromApi: string | undefined,
  apiStatus: string,
): LockReason {
  const r = String(fromApi ?? '').toUpperCase();
  if (r === 'PENDING_DEPOSIT' || r === 'DEPOSIT_EXPIRED' || r === 'ORDER_CANCELLED') {
    return r as LockReason;
  }
  return getOrderUiMode(apiStatus).lockReason ?? 'UNKNOWN';
}
