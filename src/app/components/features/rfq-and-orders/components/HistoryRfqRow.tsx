import { Link } from 'react-router';
import { FileText, Calendar, Factory, ChevronRight } from 'lucide-react';
import { RFQ_STATUS_DISPLAY } from '@/components/features/rfq-and-orders/constants';
import { formatDate } from '@/components/features/rfq-and-orders/utils';
import { type Rfq } from '@/stores/types';

export function HistoryRfqRow({ rfq }: { rfq: Rfq }) {
  const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
    label: rfq.status,
    color: 'var(--neutral-subtle)',
    bg: 'var(--neutral-muted)',
  };
  const totalOffers = rfq.offers?.length || rfq.offerCount || 0;

  return (
    <Link to={`/rfqs/${rfq.id}`} className='block group'>
      <div className='flex items-center justify-between rounded-xl border border-[rgba(196,164,132,0.4)] bg-white/80 px-3 py-3 transition-all hover:bg-white'>
        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--neutral-muted)] text-sm'>
            {rfq.categoryIcon ?? <FileText size={14} className='text-gray-400' />}
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-gray-700 truncate'>{rfq.projectName}</p>
            <p className='text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5'>
              <Calendar size={9} />
              {formatDate(rfq.createdAt)}
              {totalOffers > 0 && (
                <>
                  <span className='text-gray-300'>·</span>
                  <Factory size={9} />
                  {totalOffers} โรงงาน
                </>
              )}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2 shrink-0 ml-2'>
          <span
            className='text-[10px] font-bold px-2 py-0.5 rounded-full'
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
          <ChevronRight
            size={13}
            className='text-gray-300 group-hover:text-gray-500 transition-colors'
          />
        </div>
      </div>
    </Link>
  );
}
