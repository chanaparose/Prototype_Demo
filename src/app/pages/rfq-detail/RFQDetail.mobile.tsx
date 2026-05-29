import React, { useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/stores/useAuthStore';
import { rfqsApi } from '@/services/api/rfqApi';
import { openChatSession } from '@/utils/openChatSession';
import { getCurrentUserId } from '@/utils/chatContract';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import { ChevronLeft } from 'lucide-react';
import { useRfqDetail } from '@/components/features/rfq/hooks/useRfqDetail';
import { RfqDetailStatusCard } from '@/components/features/rfq-detail/RfqDetailStatusCard';
import { RfqDetailSpecs } from '@/components/features/rfq-detail/RfqDetailSpecs';
import { RfqDetailOffersSection } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import { QuotationHistoryPanel } from '@/components/features/rfq-detail/QuotationHistoryPanel';
import { CLOSEABLE_STATUSES, HISTORY_STATUSES, STATUS_LABEL } from '@/domain/rfq/constants';
import { Button } from '@/components/ui/button';
import { appColors } from '@/styles/colors';

const COLORS = {
  purple: appColors.brand.mauve,
  orange: appColors.brand.orangeDeep,
  blue: appColors.brand.navy,
  lightPurpleBg: appColors.brand.page,
};

export function RFQDetailMobile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    rfq,
    relatedOrder,
    quoteOrderMap: _quoteOrderMap,
    quoteHistories,
    loading,
    error,
    refetch,
  } = useRfqDetail(id);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'offers'>('specs');
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

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col' style={{ backgroundColor: COLORS.lightPurpleBg }}>
        <div className='flex items-center px-4 pt-5 pb-4 bg-white border-b border-gray-100'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/orders')}
            className='w-10 h-10 rounded-xl shadow-sm flex items-center justify-center'
            style={{ backgroundColor: COLORS.lightPurpleBg }}
          >
            <ChevronLeft size={22} style={{ color: COLORS.blue }} />
          </Button>
        </div>
        <div className='flex-1 flex flex-col items-center justify-center px-6 pb-24 text-center'>
          <div
            className='w-10 h-10 rounded-full border-[3px] animate-spin mb-3'
            style={{ borderColor: COLORS.purple, borderTopColor: 'transparent' }}
          />
          <p className='text-sm font-semibold' style={{ color: COLORS.blue }}>
            กำลังโหลด RFQ...
          </p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className='min-h-screen flex flex-col' style={{ backgroundColor: COLORS.lightPurpleBg }}>
        <div className='flex items-center px-4 pt-5 pb-4 bg-white border-b border-gray-100'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/orders')}
            className='w-10 h-10 rounded-xl shadow-sm flex items-center justify-center'
            style={{ backgroundColor: COLORS.lightPurpleBg }}
          >
            <ChevronLeft size={22} style={{ color: COLORS.blue }} />
          </Button>
        </div>
        <div className='flex-1 flex flex-col items-center justify-center px-6 pb-24 text-center'>
          {error ? (
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
                className='mt-4 text-sm font-semibold underline'
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

  const isClosedRequest =
    rfq.status === 'completed' || rfq.status === 'cancelled' || rfq.status === 'closed';
  const isHistoryView =
    HISTORY_STATUSES.includes(rfq.status as (typeof HISTORY_STATUSES)[number]) && !isClosedRequest;
  const canClose = CLOSEABLE_STATUSES.has(rfq.status);

  const statusBadgeStyle = isHistoryView
    ? rfq.status === 'completed'
      ? { background: 'var(--status-success-soft)', color: 'var(--status-success)' }
      : rfq.status === 'cancelled'
        ? { background: 'var(--neutral-slate-muted)', color: 'var(--neutral-slate-subtle)' }
        : { background: 'var(--status-warning-soft)', color: '#B45309' }
    : isClosedRequest
      ? rfq.status === 'completed'
        ? { background: '#E8F7EE', color: '#0F9F6E' }
        : rfq.status === 'closed'
          ? { background: 'var(--neutral-slate-muted)', color: 'var(--neutral-slate-subtle)' }
          : { background: 'var(--neutral-slate-muted)', color: 'var(--neutral-slate-subtle)' }
      : { background: COLORS.lightPurpleBg, color: COLORS.purple };

  const statusLabel = isClosedRequest
    ? rfq.status === 'completed'
      ? 'ปิดคำขอแล้ว'
      : rfq.status === 'closed'
        ? 'ปิดรับคำขอแล้ว'
        : 'ยกเลิกคำขอแล้ว'
    : isHistoryView
      ? (STATUS_LABEL[rfq.status] ?? rfq.status)
      : `${rfq.offerCount} ใบเสนอราคา`;

  return (
    <div className='min-h-screen' style={{ backgroundColor: COLORS.lightPurpleBg }}>
      <div className='sticky top-0 z-50 flex items-center justify-between h-12 px-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/orders')}
          className='flex shrink-0 items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors'
        >
          <ChevronLeft size={18} />
          กลับ
        </Button>
      </div>

      <div className='px-4 pt-4 pb-2'>
        <RfqDetailStatusCard
          rfq={rfq}
          isHistoryView={isHistoryView}
          statusBadgeStyle={statusBadgeStyle}
          statusLabel={statusLabel}
          footer={
            canClose ? (
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
                className='w-full rounded-xl border text-[13px] font-semibold py-2 disabled:opacity-60'
                style={{
                  borderColor: COLORS.purple,
                  color: COLORS.purple,
                  backgroundColor: COLORS.lightPurpleBg,
                }}
              >
                {closing ? 'กำลังปิด...' : 'ปิดรับคำขอ'}
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className='px-4 pb-32 pt-3'>
        <div className='bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm'>
          <div className='sticky z-40 flex border-b border-gray-200 bg-white/95 backdrop-blur-sm'>
            {([
              { id: 'specs' as const, label: 'สเปกของโครงการ' },
              {
                id: 'offers' as const,
                label: `เปรียบเทียบใบเสนอราคา${(rfq.offers?.length ?? 0) > 0 ? ` (${rfq.offers?.length})` : ''}`,
              },
            ]).map((tab) => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-semibold text-center transition-colors ${
                  activeTab === tab.id ? 'border-b-2' : 'text-gray-400 hover:text-gray-600'
                }`}
                style={
                  activeTab === tab.id
                    ? { borderColor: COLORS.purple, color: COLORS.purple }
                    : undefined
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'specs' ? (
            <RfqDetailSpecs rfq={rfq} bare />
          ) : (
            <div className='space-y-4 px-4 pb-5'>
              <RfqDetailOffersSection
                rfqStatus={rfq.status}
                offers={rfq.offers ?? []}
                isHistoryView={isHistoryView}
                orderForRfq={relatedOrder ?? undefined}
                selectedOfferId={selectedOffer}
                onSelectOffer={setSelectedOffer}
                onChatWithOffer={handleChatWithOffer}
                rfqQuantity={rfq.quantity}
                quoteHistories={quoteHistories}
                onOfferFlowComplete={async ({ orderId }) => {
                  await refetch();
                  if (orderId) navigate(`/orders/${orderId}`);
                }}
              />
              {selectedOffer ? (
                <QuotationHistoryPanel
                  quotationId={selectedOffer}
                  preloadedHistory={quoteHistories?.[selectedOffer]}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
