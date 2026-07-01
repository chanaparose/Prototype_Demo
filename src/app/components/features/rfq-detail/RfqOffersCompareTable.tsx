import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, ExternalLink, MessageCircle } from 'lucide-react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { TextWithLinks } from '@/components/shared/TextWithLinks';
import { CompareFactoryHeader } from '@/components/features/rfq-detail/compare/CompareFactoryHeader';
import {
  COMPARE_ROWS,
  COMPARE_SECTIONS_ALWAYS_OPEN,
  CompareCell,
  type CompareRowDef,
} from '@/components/features/rfq-detail/compare/CompareTableCells';
import { QuotationHistoryPanel } from '@/components/features/rfq-detail/QuotationHistoryPanel';
import type { OfferItem } from '@/components/features/rfq-detail/RfqDetailOffersSection';
import {
  RFQ_COMPARE_ACTIONS_ROW_CLASS,
  RFQ_COMPARE_CORNER_HEADER_CLASS,
  RFQ_COMPARE_FACTORY_HEADER_CLASS,
  RFQ_COMPARE_HIGHLIGHT_ROW_LABEL_CLASS,
  RFQ_COMPARE_LABEL_STICKY_CLASS,
  RFQ_COMPARE_RECOMMENDED_COL_CLASS,
  RFQ_COMPARE_RECOMMENDED_HEADER_CLASS,
  RFQ_COMPARE_SECTION_ROW_CLASS,
  RFQ_COMPARE_SECTION_TOGGLE_CLASS,
  RFQ_COMPARE_TABLE_SCROLL_CLASS,
  RFQ_COMPARE_TABLE_WRAPPER_CLASS,
} from '@/components/features/rfq-detail/rfqDetailTheme';
import {
  computeOfferMetrics,
  minPositive,
  type OfferMetrics,
} from '@/components/features/rfq-detail/rfqOfferMetrics';
import { Button } from '@/components/ui/button';

export type RfqOffersCompareTableProps = {
  offers: OfferItem[];
  rfqQuantity: number;
  rfqUnitName?: string;
  rfqStatus: string;
  selectedOfferId: string | null;
  onSelectOffer: (id: string | null) => void;
  onChatWithOffer?: (offer: OfferItem) => void;
  onAcceptOffer: (offerId: string, e: React.MouseEvent) => void;
  acceptingId: string | null;
  isRequestClosed: boolean;
  quoteHistories?: Record<
    string,
    import('@/services/api/types/rfq.types').IQuotationHistoryEntry[]
  >;
};

function CompareSectionToggle({
  title,
  expanded,
  onToggle,
  colSpan,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  colSpan: number;
}) {
  return (
    <tr className={RFQ_COMPARE_SECTION_ROW_CLASS}>
      <th scope='colgroup' colSpan={colSpan} className='p-0'>
        <button type='button' onClick={onToggle} className={RFQ_COMPARE_SECTION_TOGGLE_CLASS}>
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
            aria-hidden
          />
          {title}
          {!expanded ? (
            <span className='font-normal normal-case tracking-normal text-slate-400'>— แตะเพื่อขยาย</span>
          ) : null}
        </button>
      </th>
    </tr>
  );
}

function groupRowsBySection(rows: CompareRowDef[]): Map<string, CompareRowDef[]> {
  const map = new Map<string, CompareRowDef[]>();
  for (const row of rows) {
    const list = map.get(row.section) ?? [];
    list.push(row);
    map.set(row.section, list);
  }
  return map;
}

function compareColumnBg(
  m: OfferMetrics,
  opts: { isSelected?: boolean; zebra?: string },
): string {
  if (m.offer.recommended) return RFQ_COMPARE_RECOMMENDED_COL_CLASS;
  if (opts.isSelected) return 'bg-brand-lavender-chip/20';
  return opts.zebra ?? 'bg-white';
}

function factoryHeaderClass(m: OfferMetrics, colMinWidth: string): string {
  const base = m.offer.recommended
    ? RFQ_COMPARE_RECOMMENDED_HEADER_CLASS
    : RFQ_COMPARE_FACTORY_HEADER_CLASS;
  return `${base} ${colMinWidth}`;
}

export function RfqOffersCompareTable({
  offers,
  rfqQuantity,
  rfqUnitName,
  rfqStatus,
  selectedOfferId,
  onSelectOffer,
  onChatWithOffer,
  onAcceptOffer,
  acceptingId,
  isRequestClosed,
  quoteHistories,
}: RfqOffersCompareTableProps) {
  const metrics = offers.map((o) => computeOfferMetrics(o, rfqQuantity, rfqUnitName));
  const visibleRows = COMPARE_ROWS.filter(
    (row) => !row.hideIfEmpty || !row.hideIfEmpty(metrics),
  );
  const sections = useMemo(() => groupRowsBySection(visibleRows), [visibleRows]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(COMPARE_SECTIONS_ALWAYS_OPEN),
  );

  const bestByRow = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const row of visibleRows) {
      if (!row.highlightMin) continue;
      const vals = metrics
        .map((m) => row.highlightMin!(m))
        .filter((v): v is number => v != null && v > 0);
      map.set(row.id, minPositive(vals));
    }
    return map;
  }, [visibleRows, metrics]);

  const colMinWidth = offers.length <= 2 ? 'min-w-[168px]' : 'min-w-[152px]';
  const colSpan = metrics.length + 1;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const expandAll = () => setExpandedSections(new Set(sections.keys()));
  const collapseDetails = () => setExpandedSections(new Set(COMPARE_SECTIONS_ALWAYS_OPEN));

  const allExpanded = [...sections.keys()].every((s) => expandedSections.has(s));

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-end gap-2'>
        <button
          type='button'
          onClick={allExpanded ? collapseDetails : expandAll}
          className='text-[11px] font-medium text-brand-violet-deep/70 hover:text-brand-purple hover:underline'
        >
          {allExpanded ? 'ย่อรายละเอียด' : 'แสดงรายละเอียดทั้งหมด'}
        </button>
      </div>

      <div className={RFQ_COMPARE_TABLE_WRAPPER_CLASS}>
        <div className={RFQ_COMPARE_TABLE_SCROLL_CLASS}>
          <table className='w-full min-w-[560px] border-collapse'>
            <thead>
              <tr>
                <th scope='col' className={RFQ_COMPARE_CORNER_HEADER_CLASS}>
                  รายการ
                </th>
                {metrics.map((m) => (
                  <th
                    key={m.offer.id}
                    scope='col'
                    className={factoryHeaderClass(m, colMinWidth)}
                  >
                    <CompareFactoryHeader
                      m={m}
                      isSelected={selectedOfferId === m.offer.id}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...sections.entries()].map(([sectionTitle, sectionRows]) => {
                const expanded = expandedSections.has(sectionTitle);
                const canCollapse = !COMPARE_SECTIONS_ALWAYS_OPEN.has(sectionTitle);

                return (
                  <React.Fragment key={sectionTitle}>
                    {canCollapse ? (
                      <CompareSectionToggle
                        title={sectionTitle}
                        expanded={expanded}
                        onToggle={() => toggleSection(sectionTitle)}
                        colSpan={colSpan}
                      />
                    ) : (
                      <tr className={RFQ_COMPARE_SECTION_ROW_CLASS}>
                        <th
                          scope='colgroup'
                          colSpan={colSpan}
                          className='px-2.5 py-1 text-left text-[10px] font-bold uppercase tracking-wider text-brand-violet-deep/70'
                        >
                          {sectionTitle}
                        </th>
                      </tr>
                    )}

                    {expanded
                      ? sectionRows.map((row, rowIdx) => {
                          const best = bestByRow.get(row.id) ?? null;
                          const dataBg =
                            rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';

                          return (
                            <tr key={row.id} className='border-b border-brand-purple/5'>
                              <th scope='row' className={RFQ_COMPARE_LABEL_STICKY_CLASS}>
                                {row.label}
                              </th>
                              {metrics.map((m) => {
                                const raw = row.highlightMin?.(m);
                                const isBest = best != null && raw != null && raw === best;
                                const isColSelected = selectedOfferId === m.offer.id;
                                return (
                                  <td
                                    key={m.offer.id}
                                    className={`border-r border-brand-purple/5 p-0 last:border-r-0 ${compareColumnBg(m, {
                                      isSelected: isColSelected,
                                      zebra: dataBg,
                                    })}`}
                                  >
                                    <CompareCell isBest={isBest} align={row.align} compact>
                                      {row.cell(m, rfqUnitName)}
                                    </CompareCell>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      : null}
                  </React.Fragment>
                );
              })}

              <tr className='border-t border-brand-purple/10'>
                <th scope='row' className={RFQ_COMPARE_HIGHLIGHT_ROW_LABEL_CLASS}>
                  จุดเด่น / ภาพแนบ
                </th>
                {metrics.map((m) => {
                  const images = m.boq.image_urls ?? [];
                  const hasHighlight = Boolean(m.offer.factoryHighlight?.trim());
                  return (
                    <td
                      key={m.offer.id}
                      className={`border-r border-brand-purple/5 px-2.5 py-2 align-top last:border-r-0 ${compareColumnBg(m, {})}`}
                    >
                      {hasHighlight ? (
                        <p className='mb-1.5 line-clamp-3 text-[11px] leading-relaxed text-brand-violet-deep'>
                          <TextWithLinks text={m.offer.factoryHighlight} />
                        </p>
                      ) : m.offer.aiReason ? (
                        <p className='mb-1.5 line-clamp-2 text-[11px] text-slate-500'>
                          {m.offer.aiReason}
                        </p>
                      ) : (
                        <p className='mb-1.5 text-center text-[11px] text-slate-300'>—</p>
                      )}
                      {images.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {images.slice(0, 4).map((url, idx) => (
                            <button
                              key={`${url}-${idx}`}
                              type='button'
                              onClick={() => openImageLightbox(url)}
                              className='block h-10 w-10 shrink-0 overflow-hidden rounded-md border border-brand-purple/12 bg-slate-50 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30'
                              aria-label='ดูรูปขนาดใหญ่'
                            >
                              <ImageWithFallback
                                src={url}
                                alt=''
                                className='h-full w-full object-cover'
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className='text-center text-[10px] text-slate-400'>ไม่มีภาพ</p>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr className={RFQ_COMPARE_ACTIONS_ROW_CLASS}>
                <th
                  scope='row'
                  className={`${RFQ_COMPARE_LABEL_STICKY_CLASS} py-2 font-semibold text-brand-navy-ink`}
                >
                  ดำเนินการ
                </th>
                {metrics.map((m) => {
                  const { offer } = m;
                  const isSelected = selectedOfferId === offer.id;
                  return (
                    <td
                      key={offer.id}
                      className={`border-r border-brand-purple/5 px-2 py-2 align-top last:border-r-0 ${compareColumnBg(m, {
                        isSelected,
                      })}`}
                    >
                      <div className='flex flex-col gap-1.5'>
                        <button
                          type='button'
                          onClick={() => onSelectOffer(isSelected ? null : offer.id)}
                          className='text-left text-[10px] text-slate-500 hover:text-brand-purple hover:underline'
                        >
                          {isSelected ? 'ซ่อนประวัติ' : 'ประวัติใบเสนอราคา'}
                        </button>
                        <div className='flex gap-1.5'>
                          {onChatWithOffer ? (
                            <Button
                              variant='unstyled'
                              type='button'
                              onClick={() => onChatWithOffer(offer)}
                              className='flex flex-1 items-center justify-center gap-1 rounded-md border border-brand-mauve/35 py-1.5 text-[11px] font-semibold text-brand-mauve hover:bg-brand-lavender-chip/40'
                            >
                              <MessageCircle size={12} /> แชท
                            </Button>
                          ) : null}
                          {m.isAccepted ? (
                            offer.orderId ? (
                              <Link
                                to={`/orders/${offer.orderId}`}
                                className='flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100/80'
                              >
                                <ExternalLink size={11} />
                                คำสั่งซื้อ
                              </Link>
                            ) : (
                              <Button
                                variant='unstyled'
                                type='button'
                                disabled
                                className='flex-1 rounded-md py-1.5 text-[11px] font-semibold text-white disabled:opacity-60'
                                style={{ background: 'var(--status-success)' }}
                              >
                                ยอมรับแล้ว
                              </Button>
                            )
                          ) : m.isExpired ? (
                            <Button
                              variant='unstyled'
                              type='button'
                              disabled
                              className='flex-1 rounded-md bg-orange-500 py-1.5 text-[11px] font-semibold text-white disabled:opacity-70'
                            >
                              หมดอายุ
                            </Button>
                          ) : isRequestClosed ? (
                            <Button
                              variant='unstyled'
                              type='button'
                              disabled
                              className='flex-1 rounded-md bg-slate-400 py-1.5 text-[11px] font-semibold text-white disabled:opacity-70'
                            >
                              {rfqStatus === 'cancelled'
                                ? 'ยกเลิกแล้ว'
                                : rfqStatus === 'expired'
                                  ? 'หมดอายุ'
                                  : rfqStatus === 'closed'
                                    ? 'ปิดรับแล้ว'
                                    : 'ปิดคำขอแล้ว'}
                            </Button>
                          ) : (
                            <Button
                              variant='unstyled'
                              type='button'
                              onClick={(e) => onAcceptOffer(offer.id, e)}
                              disabled={!!acceptingId || m.isRejected}
                              className='flex-1 rounded-md py-1.5 text-[11px] font-semibold text-white disabled:opacity-60'
                              style={{
                                background: m.isRejected ? '#94A3B8' : 'var(--brand-mauve)',
                              }}
                            >
                              {acceptingId === offer.id
                                ? 'กำลังส่ง...'
                                : m.isRejected
                                  ? 'ไม่ได้รับการเลือก'
                                  : 'ยอมรับ'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {selectedOfferId ? (
        <div className='rounded-lg border border-brand-purple/10 bg-white p-3'>
          <p className='mb-2 text-[12px] font-semibold text-brand-navy-ink'>ประวัติใบเสนอราคา</p>
          <QuotationHistoryPanel
            quotationId={selectedOfferId}
            preloadedHistory={quoteHistories?.[selectedOfferId]}
          />
        </div>
      ) : null}
    </div>
  );
}
