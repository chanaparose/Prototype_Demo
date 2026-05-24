import React from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, FileText, AlertCircle, ChevronDown, History } from 'lucide-react';
import { BORDER_WARM, DEEP_PURPLE } from '@/components/features/rfq-and-orders/constants';
import { type Rfq } from '@/stores/types';
import { Button } from '@/components/ui/button';
import { ActiveRfqCard } from '@/components/features/rfq-and-orders/components/ActiveRfqCard';
import { HistoryRfqRow } from '@/components/features/rfq-and-orders/components/HistoryRfqRow';

export function RfqPanel({
  rfqs,
  isMobile,
  isDesktop,
}: {
  rfqs: Rfq[];
  isMobile?: boolean;
  isDesktop?: boolean;
}) {
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const activeRfqs = rfqs.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'expired' && r.status !== 'completed',
  );
  const historyRfqs = rfqs.filter(
    (r) => r.status === 'cancelled' || r.status === 'expired' || r.status === 'completed',
  );

  const totalPendingReview = activeRfqs.reduce((sum, rfq) => {
    return sum + (rfq.offers ?? []).filter((o) => o.quoteStatus === 'PD').length;
  }, 0);

  return (
    <div className={isMobile ? '' : 'px-4 pb-4 pt-2'}>
      {isMobile && (
        <Button
          variant='unstyled'
          onClick={() => navigate('/create-rfq')}
          className='fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1A0F2E_0%,#4A267D_45%,var(--brand-purple)_100%)] shadow-[0_6px_20px_rgba(162,56,255,0.35)] transition-transform active:scale-95'
        >
          <Plus size={24} className='text-white' />
        </Button>
      )}

      <div
        className={`mb-3 flex items-center justify-between ${isDesktop ? 'min-h-[56px] rounded-xl border border-[rgba(196,164,132,0.4)] bg-[#F9F8FC] px-3 py-2' : ''}`}
      >
        <div className='flex items-center gap-2 flex-wrap'>
          <h3 className='text-sm font-bold text-[var(--brand-navy-deep)]'>กำลังดำเนินการ</h3>
          <span className='rounded-full bg-[var(--brand-lavender)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-purple)]'>
            {activeRfqs.length}
          </span>
          {totalPendingReview > 0 && (
            <span className='flex items-center gap-1 rounded-full bg-[var(--surface-peach-mist)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-orange-vivid)]'>
              <AlertCircle size={9} />
              {totalPendingReview} รอตอบ
            </span>
          )}
        </div>
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

      {historyRfqs.length > 0 && (
        <div>
          <Button
            variant='unstyled'
            onClick={() => setHistoryOpen((v) => !v)}
            className='w-full flex items-center justify-between py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all'
            style={{
              background: historyOpen ? '#F0EBF8' : '#F9F8FC',
              borderColor: BORDER_WARM,
              color: DEEP_PURPLE,
            }}
          >
            <span className='flex items-center gap-2'>
              <History size={14} className='text-[var(--brand-violet-deep)]' />
              ประวัติใบขอราคา
              <span className='rounded-full bg-[var(--brand-violet-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand-violet-deep)]'>
                {historyRfqs.length}
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`text-[var(--brand-violet-deep)] transition-transform duration-200 ${
                historyOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>

          {historyOpen && (
            <div className='mt-2 space-y-1.5'>
              {historyRfqs.map((rfq) => (
                <HistoryRfqRow key={rfq.id} rfq={rfq} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
