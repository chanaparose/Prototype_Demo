import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import {
  Award,
  CheckCircle,
  ExternalLink,
  Factory,
  MessageCircle,
  Star,
} from 'lucide-react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { Quotation } from '@/components/features/rfq-detail/QuotationBOQCard';
import { QuotationBOQDetailsPanel } from '@/components/features/rfq-detail/QuotationBOQCard';
import { QuotationHistoryPanel } from '@/components/features/rfq-detail/QuotationHistoryPanel';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import { computeOfferMetrics } from '@/components/features/rfq-detail/rfqOfferMetrics';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { Button } from '@/components/ui/button';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';

export type RfqOfferDetailSheetProps = {
  offer: OfferItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfqQuantity: number;
  rfqUnitName?: string;
  rfqStatus: string;
  isRequestClosed: boolean;
  acceptingId: string | null;
  onChatWithOffer?: (offer: OfferItem) => void;
  onAcceptOffer: (offerId: string, e: MouseEvent) => void;
  quoteHistories?: Record<
    string,
    import('@/services/api/types/rfq.types').IQuotationHistoryEntry[]
  >;
};

function formatTHB(n: number): string {
  return formatCurrency(n);
}

export function RfqOfferDetailSheet({
  offer,
  open,
  onOpenChange,
  rfqQuantity,
  rfqUnitName,
  rfqStatus,
  isRequestClosed,
  acceptingId,
  onChatWithOffer,
  onAcceptOffer,
  quoteHistories,
}: RfqOfferDetailSheetProps) {
  if (!offer) return null;

  const {
    boq,
    isAccepted,
    isRejected,
    isExpired,
    shippingCost,
    packagingCost,
    toolingMoldCost,
    discountAmount,
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
    unitLabel,
  } = computeOfferMetrics(offer, rfqQuantity, rfqUnitName);
  const qd = (offer.quotationDetail ?? {}) as Partial<Quotation> & Record<string, unknown>;
  const images = boq.image_urls ?? [];

  return (
    <AppSheetDialog
      open={open}
      onOpenChange={onOpenChange}
      title={offer.factoryName}
      bodyClassName='max-h-[min(70vh,32rem)] overflow-y-auto px-4 py-3'
      footer={
        <div className='flex w-full gap-2'>
          {onChatWithOffer ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => onChatWithOffer(offer)}
              className='flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold'
              style={{ borderColor: 'var(--brand-mauve)', color: 'var(--brand-mauve)' }}
            >
              <MessageCircle size={14} /> แชท
            </Button>
          ) : null}
          {isAccepted ? (
            offer.orderId ? (
              <Link
                to={`/orders/${offer.orderId}`}
                className='flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-700'
              >
                <ExternalLink size={13} />
                ดูคำสั่งซื้อ
              </Link>
            ) : (
              <Button
                variant='unstyled'
                type='button'
                disabled
                className='flex-1 rounded-xl py-2.5 text-xs font-semibold text-white disabled:opacity-60'
                style={{ background: 'var(--status-success)' }}
              >
                ยอมรับแล้ว ✓
              </Button>
            )
          ) : isExpired ? (
            <Button
              variant='unstyled'
              type='button'
              disabled
              className='flex-1 rounded-xl bg-orange-500 py-2.5 text-xs font-semibold text-white disabled:opacity-70'
            >
              ใบเสนอราคาหมดอายุ
            </Button>
          ) : isRequestClosed ? (
            <Button
              variant='unstyled'
              type='button'
              disabled
              className='flex-1 rounded-xl bg-slate-400 py-2.5 text-xs font-semibold text-white disabled:opacity-70'
            >
              {rfqStatus === 'cancelled'
                ? 'ยกเลิกคำขอแล้ว'
                : rfqStatus === 'expired'
                  ? 'หมดอายุ'
                  : rfqStatus === 'closed'
                    ? 'ปิดรับคำขอแล้ว'
                    : 'ปิดคำขอแล้ว'}
            </Button>
          ) : (
            <Button
              variant='unstyled'
              type='button'
              onClick={(e) => onAcceptOffer(offer.id, e)}
              disabled={!!acceptingId || isRejected}
              className='flex-1 rounded-xl py-2.5 text-xs font-semibold text-white disabled:opacity-60'
              style={{
                background: isRejected ? '#94A3B8' : 'var(--brand-mauve)',
              }}
            >
              {acceptingId === offer.id
                ? 'กำลังส่ง...'
                : isRejected
                  ? 'ไม่ได้รับการเลือก'
                  : 'ยอมรับข้อเสนอ'}
            </Button>
          )}
        </div>
      }
    >
      <div className='space-y-3'>
        <div className='flex items-start gap-2.5'>
          <div
            className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'
            style={{ background: 'var(--brand-page)' }}
          >
            <Factory size={18} className='text-brand-mauve' />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-1.5'>
              <Link
                to={`/factories/${offer.factoryId}`}
                className='text-sm font-semibold text-brand-violet-deep hover:underline'
              >
                {offer.factoryName}
              </Link>
              {offer.verified ? <CheckCircle size={13} className='text-brand-mauve' /> : null}
              {offer.recommended ? (
                <span className='inline-flex items-center gap-0.5 rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[10px] font-semibold text-brand-violet-deep'>
                  <Award size={10} /> AI แนะนำ
                </span>
              ) : null}
            </div>
            <div className='mt-0.5 flex items-center gap-1'>
              <Star size={10} className='fill-yellow-400 text-yellow-400' />
              <span className='text-[10px] text-gray-500'>{offer.rating}</span>
              <span className='text-[10px] text-gray-400'>({offer.completedOrders} งาน)</span>
            </div>
            {qd.factory_qty != null && Number(qd.factory_qty) > 0 ? (
              <p className='mt-1 text-[10px] font-semibold text-amber-700'>
                โรงงานเสนอ {Number(qd.factory_qty).toLocaleString()}{' '}
                {qd.factory_unit_name || unitLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <div className='rounded-xl bg-gray-50 p-2.5 text-center'>
            <p className='text-sm font-bold text-brand-mauve'>{formatTHB(boq.price_per_piece)}</p>
            <p className='text-[9px] text-gray-500'>ราคาต่อ{unitLabel}</p>
          </div>
          <div className='rounded-xl bg-gray-50 p-2.5 text-center'>
            <p className='text-sm font-bold text-brand-navy'>{boq.lead_time_days}</p>
            <p className='text-[9px] text-gray-500'>Lead time (วัน)</p>
          </div>
          <div className='rounded-xl bg-gray-50 p-2.5 text-center'>
            <p className='text-sm font-bold text-brand-mauve'>{formatTHB(grandTotal)}</p>
            <p className='text-[9px] text-gray-500'>ราคารวมเสนอ</p>
          </div>
          <div className='rounded-xl bg-gray-50 p-2.5 text-center'>
            <p className='text-sm font-bold text-brand-navy'>{formatCompactNumber(boq.moq)}</p>
            <p className='text-[9px] text-gray-500'>MOQ ({unitLabel})</p>
          </div>
        </div>

        <div className='rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-2'>
          <div className='flex items-center justify-between text-[11px] text-gray-600'>
            <span>ค่าสินค้ารวม</span>
            <span className='font-semibold text-brand-navy'>{formatTHB(subtotal)}</span>
          </div>
          {shippingCost > 0 ? (
            <div className='mt-1 flex items-center justify-between text-[11px] text-gray-600'>
              <span>ค่าขนส่ง</span>
              <span className='font-semibold text-brand-navy'>{formatTHB(shippingCost)}</span>
            </div>
          ) : null}
          {packagingCost > 0 ? (
            <div className='mt-1 flex items-center justify-between text-[11px] text-gray-600'>
              <span>ค่าบรรจุภัณฑ์</span>
              <span className='font-semibold text-brand-navy'>{formatTHB(packagingCost)}</span>
            </div>
          ) : null}
          {toolingMoldCost > 0 ? (
            <div className='mt-1 flex items-center justify-between text-[11px] text-gray-600'>
              <span>ค่าแม่พิมพ์</span>
              <span className='font-semibold text-brand-navy'>{formatTHB(toolingMoldCost)}</span>
            </div>
          ) : null}
          {discountAmount > 0 ? (
            <div className='mt-1 flex items-center justify-between text-[11px] text-gray-600'>
              <span>ส่วนลด</span>
              <span className='font-semibold text-emerald-700'>-{formatTHB(discountAmount)}</span>
            </div>
          ) : null}
          <div className='mt-1 flex items-center justify-between text-[11px] text-gray-600'>
            <span>VAT {vatRate > 0 ? `${vatRate}%` : ''}</span>
            <span className='font-semibold text-brand-navy'>{formatTHB(vatAmount)}</span>
          </div>
          <div className='mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-[12px]'>
            <span className='font-semibold text-brand-navy'>รวมทั้งหมด</span>
            <span className='font-bold text-brand-mauve'>{formatTHB(grandTotal)}</span>
          </div>
        </div>

        {offer.factoryHighlight ? (
          <div className='rounded-lg border border-violet-100 bg-violet-50/70 px-2.5 py-2'>
            <p className='mb-0.5 text-[10px] font-semibold text-violet-700'>จุดเด่นจากโรงงาน</p>
            <p className='text-[11px] leading-relaxed text-violet-900'>{offer.factoryHighlight}</p>
          </div>
        ) : null}

        {images.length > 0 ? (
          <div>
            <p className='mb-1.5 text-[10px] font-semibold text-slate-500'>ภาพแนบ</p>
            <div className='flex flex-wrap gap-1.5'>
              {images.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type='button'
                  onClick={() => openImageLightbox(url)}
                  className='h-14 w-14 overflow-hidden rounded-lg border border-brand-purple/12 bg-slate-50'
                  aria-label='ดูรูปขนาดใหญ่'
                >
                  <ImageWithFallback src={url} alt='' className='h-full w-full object-cover' />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className='text-[10px] text-gray-500'>
          {boq.valid_until ? `ใบเสนอราคาถึง ${boq.valid_until}` : offer.aiReason}
        </p>

        {isAccepted ? (
          <div className='flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2'>
            <span className='inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700'>
              <CheckCircle size={11} />
              ยอมรับข้อเสนอแล้ว
            </span>
            {offer.orderId ? (
              <Link
                to={`/orders/${offer.orderId}`}
                className='flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 hover:underline'
              >
                ดูคำสั่งซื้อ <ExternalLink size={10} />
              </Link>
            ) : null}
          </div>
        ) : null}
        {isRejected ? (
          <p className='text-[10px] font-semibold text-slate-500'>ไม่ได้รับการเลือก</p>
        ) : null}
        {isExpired ? (
          <p className='text-[10px] font-semibold text-orange-500'>ใบเสนอราคาหมดอายุแล้ว</p>
        ) : null}

        <QuotationBOQDetailsPanel quotation={boq} className='border-t border-gray-100 pt-3' />

        <QuotationHistoryPanel
          quotationId={offer.id}
          preloadedHistory={quoteHistories?.[offer.id]}
        />
      </div>
    </AppSheetDialog>
  );
}
