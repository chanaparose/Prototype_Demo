import React, { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/stores/useAuthStore';
import { useRfqDetail } from '@/components/features/rfq/hooks/useRfqDetail';
import { rfqsApi } from '@/services/api/rfqApi';
import { openChatSession } from '@/utils/openChatSession';
import { getCurrentUserId } from '@/utils/chatContract';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import { CLOSEABLE_STATUSES, HISTORY_STATUSES, STATUS_LABEL } from '@/domain/rfq/constants';
import { RfqDetailOffersSection } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import { RfqDetailSpecs } from '@/components/features/rfq-detail/RfqDetailSpecs';
import { RfqDetailStatusCard } from '@/components/features/rfq-detail/RfqDetailStatusCard';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { Button } from '@/components/ui/button';
import {
  factoryIdeasChromeGradientClass,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { FactoryIdeasHeaderBackdrop } from '@/components/features/factory-ideas/FactoryIdeasPageHeader';
import {
  RFQ_DETAIL_BACK_BUTTON_CLASS,
  RFQ_DETAIL_EYEBROW_CLASS,
  rfqDetailContentSurfaceClass,
} from '@/components/features/rfq-detail/rfqDetailTheme';

function RfqDetailBackRow({ onBack }: { onBack: () => void }) {
  return (
    <Button variant='unstyled' type='button' onClick={onBack} className={RFQ_DETAIL_BACK_BUTTON_CLASS}>
      <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
      กลับ
    </Button>
  );
}

export function RFQDetailDesktop() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rfq, relatedOrder, quoteHistories, loading, error, refetch } = useRfqDetail(id);

  const [specsOpen, setSpecsOpen] = React.useState(false);
  const [selectedOffer, setSelectedOffer] = React.useState<string | null>(null);
  const [closing, setClosing] = React.useState(false);
  const requestedQuoteId = String(searchParams.get('quote_id') || '').trim();
  const requestedFactoryId = String(searchParams.get('factory_id') || '').trim();

  const goBack = useCallback(() => navigate('/orders'), [navigate]);

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

  const chromeHeader = (
    <div className={factoryIdeasChromeGradientClass}>
      <div className='relative overflow-hidden border-b border-gray-100/80'>
        <FactoryIdeasHeaderBackdrop />
        <div className='relative z-10 mx-auto max-w-6xl px-8 py-4 2xl:px-10'>
          <RfqDetailBackRow onBack={goBack} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`hidden min-h-[60vh] lg:block ${rfqDetailContentSurfaceClass}`}>
        {chromeHeader}
        <div className='mx-auto flex max-w-6xl flex-col items-center gap-4 px-8 py-20 text-center 2xl:px-10'>
          <div className='h-10 w-10 animate-spin rounded-full border-[3px] border-brand-violet-deep border-t-transparent' />
          <p className='text-sm font-semibold text-brand-navy-ink'>กำลังโหลดคำขอราคา...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className={`hidden min-h-[60vh] lg:block ${rfqDetailContentSurfaceClass}`}>
        {chromeHeader}
        <div className='mx-auto flex max-w-6xl flex-col items-center gap-4 px-8 py-20 text-center 2xl:px-10'>
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
                className='text-sm font-semibold text-brand-violet-deep underline'
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
  const canClose = CLOSEABLE_STATUSES.has(rfq.status);

  return (
    <div className={`hidden lg:block ${rfqDetailContentSurfaceClass}`}>
      <div className={factoryIdeasChromeGradientClass}>
        <div className='relative overflow-hidden border-b border-gray-100/80'>
          <FactoryIdeasHeaderBackdrop />
          <div className='relative z-10 mx-auto max-w-6xl px-8 py-4 2xl:px-10'>
            <div className='mb-4 flex items-start justify-between gap-6'>
              <div className='min-w-0'>
                <RfqDetailBackRow onBack={goBack} />
                <p className={`${RFQ_DETAIL_EYEBROW_CLASS} mt-2`}>คำขอราคา</p>
                <h1 className='truncate text-2xl font-bold text-brand-navy-ink'>{rfq.projectName}</h1>
                <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-navy-ink/80'>
                  <span
                    className='rounded-full px-2.5 py-1 text-xs font-bold'
                    style={statusBadgeStyle}
                  >
                    {statusLabel}
                  </span>
                  <span className='text-slate-300'>•</span>
                  <span>หมวด: {rfq.category}</span>
                  <span className='text-slate-300'>•</span>
                  <span>งบ: {formatCurrency(rfq.budget)}</span>
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
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
                    className='rounded-xl border border-brand-purple/30 bg-brand-lavender-chip/40 px-4 py-2 text-sm font-semibold text-brand-violet-deep disabled:opacity-60'
                  >
                    {closing ? 'กำลังปิด...' : 'ปิดรับคำขอ'}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-6xl px-8 py-6 2xl:px-10'>
        <div className='grid grid-cols-[1fr_360px] items-start gap-6'>
          <div className='space-y-4'>
            <div className='overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm'>
              <div className='border-b border-slate-100 px-5 py-4'>
                <p className='text-sm font-bold text-brand-navy-ink'>สรุปสถานะ</p>
                <p className='mt-1 text-xs text-slate-500'>
                  ดูความคืบหน้าและข้อเสนอจากโรงงานในที่เดียว
                </p>
              </div>
              <div className='p-4'>
                <RfqDetailStatusCard
                  rfq={rfq}
                  rfqId={id}
                  isHistoryView={isHistoryView}
                  statusBadgeStyle={statusBadgeStyle}
                  statusLabel={statusLabel}
                />
              </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm'>
              <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4'>
                <div>
                  <p className='text-sm font-bold text-brand-navy-ink'>ใบเสนอราคา</p>
                  <p className='mt-1 text-xs text-slate-500'>
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
                  quoteHistories={quoteHistories}
                  onOfferFlowComplete={async ({ orderId }) => {
                    await refetch();
                    if (orderId) navigate(`/orders/${orderId}`);
                  }}
                />
              </div>
            </div>
          </div>

          <div className='sticky top-6 space-y-4'>
            <div className='overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm'>
              <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4'>
                <div>
                  <p className='text-sm font-bold text-brand-navy-ink'>สเปกงาน</p>
                  <p className='mt-1 text-xs text-slate-500'>เปิด/ปิดเพื่อดูรายละเอียดสเปก</p>
                </div>
                <Button
                  variant='unstyled'
                  type='button'
                  className='rounded-xl border border-brand-purple/20 bg-brand-lavender-chip/40 px-3 py-1.5 text-xs font-semibold text-brand-violet-deep hover:bg-brand-lavender-chip/60'
                  onClick={() => setSpecsOpen((v) => !v)}
                >
                  {specsOpen ? 'ซ่อน' : 'แสดง'}
                </Button>
              </div>
              {specsOpen ? (
                <div className='p-4 pt-0'>
                  <RfqDetailSpecs rfq={rfq} bare />
                </div>
              ) : null}
            </div>

            <div className='relative overflow-hidden rounded-xl border border-brand-purple/15 bg-gradient-to-br from-brand-purple/[0.12] via-[var(--brand-page)] to-brand-orange/[0.08] p-5'>
              <div
                className='pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-brand-orange/[0.12] blur-2xl'
                aria-hidden
              />
              <div
                className='pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-brand-purple/[0.1] blur-xl'
                aria-hidden
              />
              <div className='relative z-10'>
                <p className='text-sm font-bold text-brand-navy-ink'>ต้องการ RFQ ใหม่?</p>
                <p className='mt-1 text-xs text-slate-500'>
                  สร้างคำขอใหม่เพื่อรับใบเสนอราคาจากโรงงานได้ทันที
                </p>
                <Button
                  variant='unstyled'
                  type='button'
                  className='mt-4 w-full rounded-xl bg-brand-purple py-3 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep'
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
