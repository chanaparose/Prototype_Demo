import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/stores/useAuthStore';
import { rfqsApi } from '@/services/api/rfqApi';
import { openChatSession } from '@/utils/openChatSession';
import { getCurrentUserId } from '@/utils/chatContract';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import { ArrowLeft, ClipboardList, GitCompare } from 'lucide-react';
import { useRfqDetail } from '@/components/features/rfq/hooks/useRfqDetail';
import { RfqDetailStatusCard } from '@/components/features/rfq-detail/RfqDetailStatusCard';
import { RfqDetailSpecs } from '@/components/features/rfq-detail/RfqDetailSpecs';
import { RfqDetailOffersSection } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import { QuotationHistoryPanel } from '@/components/features/rfq-detail/QuotationHistoryPanel';
import {
  factoryIdeasChromeGradientClass,
  factoryIdeasContentSurfaceClass,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { FactoryIdeasHeaderBackdrop } from '@/components/features/factory-ideas/FactoryIdeasPageHeader';
import {
  RFQ_DETAIL_BACK_BUTTON_CLASS,
  RFQ_DETAIL_SUB_HEADER_ROW_CLASS,
  RFQ_DETAIL_TAB_ACTIVE_CLASS,
  RFQ_DETAIL_TAB_ICON_ACTIVE_CLASS,
  RFQ_DETAIL_TAB_ICON_IDLE_CLASS,
  RFQ_DETAIL_TAB_IDLE_CLASS,
  RFQ_DETAIL_TAB_INDICATOR_CLASS,
  RFQ_DETAIL_TAB_LIST_CLASS,
} from '@/components/features/rfq-detail/rfqDetailTheme';
import { CLOSEABLE_STATUSES, HISTORY_STATUSES, STATUS_LABEL } from '@/domain/rfq/constants';
import { Button } from '@/components/ui/button';

type DetailTab = 'specs' | 'offers';

const DETAIL_TABS: {
  id: DetailTab;
  label: string;
  icon: typeof ClipboardList;
  dataTour?: string;
}[] = [
  { id: 'specs', label: 'สเปกโครงการ', icon: ClipboardList },
  { id: 'offers', label: 'ใบเสนอราคา', icon: GitCompare, dataTour: 'tab-offers' },
];

function RfqDetailTabBar({
  activeTab,
  offerCount,
  onChange,
}: {
  activeTab: DetailTab;
  offerCount: number;
  onChange: (tab: DetailTab) => void;
}) {
  return (
    <div
      role='tablist'
      aria-label='รายละเอียดคำขอราคา'
      className={RFQ_DETAIL_TAB_LIST_CLASS}
    >
      {DETAIL_TABS.map((tab) => {
        const active = activeTab === tab.id;
        const Icon = tab.icon;
        const countLabel =
          tab.id === 'offers' && offerCount > 0 ? ` (${offerCount})` : '';
        return (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            {...(tab.dataTour ? { 'data-tour': tab.dataTour } : {})}
            className={`relative flex min-w-0 items-center justify-center gap-1.5 px-3 py-3 text-center transition-colors ${
              active ? RFQ_DETAIL_TAB_ACTIVE_CLASS : RFQ_DETAIL_TAB_IDLE_CLASS
            }`}
          >
            <Icon
              size={15}
              strokeWidth={2.1}
              className={`shrink-0 ${active ? RFQ_DETAIL_TAB_ICON_ACTIVE_CLASS : RFQ_DETAIL_TAB_ICON_IDLE_CLASS}`}
              aria-hidden
            />
            <span
              className={`truncate text-[12px] font-semibold leading-tight ${
                active ? 'text-brand-violet-deep' : 'text-slate-500'
              }`}
            >
              {tab.label}
              {countLabel}
            </span>
            {active ? <span className={RFQ_DETAIL_TAB_INDICATOR_CLASS} /> : null}
          </button>
        );
      })}
    </div>
  );
}

function RfqDetailBackRow({ onBack }: { onBack: () => void }) {
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onBack}
      className={RFQ_DETAIL_BACK_BUTTON_CLASS}
    >
      <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
      กลับ
    </Button>
  );
}

function RfqDetailSubHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className={RFQ_DETAIL_SUB_HEADER_ROW_CLASS}>
      <RfqDetailBackRow onBack={onBack} />
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<DetailTab>('specs');
  const userChangedTabRef = useRef(false);
  const requestedQuoteId = String(searchParams.get('quote_id') || '').trim();
  const requestedFactoryId = String(searchParams.get('factory_id') || '').trim();

  const goBack = useCallback(() => navigate('/orders'), [navigate]);

  React.useEffect(() => {
    if (requestedQuoteId || requestedFactoryId) {
      setActiveTab('offers');
    }
  }, [requestedQuoteId, requestedFactoryId]);

  React.useEffect(() => {
    if (!rfq) return;
    if (requestedQuoteId || requestedFactoryId) return;
    if (userChangedTabRef.current) return;
    const hasOffers = (rfq.offers?.length ?? 0) > 0 || (rfq.offerCount ?? 0) > 0;
    setActiveTab(hasOffers ? 'offers' : 'specs');
  }, [rfq, requestedQuoteId, requestedFactoryId]);

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
      <div className={`min-h-[100dvh] pb-24 ${factoryIdeasContentSurfaceClass}`}>
        <div className={factoryIdeasChromeGradientClass}>
          <div className='relative px-4 pb-3 pt-2'>
            <FactoryIdeasHeaderBackdrop />
            <div className='relative z-10'>
              <RfqDetailSubHeader onBack={goBack} />
            </div>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center px-6 py-20 text-center'>
          <div className='mb-3 h-10 w-10 animate-spin rounded-full border-[3px] border-brand-violet-deep border-t-transparent' />
          <p className='text-sm font-semibold text-brand-navy-ink'>กำลังโหลดคำขอราคา...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className={`min-h-[100dvh] pb-24 ${factoryIdeasContentSurfaceClass}`}>
        <div className={factoryIdeasChromeGradientClass}>
          <div className='relative px-4 pb-3 pt-2'>
            <FactoryIdeasHeaderBackdrop />
            <div className='relative z-10'>
              <RfqDetailSubHeader onBack={goBack} />
            </div>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center px-6 py-20 text-center'>
          {error ? (
            <>
              <p className='mb-2 text-sm font-semibold text-red-600'>{error}</p>
              <Button
                variant='unstyled'
                type='button'
                className='text-sm font-semibold text-brand-violet-deep underline'
                onClick={() => refetch()}
              >
                ลองใหม่
              </Button>
            </>
          ) : (
            <>
              <p className='text-sm font-semibold text-brand-navy-ink'>
                ไม่พบคำขอนี้ หรือคุณไม่มีสิทธิ์ดู
              </p>
              <Button
                variant='unstyled'
                type='button'
                className='mt-4 text-sm font-semibold text-brand-violet-deep underline'
                onClick={goBack}
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
  const offerCount = rfq.offers?.length ?? 0;

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
      : { background: 'var(--brand-lavender-chip)', color: 'var(--brand-violet-deep)' };

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
    <div className={`min-h-[100dvh] pb-32 ${factoryIdeasContentSurfaceClass}`}>
      <div className={factoryIdeasChromeGradientClass}>
        <div className='relative px-4 pb-3 pt-2'>
          <FactoryIdeasHeaderBackdrop />
          <div className='relative z-10 space-y-3'>
            <RfqDetailSubHeader onBack={goBack} />
            <RfqDetailStatusCard
              rfq={rfq}
              rfqId={id}
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
                    className='w-full rounded-xl border border-brand-purple/30 bg-brand-lavender-chip/40 py-2 text-[13px] font-semibold text-brand-violet-deep disabled:opacity-60'
                  >
                    {closing ? 'กำลังปิด...' : 'ปิดรับคำขอ'}
                  </Button>
                ) : undefined
              }
            />
          </div>
        </div>

        <div className='sticky top-14 z-20 overflow-visible bg-white shadow-none'>
          <RfqDetailTabBar
            activeTab={activeTab}
            offerCount={offerCount}
            onChange={(tab) => {
              userChangedTabRef.current = true;
              setActiveTab(tab);
            }}
          />
        </div>
      </div>

      <div className={`px-4 pt-3 ${factoryIdeasContentSurfaceClass}`}>
        {activeTab === 'specs' ? (
          <RfqDetailSpecs rfq={rfq} bare />
        ) : (
          <div className='space-y-4 pb-5'>
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
  );
}
