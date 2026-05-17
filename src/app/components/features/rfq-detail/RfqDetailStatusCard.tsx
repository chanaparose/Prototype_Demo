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
};

export function RfqDetailStatusCard({
  rfq,
  isHistoryView,
  statusBadgeStyle,
  statusLabel,
}: RfqDetailStatusCardProps) {
  return (
    <div className='bg-white rounded-2xl p-4 shadow-sm'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <div
            className='w-10 h-10 rounded-xl flex items-center justify-center text-lg'
            style={{ background: 'var(--brand-page)' }}
          >
            {rfq.categoryIcon}
          </div>
          <div>
            <p className='text-[10px] text-gray-400'>{rfq.category}</p>
            <p className='text-sm' style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>
              {rfq.projectName}
            </p>
          </div>
        </div>
        <span
          className='px-2.5 py-1 rounded-full text-[10px] shrink-0'
          style={{ ...statusBadgeStyle, fontWeight: 600 }}
        >
          {statusLabel}
        </span>
      </div>
      <div className='flex gap-3 text-xs text-gray-500'>
        <span>{formatCurrency(rfq.budget)}</span>
        <span>•</span>
        <span>{formatCompactNumber(rfq.quantity)} ชิ้น</span>
      </div>
    </div>
  );
}
