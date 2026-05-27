import { Link } from 'react-router';
import { FileText, Calendar, Factory, ChevronRight, Layers } from 'lucide-react';
import {
  PRIMARY_BG,
  PRIMARY_COLOR,
  BORDER_WARM,
  RFQ_STATUS_DISPLAY,
} from '@/components/features/rfq-and-orders/constants';
import {
  formatBudget,
  formatDate,
  getRfqActivityCounts,
} from '@/components/features/rfq-and-orders/utils';
import { type Rfq } from '@/stores/types';

export function ActiveRfqCard({ rfq, idx }: { rfq: Rfq; idx: number }) {
  const { totalOffers, accepted, pending } = getRfqActivityCounts(rfq);
  const remaining = Math.max(totalOffers - accepted, 0);
  const ib = PRIMARY_BG;
  const ic = PRIMARY_COLOR;

  const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
    label: rfq.status,
    color: 'var(--neutral-subtle)',
    bg: 'var(--neutral-muted)',
  };
  const hasNewOffers = pending > 0;

  return (
    <Link to={`/rfqs/${rfq.id}`} className='block group'>
      <div
        className='rounded-2xl border bg-white px-4 py-3.5 transition-colors group-hover:border-[var(--brand-lavender-muted)] active:scale-[0.99]'
        style={{
          borderColor: BORDER_WARM,
        }}
      >
        <div className='flex items-start justify-between gap-2 mb-3'>
          <div className='flex gap-3 min-w-0 flex-1'>
            <div
              className='w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg'
              style={{ background: ib }}
            >
              {rfq.categoryIcon ?? <Layers size={20} style={{ color: ic }} />}
            </div>
            <div className='min-w-0 flex-1'>
              <p
                className='text-[10px] mb-0.5 font-semibold'
                style={{ color: 'var(--neutral-subtle)' }}
              >
                {rfq.category}
              </p>
              <h3 className='text-gray-900 font-bold text-sm leading-tight truncate'>
                {rfq.projectName}
              </h3>
            </div>
          </div>
          <span className='shrink-0 rounded-full bg-[var(--brand-lavender)] px-3 py-1 text-[11px] font-bold text-[var(--brand-purple)]'>
            {statusCfg.label}
          </span>
        </div>

        {totalOffers === 0 ? (
          <div className='mb-3 flex items-center gap-2 rounded-xl bg-[var(--neutral-warm-surface)] px-3 py-2'>
            <Factory size={13} className='text-gray-300 shrink-0' />
            <span className='text-xs text-gray-400'>ยังไม่มีโรงงานตอบรับ</span>
          </div>
        ) : (
          <div className='mb-3'>
            <div className='flex items-center gap-2 mb-2 flex-wrap'>
              <span className='inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-lavender)] px-2.5 py-1 text-xs font-bold text-[var(--brand-purple)]'>
                <Factory size={11} />
                {totalOffers} โรงงานตอบแล้ว
              </span>
            </div>
            <div className='text-[11px] text-[var(--neutral-subtle)] flex items-center gap-2'>
              <span>
                ตอบรับแล้ว <span className='font-bold text-emerald-700'>{accepted}</span>
              </span>
              <span className='text-gray-300'>|</span>
              <span>
                ข้อเสนอคงเหลือ <span className='font-bold text-gray-700'>{remaining}</span>
              </span>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between border-t border-[var(--brand-lavender-muted)] pt-2.5 text-xs'>
          <div className='flex items-center gap-3 text-[var(--neutral-subtle)]'>
            <span className='flex items-center gap-1'>
              <FileText size={11} className='text-gray-300' />
              {formatBudget(rfq.budget)}
            </span>
            <span className='flex items-center gap-1'>
              <Calendar size={11} className='text-gray-300' />
              {formatDate(rfq.createdAt)}
            </span>
          </div>
          <span
            className='flex items-center gap-0.5 font-semibold'
            style={{ color: 'var(--brand-indigo)' }}
          >
            {totalOffers > 0 ? 'ดูใบเสนอราคา' : 'รายละเอียด'}
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
