import React, { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/stores/useAuthStore';
import { useRfqDetail } from '@/hooks/useRfqDetail';
import { rfqsApi } from '@/services/api/rfqApi';
import { openChatSession } from '@/utils/openChatSession';
import { getCurrentUserId } from '@/utils/chatContract';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import {
  CLOSEABLE_STATUSES,
  HISTORY_STATUSES,
  STATUS_LABEL,
} from '@/domain/rfq/constants';
import { QuotationHistoryPanel } from '@/components/features/rfq-detail/QuotationHistoryPanel';
import { RfqDetailOffersSection } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import { RfqDetailSpecs } from '@/components/features/rfq-detail/RfqDetailSpecs';
import { RfqDetailStatusCard } from '@/components/features/rfq-detail/RfqDetailStatusCard';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { Button } from '@/components/ui/button';
import { appColors } from '@/styles/colors';

const COLORS = {
  purple: appColors.brand.mauve,
  purpleLight: appColors.brand.mauveLight,
  orange: appColors.brand.orangeDeep,
  blue: appColors.brand.navy,
  white: appColors.neutral.white,
  gray: appColors.neutral.warmSurface,
  lightPurpleBg: appColors.brand.page,
};
export function RFQDetailDesktop() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rfq, relatedOrder, quoteOrderMap, loading, error, refetch } = useRfqDetail(id);

  const [specsOpen, setSpecsOpen] = React.useState(true);
  const [selectedOffer, setSelectedOffer] = React.useState<string | null>(null);
  const [closing, setClosing] = React.useState(false);
  const requestedQuoteId = String(searchParams.get('quote_id') || '').trim();
  const requestedFactoryId = String(searchParams.get('factory_id') || '').trim();

  React.useEffect(() => {
    if (!rfq?.offers?.length) return;
    if (selectedOffer) return;
    const byQuote = requestedQuoteId
      ? rfq.offers.find((o) => String(o.id) === requestedQuoteId)
      : undefined;
    const byFactory =
      !byQuote && requestedFactoryId
        ? rfq.offers.find((o) => String(o.factoryId) === requestedFactoryId)
        : undefined;
    const matched = byQuote ?? byFactory;
    if (matched?.id) setSelectedOffer(String(matched.id));
  }, [rfq?.offers, requestedQuoteId, requestedFactoryId, selectedOffer]);

  const handleChatWithOffer = useCallback(
    async (offer: OfferItem) => {
      if (!rfq) return;
      const my = getCurrentUserId(user);
      const fid = Number(offer.factoryId);
      const rid = Number(id);
      if (my == null || !Number.isFinite(fid) || fid <= 0 || !Number.isFinite(rid) || rid <= 0)
        return;
      const ref = { type: 'RQ' as const, id: rid, title: rfq.projectName };
      await openChatSession(navigate, user, {
        customerUserId: my,
        factoryEntityId: fid,
        pendingReference: ref,
      });
    },
    [user, navigate, id, rfq?.projectName],
  );

  if (!rfq) {
    return (
      <div
        className='hidden lg:block min-h-[60vh]'
        style={{ backgroundColor: COLORS.lightPurpleBg }}
      >
        <div className='max-w-6xl mx-auto px-8 py-14 flex flex-col items-center gap-4 text-center'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/orders')}
            className='w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 bg-white self-start'
          >
            <ArrowLeft size={18} style={{ color: COLORS.blue }} />
          </Button>
          {loading ? (
            <>
              <div
                className='w-10 h-10 rounded-full border-3 animate-spin'
                style={{ borderColor: COLORS.purple, borderTopColor: 'transparent' }}
              />
              <p className='text-sm font-semibold' style={{ color: COLORS.blue }}>
                กำลังโหลด RFQ...
              </p>
            </>
          ) : error ? (
            <>
              <p className='text-sm font-semibold text-red-600 mb-2'>{error}</p>
              <Button
                variant='unstyled'
                type='button'
                className='text-sm font-semibold underline'
                style={{ color: COLORS.purple }}
                onClick={() => refetch()}
              >
                ลองใหม่
              </Button>
            </>
          ) : (
            <>
              <p className='text-sm font-semibold' style={{ color: COLORS.blue }}>
                ไม่พบคำขอนี้ หรือคุณไม่มีสิทธิ์ดู
              </p>
              <Button
                variant='unstyled'
                type='button'
                className='text-sm font-semibold underline'
                style={{ color: COLORS.purple }}
                onClick={() => navigate('/orders')}
              >
                กลับไป คำขอราคา & คำสั่งซื้อ
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const isClosedRequest = rfq.status === 'completed' || rfq.status === 'cancelled';
  const isHistoryView =
    HISTORY_STATUSES.includes(rfq.status as (typeof HISTORY_STATUSES)[number]) && !isClosedRequest;

  const statusBadgeStyle = isHistoryView
    ? rfq.status === 'completed'
      ? { background: 'var(--status-success-soft)', color: 'var(--status-success)' }
      : rfq.status === 'cancelled'
        ? { background: 'var(--neutral-slate-muted)', color: 'var(--neutral-slate-subtle)' }
        : { background: 'var(--status-warning-soft)', color: '#B45309' }
    : isClosedRequest
      ? rfq.status === 'completed'
        ? { background: '#E8F7EE', color: '#0F9F6E' }
        : { background: 'var(--neutral-slate-muted)', color: 'var(--neutral-slate-subtle)' }
      : { background: COLORS.lightPurpleBg, color: COLORS.purple };

  const statusLabel = isClosedRequest
    ? rfq.status === 'completed'
      ? 'ปิดคำขอแล้ว'
      : 'ยกเลิกคำขอแล้ว'
    : isHistoryView
      ? (STATUS_LABEL[rfq.status] ?? rfq.status)
      : `${rfq.offerCount} ใบเสนอราคา`;
  const canClose = CLOSEABLE_STATUSES.has(rfq.status);

  return (
    <div className='hidden lg:block' style={{ backgroundColor: COLORS.lightPurpleBg }}>
      <div className='max-w-6xl mx-auto px-8 py-7'>
        <div className='flex items-start justify-between gap-6 mb-6'>
          <div className='min-w-0'>
            <div className='flex items-center gap-3 mb-2'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate('/orders')}
                className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-gray-200 hover:border-gray-300 transition-colors'
                style={{ backgroundColor: COLORS.white }}
              >
                <ArrowLeft size={18} style={{ color: COLORS.blue }} />
              </Button>
              <div className='min-w-0'>
                <p
                  className='text-xs uppercase tracking-wider font-semibold'
                  style={{ color: COLORS.orange }}
                >
                  RFQ Detail
                </p>
                <h1 className='text-2xl font-bold truncate' style={{ color: COLORS.blue }}>
                  {rfq.projectName}
                </h1>
              </div>
            </div>
            <div
              className='flex items-center gap-2 text-sm ml-[52px]'
              style={{ color: COLORS.blue }}
            >
              <span className='px-2.5 py-1 rounded-full text-xs font-bold' style={statusBadgeStyle}>
                {statusLabel}
              </span>
              <span className='text-gray-300'>•</span>
              <span>หมวด: {rfq.category}</span>
              <span className='text-gray-300'>•</span>
              <span>งบ: {formatCurrency(rfq.budget)}</span>
            </div>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            {canClose ? (
              <Button
                variant='unstyled'
                type='button'
                disabled={closing}
                onClick={async () => {
                  const ok = window.confirm(
                    'ปิดรับคำขอราคานี้? โรงงานจะไม่สามารถส่งใบเสนอราคาใหม่ได้ แต่คำสั่งซื้อที่ยืนยันแล้วยังคงดำเนินต่อไป',
                  );
                  if (!ok) return;
                  setClosing(true);
                  try {
                    await rfqsApi.close(rfq.id);
                    toast.success('ปิดรับคำขอราคาเรียบร้อย');
                    await refetch();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'ไม่สามารถปิดคำขอได้');
                  } finally {
                    setClosing(false);
                  }
                }}
                className='px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-60'
                style={{
                  borderColor: COLORS.purple,
                  color: COLORS.purple,
                  backgroundColor: 'var(--brand-page)',
                }}
              >
                {closing ? 'กำลังปิด...' : 'ปิดรับคำขอ'}
              </Button>
            ) : null}
          </div>
        </div>

        <div className='grid grid-cols-[1fr_360px] gap-6 items-start'>
          <div className='space-y-4'>
            <div className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
              <div className='px-5 py-4 border-b border-gray-100'>
                <p className='text-sm font-bold' style={{ color: COLORS.blue }}>
                  สรุปสถานะ
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  ดูความคืบหน้าและข้อเสนอจากโรงงานในที่เดียว
                </p>
              </div>
              <div className='p-4'>
                <RfqDetailStatusCard
                  rfq={rfq}
                  isHistoryView={isHistoryView}
                  statusBadgeStyle={statusBadgeStyle}
                  statusLabel={statusLabel}
                />
              </div>
            </div>

            <div className='bg-white rounded-2xl border border-gray-100 shadow-sm'>
              <div className='px-5 py-4 border-b border-gray-100 flex items-center justify-between'>
                <div>
                  <p className='text-sm font-bold' style={{ color: COLORS.blue }}>
                    ใบเสนอราคา
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    เลือกข้อเสนอเพื่อเปรียบเทียบราคาและ lead time
                  </p>
                </div>
              </div>
              <div className='p-4'>
                <RfqDetailOffersSection
                  rfqStatus={rfq.status}
                  offers={rfq.offers ?? []}
                  isHistoryView={isHistoryView}
                  orderForRfq={relatedOrder ?? undefined}
                  selectedOfferId={selectedOffer}
                  onSelectOffer={setSelectedOffer}
                  onChatWithOffer={handleChatWithOffer}
                  rfqQuantity={rfq.quantity}
                  onOfferFlowComplete={async ({ orderId }) => {
                    await refetch();
                    if (orderId) navigate(`/orders/${orderId}`);
                  }}
                />
              </div>
            </div>
          </div>

          <div className='space-y-4 sticky top-6'>
            <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
              <div className='px-5 py-4 border-b border-gray-100 flex items-center justify-between'>
                <div>
                  <p className='text-sm font-bold' style={{ color: COLORS.blue }}>
                    สเปกงาน
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>เปิด/ปิดเพื่อดูรายละเอียดสเปก</p>
                </div>
                <Button
                  variant='unstyled'
                  type='button'
                  className='px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-100 hover:bg-gray-100'
                  style={{ backgroundColor: COLORS.lightPurpleBg, color: COLORS.blue }}
                  onClick={() => setSpecsOpen((v) => !v)}
                >
                  {specsOpen ? 'ซ่อน' : 'แสดง'}
                </Button>
              </div>
              <div className='p-4'>
                <RfqDetailSpecs
                  rfq={rfq}
                  open={specsOpen}
                  onToggle={() => setSpecsOpen((v) => !v)}
                />
              </div>
            </div>

            <div
              className='rounded-2xl p-5 text-white shadow-sm relative overflow-hidden'
              style={{
                background: 'linear-gradient(135deg, var(--brand-navy-deep) 0%, #4A267D 100%)',
              }}
            >
              <div
                className='absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-40 blur-2xl mix-blend-screen'
                style={{ backgroundColor: 'var(--brand-orange-hot)' }}
              />
              <div
                className='absolute -left-4 -bottom-4 w-20 h-20 rounded-full opacity-30 blur-xl mix-blend-screen'
                style={{ backgroundColor: 'var(--brand-purple)' }}
              />
              <div className='relative z-10'>
                <p className='text-sm font-bold'>ต้องการ RFQ ใหม่?</p>
                <p className='text-xs mt-1' style={{ color: '#EBD3FF' }}>
                  สร้างคำขอใหม่เพื่อรับใบเสนอราคาจากโรงงานได้ทันที
                </p>
                <Button
                  variant='unstyled'
                  type='button'
                  className='mt-4 w-full py-3 rounded-xl bg-white/95 text-sm font-bold'
                  style={{ color: COLORS.purple }}
                  onClick={() => navigate('/create-rfq')}
                >
                  + สร้างคำขอราคา
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
