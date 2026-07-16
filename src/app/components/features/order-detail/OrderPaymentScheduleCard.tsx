import React from 'react';
import type { PaymentScheduleItem } from '@/pages/order-detail/orderDetailFromApi';
import type { OrderTimelineMeta } from '@/pages/order-detail/OrderDetailContext';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { WalletCards } from 'lucide-react';

function stageLabelTh(stage: string): string {
  switch (stage) {
    case 'FULL_PAYMENT':
      return 'ชำระเต็มจำนวน';
    case 'DEPOSIT':
      return 'มัดจำ';
    case 'PRODUCTION':
      return 'งวดผลิต';
    case 'DELIVERY':
      return 'งวดส่งมอบ';
    default:
      return stage;
  }
}

function statusLabelTh(status: string): string {
  switch (String(status).toUpperCase()) {
    case 'PENDING':
      return '● รอชำระ';
    case 'PAID':
      return '✓ ชำระแล้ว';
    case 'LOCKED':
      return '○ ยังไม่ถึงกำหนด';
    case 'OVERDUE':
      return '● เลยกำหนด';
    default:
      return `○ ${status}`;
  }
}

type Props = {
  schedule: PaymentScheduleItem[];
  timelineMeta?: OrderTimelineMeta;
};

function formatDateTimeTh(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderPaymentScheduleCard({ schedule, timelineMeta }: Props) {
  if (!schedule.length) return null;
  const total = schedule.reduce((s, r) => s + (Number.isFinite(r.amount) ? r.amount : 0), 0);
  const slipSubmittedAt = timelineMeta?.slipSubmittedAt;

  return (
    <div className='bg-white rounded-2xl p-4 shadow-sm border border-gray-100'>
      <p className='mb-3 flex items-center gap-1.5 text-[12px] text-gray-900' style={{ fontWeight: 600 }}>
        <WalletCards size={14} className='text-brand-mauve' />
        การชำระเงิน
      </p>
      {slipSubmittedAt ? (
        <div className='mb-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2'>
          <div className='flex items-start justify-between gap-3 text-[11px]'>
            <span className='text-slate-500'>แนบสลิปเมื่อ</span>
            <span className='text-right font-semibold text-slate-700'>
              {formatDateTimeTh(slipSubmittedAt)}
            </span>
          </div>
        </div>
      ) : null}
      <ul className='space-y-2.5'>
        {schedule.map((row) => (
          <li
            key={row.stage}
            className='flex flex-wrap items-baseline justify-between gap-2 text-[12px] border-b border-gray-50 pb-2 last:border-0 last:pb-0'
          >
            <span className='text-gray-600'>
              {stageLabelTh(row.stage)} ({row.percent}%)
            </span>
            <span className='text-gray-900 font-semibold tabular-nums'>
              {formatCurrency(row.amount)}
            </span>
            <span className='w-full text-[12px] text-gray-500 sm:w-auto sm:text-right'>
              {statusLabelTh(row.status)}
            </span>
          </li>
        ))}
      </ul>
      <div className='mt-3 pt-3 border-t border-gray-100 flex justify-between text-[12px] font-bold text-gray-900'>
        <span>รวมทั้งสิ้น</span>
        <span className='tabular-nums'>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
