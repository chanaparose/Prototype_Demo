import React from 'react';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';

export type RfqForStatusCard = {
  category: string;
  categoryIcon?: string | React.ReactNode;
  projectName: string;
  budget: number;
  quantity: number;
  material: string;
  status: string;
  offerCount: number;
};

type RfqDetailStatusCardProps = {
  rfq: RfqForStatusCard;
  isHistoryView: boolean;
  statusBadgeStyle: { background: string; color: string };
  statusLabel: string;
  footer?: React.ReactNode;
};

export function RfqDetailStatusCard({
  rfq,
  isHistoryView: _isHistoryView,
  statusBadgeStyle,
  statusLabel,
  footer,
}: RfqDetailStatusCardProps) {
  return (
    <div className='rounded-2xl p-4 border border-violet-200 bg-gradient-to-br from-white via-violet-50/70 to-indigo-50/50 shadow-[0_8px_24px_rgba(124,58,237,0.12)]'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <div
            className='w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-violet-200'
            style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F3EEFF 100%)' }}
          >
            {rfq.categoryIcon}
          </div>
          <div>
            <p className='text-[10px] text-slate-500'>{rfq.category}</p>
            <p className='text-sm' style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>
              {rfq.projectName}
            </p>
          </div>
        </div>
        <span
          className='px-2.5 py-1 rounded-full text-[10px] shrink-0 border border-violet-200'
          style={{ ...statusBadgeStyle, fontWeight: 700 }}
        >
          {statusLabel}
        </span>
      </div>
      <div className='flex items-center gap-3 text-xs text-slate-600'>
        <span className='font-semibold text-slate-700'>{formatCurrency(rfq.budget)}</span>
        <span className='text-violet-300'>•</span>
        <span className='font-semibold text-slate-700'>{formatCompactNumber(rfq.quantity)} ชิ้น</span>
      </div>
      {footer ? <div className='mt-3 pt-3 border-t border-violet-100'>{footer}</div> : null}
    </div>
  );
}
