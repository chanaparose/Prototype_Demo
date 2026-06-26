import React from 'react';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import { CategoryIcon } from '@/components/ui/category-icon';
import {
  RFQ_DETAIL_CARD_EYEBROW_CLASS,
  RFQ_DETAIL_CARD_EYEBROW_DOT_CLASS,
  RFQ_DETAIL_CARD_EYEBROW_ID_CLASS,
  RFQ_DETAIL_CARD_EYEBROW_LABEL_CLASS,
} from '@/components/features/rfq-detail/rfqDetailTheme';

export type RfqForStatusCard = {
  category: string;
  categoryIcon?: string | React.ReactNode;
  projectName: string;
  budget: number;
  quantity: number;
  unitName?: string;
  material: string;
  status: string;
  offerCount: number;
};

type RfqDetailStatusCardProps = {
  rfq: RfqForStatusCard;
  rfqId?: string;
  isHistoryView: boolean;
  statusBadgeStyle: { background: string; color: string };
  statusLabel: string;
  footer?: React.ReactNode;
};

export function RfqDetailStatusCard({
  rfq,
  rfqId,
  isHistoryView: _isHistoryView,
  statusBadgeStyle,
  statusLabel,
  footer,
}: RfqDetailStatusCardProps) {
  return (
    <div className='rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm'>
      {rfqId ? (
        <p className={RFQ_DETAIL_CARD_EYEBROW_CLASS}>
          <span className={RFQ_DETAIL_CARD_EYEBROW_LABEL_CLASS}>คำขอราคา</span>
          <span className={RFQ_DETAIL_CARD_EYEBROW_DOT_CLASS}>·</span>
          <span className={RFQ_DETAIL_CARD_EYEBROW_ID_CLASS}>RFQ-{rfqId}</span>
        </p>
      ) : null}
      <div className='mb-3 flex items-start justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-[var(--brand-page)]/50 text-lg'>
            <CategoryIcon value={rfq.categoryIcon} className='text-brand-violet-deep' />
          </div>
          <div className='min-w-0'>
            <p className='truncate text-[10px] text-slate-500'>{rfq.category}</p>
            <p className='truncate text-[14px] font-bold text-brand-navy-ink'>{rfq.projectName}</p>
          </div>
        </div>
        <span
          className='shrink-0 rounded-full border border-slate-200/80 px-2.5 py-1 text-[10px] font-bold'
          style={statusBadgeStyle}
        >
          {statusLabel}
        </span>
      </div>

      <div className='grid grid-cols-2 gap-3 border-t border-slate-100 pt-3'>
        <div>
          <p className={RFQ_STAT_LABEL_CLASS}>งบประมาณ</p>
          <p className={RFQ_STAT_VALUE_CLASS}>{formatCurrency(rfq.budget)}</p>
        </div>
        <div>
          <p className={RFQ_STAT_LABEL_CLASS}>จำนวน</p>
          <p className={RFQ_STAT_VALUE_CLASS}>
            {formatCompactNumber(rfq.quantity)} {rfq.unitName || 'ชิ้น'}
          </p>
        </div>
      </div>

      {footer ? <div className='mt-3 border-t border-slate-100 pt-3'>{footer}</div> : null}
    </div>
  );
}

const RFQ_STAT_LABEL_CLASS =
  'text-[10px] font-medium uppercase tracking-wide text-slate-400';
const RFQ_STAT_VALUE_CLASS = 'mt-0.5 text-[13px] font-semibold text-brand-navy-ink';
