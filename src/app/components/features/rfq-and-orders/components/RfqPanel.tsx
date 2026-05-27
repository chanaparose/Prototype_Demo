import React from 'react';
import { Link } from 'react-router';
import { FileText, AlertCircle, History } from 'lucide-react';
import { BORDER_WARM } from '@/components/features/rfq-and-orders/constants';
import { type Rfq } from '@/stores/types';
import { ActiveRfqCard } from '@/components/features/rfq-and-orders/components/ActiveRfqCard';
import { HistoryRfqPopup } from './HistoryRfqPopup';

export function RfqPanel({
  rfqs,
  isMobile,
  isDesktop,
}: {
  rfqs: Rfq[];
  isMobile?: boolean;
  isDesktop?: boolean;
}) {
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const HISTORY_STATUSES = ['cancelled', 'expired', 'completed', 'closed'] as const;
  const activeRfqs = rfqs.filter((r) => !(HISTORY_STATUSES as readonly string[]).includes(r.status));
  const historyRfqs = rfqs.filter((r) => (HISTORY_STATUSES as readonly string[]).includes(r.status));

  const totalPendingReview = activeRfqs.reduce((sum, rfq) => {
    return sum + (rfq.offers ?? []).filter((o) => o.quoteStatus === 'PD').length;
  }, 0);

  return (
    <div className={isMobile ? '' : 'px-4 pb-4 pt-2'}>
      <div
        className={`mb-3 p-[5px] flex items-center justify-between ${isDesktop ? 'min-h-[56px] rounded-xl border border-[rgba(196,164,132,0.4)] bg-[#F9F8FC] px-3 py-2' : ''}`}
      >
        <div className='flex items-center gap-2.5 flex-wrap'>
          <h3 className='text-sm font-bold text-[var(--brand-navy-deep)]'>กำลังดำเนินการ</h3>
          <span className='shrink-0 rounded-md bg-[rgba(46,34,82,0.06)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-navy)] tabular-nums'>
            {activeRfqs.length} รายการ
          </span>
          {totalPendingReview > 0 && (
            <span className='flex items-center gap-1 rounded-full bg-[var(--surface-peach-mist)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-orange-vivid)]'>
              <AlertCircle size={9} />
              {totalPendingReview} รอตอบ
            </span>
          )}
        </div>
        {historyRfqs.length > 0 ? (
          <button
          type='button'
          onClick={() => setHistoryOpen(true)}
          aria-label='เปิดประวัติใบขอราคา'
          className='relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--brand-lavender-muted)] bg-white text-[var(--brand-violet-deep)] transition-colors hover:bg-[var(--brand-lavender)]/40'
        >
          <History size={15} />
          <span className='absolute -top-1.5 -right-1.5 rounded-full bg-[var(--brand-violet-soft)] px-1 py-0.5 text-[9px] font-bold leading-none text-[var(--brand-violet-deep)] ring-2 ring-white'>
            {historyRfqs.length}
          </span>
        </button>
        ) : null}
      </div>

      {activeRfqs.length === 0 ? (
        <div className='mb-4 flex flex-col items-center justify-center rounded-2xl border border-[rgba(196,164,132,0.4)] bg-[#FDFCFF] py-12 text-center'>
          <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-lavender)]'>
            <FileText size={24} className='text-[var(--brand-purple)]' />
          </div>
          <p className='text-gray-700 font-semibold text-sm mb-1'>
            ยังไม่มีคำขอราคาที่ดำเนินการอยู่
          </p>
          <p className='text-xs text-gray-400 mb-4'>สร้างคำขอราคาเพื่อรับใบเสนอราคาจากโรงงาน</p>
          <Link
            to='/create-rfq'
            className='rounded-xl bg-[linear-gradient(135deg,#1A0F2E_0%,#4A267D_45%,var(--brand-purple)_100%)] px-5 py-2 text-sm font-bold text-white shadow-md'
          >
            สร้างคำขอราคา
          </Link>
        </div>
      ) : (
        <div className='space-y-3 mb-4'>
          {activeRfqs.map((rfq, idx) => (
            <ActiveRfqCard key={rfq.id} rfq={rfq} idx={idx} />
          ))}
        </div>
      )}

      <HistoryRfqPopup
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        historyRfqs={historyRfqs}
      />
    </div>
  );
}
