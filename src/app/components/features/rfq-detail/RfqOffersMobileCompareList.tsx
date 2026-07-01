import { Award, CheckCircle, ChevronRight, Factory, ImageIcon } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import {
  computeOfferMetrics,
  minPositive,
  type OfferMetrics,
} from '@/components/features/rfq-detail/rfqOfferMetrics';
import { RFQ_COMPARE_BEST_CELL_CLASS, RFQ_COMPARE_RECOMMENDED_COL_CLASS } from '@/components/features/rfq-detail/rfqDetailTheme';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';

export type RfqOffersMobileCompareListProps = {
  offers: OfferItem[];
  rfqQuantity: number;
  rfqUnitName?: string;
  onRowPress: (offer: OfferItem) => void;
};

const MOBILE_COMPARE_ROW_GRID =
  'grid-cols-[minmax(0,1fr)_4.5rem_3.5rem_minmax(0,3.5rem)_1.25rem]';

const MOBILE_CELL_CLAMP_2_CLASS =
  'line-clamp-2 overflow-hidden break-words [overflow-wrap:anywhere]';

function MobileHighlightCell({
  m,
  onRowPress,
}: {
  m: OfferMetrics;
  onRowPress: (offer: OfferItem) => void;
}) {
  const images = m.boq.image_urls ?? [];
  const hasHighlight = Boolean(m.offer.factoryHighlight?.trim());

  if (images.length > 0) {
    return (
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          onRowPress(m.offer);
        }}
        className='relative ml-auto block h-7 w-7 shrink-0 overflow-hidden rounded border border-brand-purple/12 bg-slate-50'
        aria-label={
          images.length > 1 ? `ดูรูปจุดเด่น ${images.length} ภาพ` : 'ดูรูปจุดเด่น'
        }
      >
        <ImageWithFallback src={images[0]} alt='' className='h-full w-full object-cover' />
        {images.length > 1 ? (
          <span className='absolute inset-0 flex items-center justify-center bg-black/40 text-[9px] font-bold text-white'>
            +{images.length - 1}
          </span>
        ) : null}
      </button>
    );
  }

  if (hasHighlight) {
    return (
      <p
        className={`${MOBILE_CELL_CLAMP_2_CLASS} text-right text-[10px] leading-snug text-brand-violet-deep`}
      >
        {m.offer.factoryHighlight}
      </p>
    );
  }

  return <ImageIcon size={14} className='ml-auto text-slate-300' aria-hidden />;
}

export function RfqOffersMobileCompareList({
  offers,
  rfqQuantity,
  rfqUnitName,
  onRowPress,
}: RfqOffersMobileCompareListProps) {
  const metrics = offers.map((o) => computeOfferMetrics(o, rfqQuantity, rfqUnitName));
  const bestGrandTotal = minPositive(metrics.map((m) => m.grandTotal));

  return (
    <div className='overflow-hidden rounded-lg border border-brand-purple/10 bg-white'>
      <div
        className={`grid ${MOBILE_COMPARE_ROW_GRID} items-end gap-x-1 border-b border-brand-purple/10 bg-slate-50/90 px-2 py-2 pl-2.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500`}
        aria-hidden
      >
        <span>โรงงาน</span>
        <span className='text-right'>ราคารวม</span>
        <span className='text-right'>MOQ</span>
        <span className='text-right'>จุดเด่น</span>
        <span className='sr-only'>เปิดรายละเอียด</span>
      </div>

      <ul className='divide-y divide-brand-purple/8'>
        {metrics.map((m) => {
          const isBestPrice = bestGrandTotal != null && m.grandTotal === bestGrandTotal && m.grandTotal > 0;
          const recommended = m.offer.recommended;

          return (
            <li key={m.offer.id}>
              <button
                type='button'
                data-tour='offer-card'
                data-factory-id={m.offer.factoryId}
                aria-label={`ดูรายละเอียด ${m.offer.factoryName}`}
                onClick={() => onRowPress(m.offer)}
                className={`grid w-full ${MOBILE_COMPARE_ROW_GRID} items-center gap-x-1 px-2 py-2.5 pl-2.5 text-left transition-colors active:bg-brand-lavender-chip/25 ${
                  recommended ? RFQ_COMPARE_RECOMMENDED_COL_CLASS : 'bg-white'
                }`}
              >
                <div className='flex min-w-0 items-center gap-1.5'>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                      recommended
                        ? 'border-brand-purple/30 bg-white text-brand-violet-deep'
                        : 'border-brand-purple/12 bg-[var(--brand-page)] text-brand-mauve'
                    }`}
                  >
                    <Factory size={13} />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex min-w-0 items-start gap-1'>
                      <span
                        className={`${MOBILE_CELL_CLAMP_2_CLASS} min-w-0 flex-1 text-[12px] font-semibold leading-snug text-brand-navy-ink`}
                      >
                        {m.offer.factoryName}
                      </span>
                      {m.offer.verified ? (
                        <CheckCircle size={11} className='shrink-0 text-brand-mauve' />
                      ) : null}
                    </div>
                    {recommended ? (
                      <span className='mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-brand-lavender-chip/80 px-1.5 py-px text-[9px] font-semibold text-brand-violet-deep'>
                        <Award size={9} /> แนะนำ
                      </span>
                    ) : null}
                  </div>
                </div>

                <div
                  className={`rounded-md px-1 py-1 text-right ${isBestPrice ? RFQ_COMPARE_BEST_CELL_CLASS : ''}`}
                >
                  {isBestPrice ? (
                    <span className='mb-0.5 block text-[8px] font-bold uppercase tracking-wide text-emerald-700'>
                      ดีสุด
                    </span>
                  ) : null}
                  <span className='block text-[11px] font-bold tabular-nums text-brand-mauve'>
                    {formatCurrency(m.grandTotal)}
                  </span>
                </div>

                <div className='text-right'>
                  <span className='block text-[11px] font-semibold tabular-nums text-brand-navy-ink'>
                    {formatCompactNumber(m.boq.moq)}
                  </span>
                  <span
                    className={`${MOBILE_CELL_CLAMP_2_CLASS} block text-[8px] leading-snug text-slate-400`}
                  >
                    {m.unitLabel || rfqUnitName || 'หน่วย'}
                  </span>
                </div>

                <div className='min-w-0'>
                  <MobileHighlightCell m={m} onRowPress={onRowPress} />
                </div>

                <ChevronRight
                  size={16}
                  className='shrink-0 text-slate-300'
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>

      <p className='border-t border-brand-purple/8 px-2.5 py-2 text-[10px] text-slate-400'>
        แตะแถวเพื่อดูรายละเอียดและยอมรับข้อเสนอ
      </p>
    </div>
  );
}
