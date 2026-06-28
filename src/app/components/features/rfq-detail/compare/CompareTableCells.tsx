import React from 'react';
import { BadgeCheck, CheckCircle, Star } from 'lucide-react';
import { RFQ_COMPARE_BEST_CELL_CLASS } from '@/components/features/rfq-detail/rfqDetailTheme';
import type { OfferMetrics } from '@/components/features/rfq-detail/rfqOfferMetrics';
import { formatQuoteValidUntil } from '@/components/features/rfq-detail/rfqOfferMetrics';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';

export type CompareRowDef = {
  id: string;
  label: string;
  section: string;
  align?: 'center' | 'left';
  hideIfEmpty?: (all: OfferMetrics[]) => boolean;
  highlightMin?: (m: OfferMetrics) => number | null;
  cell: (m: OfferMetrics, rfqUnitName?: string) => React.ReactNode;
};

export function CompareCell({
  isBest,
  align = 'center',
  children,
  compact = false,
}: {
  isBest: boolean;
  align?: 'center' | 'left';
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center text-[12px] leading-snug text-brand-navy-ink/90 tabular-nums ${
        compact ? 'min-h-[2rem] px-2.5 py-1.5' : 'min-h-[2.25rem] px-2.5 py-2'
      } ${align === 'left' ? 'justify-start text-left' : 'justify-center text-center'} ${
        isBest ? RFQ_COMPARE_BEST_CELL_CLASS : ''
      }`}
    >
      {isBest ? (
        <span
          className={`inline-flex items-center gap-1 ${align === 'left' ? '' : 'flex-wrap justify-center'}`}
        >
          <span
            className='shrink-0 rounded bg-emerald-600 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-white'
            title='ค่าที่ดีที่สุด'
          >
            ดีสุด
          </span>
          {children}
        </span>
      ) : (
        children
      )}
    </div>
  );
}

export const COMPARE_ROWS: CompareRowDef[] = [
  {
    id: 'rating',
    section: 'ภาพรวม',
    label: 'คะแนน',
    cell: (m) => (
      <span className='inline-flex items-center gap-1'>
        <Star size={11} className='shrink-0 text-amber-400 fill-amber-400' />
        <span className='font-semibold'>{m.offer.rating}</span>
        <span className='text-slate-400'>({m.offer.completedOrders})</span>
      </span>
    ),
  },
  {
    id: 'price_per_piece',
    section: 'ราคาและจำนวน',
    label: 'ราคา/หน่วย',
    highlightMin: (m) => (m.boq.price_per_piece > 0 ? m.boq.price_per_piece : null),
    cell: (m) => (
      <span className='font-semibold text-brand-violet-deep'>
        {formatCurrency(m.boq.price_per_piece)}
      </span>
    ),
  },
  {
    id: 'lead_time',
    section: 'ราคาและจำนวน',
    label: 'Lead time',
    highlightMin: (m) => (m.boq.lead_time_days > 0 ? m.boq.lead_time_days : null),
    cell: (m) => (
      <>
        <span className='font-semibold'>{m.boq.lead_time_days}</span>
        <span className='ml-0.5 text-slate-400'>วัน</span>
      </>
    ),
  },
  {
    id: 'grand_total_offer',
    section: 'ราคาและจำนวน',
    label: 'ราคารวมเสนอ',
    highlightMin: (m) => (m.grandTotal > 0 ? m.grandTotal : null),
    cell: (m) => (
      <span className='font-bold text-brand-mauve'>{formatCurrency(m.grandTotal)}</span>
    ),
  },
  {
    id: 'moq',
    section: 'ราคาและจำนวน',
    label: 'MOQ',
    cell: (m, rfqUnitName) => (
      <>
        {formatCompactNumber(m.boq.moq)}{' '}
        <span className='text-slate-400'>{m.unitLabel || rfqUnitName || 'หน่วย'}</span>
      </>
    ),
  },
  {
    id: 'subtotal',
    section: 'ค่าใช้จ่าย',
    label: 'สินค้ารวม',
    cell: (m) => formatCurrency(m.subtotal),
  },
  {
    id: 'shipping',
    section: 'ค่าใช้จ่าย',
    label: 'ขนส่ง',
    hideIfEmpty: (all) => !all.some((x) => x.shippingCost > 0),
    cell: (m) => (m.shippingCost > 0 ? formatCurrency(m.shippingCost) : '—'),
  },
  {
    id: 'packaging',
    section: 'ค่าใช้จ่าย',
    label: 'บรรจุภัณฑ์',
    hideIfEmpty: (all) => !all.some((x) => x.packagingCost > 0),
    cell: (m) => (m.packagingCost > 0 ? formatCurrency(m.packagingCost) : '—'),
  },
  {
    id: 'mold',
    section: 'ค่าใช้จ่าย',
    label: 'แม่พิมพ์',
    hideIfEmpty: (all) => !all.some((x) => x.toolingMoldCost > 0),
    cell: (m) => (m.toolingMoldCost > 0 ? formatCurrency(m.toolingMoldCost) : '—'),
  },
  {
    id: 'discount',
    section: 'ค่าใช้จ่าย',
    label: 'ส่วนลด',
    hideIfEmpty: (all) => !all.some((x) => x.discountAmount > 0),
    cell: (m) =>
      m.discountAmount > 0 ? (
        <span className='font-semibold text-emerald-700'>-{formatCurrency(m.discountAmount)}</span>
      ) : (
        '—'
      ),
  },
  {
    id: 'vat',
    section: 'ค่าใช้จ่าย',
    label: 'VAT',
    cell: (m) => (
      <>
        {m.vatRate > 0 ? <span className='text-slate-400'>{m.vatRate}% · </span> : null}
        {formatCurrency(m.vatAmount)}
      </>
    ),
  },
  {
    id: 'total',
    section: 'ค่าใช้จ่าย',
    label: 'รวมทั้งหมด',
    highlightMin: (m) => (m.grandTotal > 0 ? m.grandTotal : null),
    cell: (m) => (
      <span className='font-bold text-brand-mauve'>{formatCurrency(m.grandTotal)}</span>
    ),
  },
  {
    id: 'status',
    section: 'เงื่อนไข',
    label: 'สถานะ',
    cell: (m) => {
      if (m.isAccepted) {
        return (
          <span className='inline-flex items-center gap-0.5 font-semibold text-emerald-700'>
            <CheckCircle size={11} /> ยอมรับแล้ว
          </span>
        );
      }
      if (m.isRejected) return <span className='text-slate-500'>ไม่ได้รับการเลือก</span>;
      if (m.isExpired) return <span className='font-semibold text-orange-600'>หมดอายุ</span>;
      return <span className='text-brand-violet-deep'>รอดำเนินการ</span>;
    },
  },
  {
    id: 'valid_until',
    section: 'เงื่อนไข',
    label: 'ถึงวันที่',
    align: 'left',
    cell: (m) =>
      m.boq.valid_until ? formatQuoteValidUntil(m.boq.valid_until) : m.offer.aiReason || '—',
  },
  {
    id: 'shipping_method',
    section: 'เงื่อนไข',
    label: 'การจัดส่ง',
    align: 'left',
    cell: (m) => m.boq.shipping_method || '—',
  },
  {
    id: 'material',
    section: 'เงื่อนไข',
    label: 'วัสดุ / สเปก',
    align: 'left',
    cell: (m) => (
      <span className='line-clamp-3 text-[11px] leading-relaxed'>{m.boq.material_detail}</span>
    ),
  },
  {
    id: 'payment',
    section: 'เงื่อนไข',
    label: 'ชำระเงิน',
    align: 'left',
    cell: (m) => (
      <span className='line-clamp-2 text-[11px] leading-relaxed'>{m.boq.payment_condition}</span>
    ),
  },
  {
    id: 'sample',
    section: 'เงื่อนไข',
    label: 'ค่าตัวอย่าง',
    hideIfEmpty: (all) => !all.some((x) => x.boq.sample_cost > 0),
    cell: (m) => (m.boq.sample_cost > 0 ? formatCurrency(m.boq.sample_cost) : '—'),
  },
  {
    id: 'certs',
    section: 'เงื่อนไข',
    label: 'ใบรับรอง',
    hideIfEmpty: (all) => !all.some((x) => x.boq.certifications.length > 0),
    cell: (m) =>
      m.boq.certifications.length > 0 ? (
        <ul className='flex flex-wrap justify-center gap-0.5'>
          {m.boq.certifications.map((c) => (
            <li key={c}>
              <StatusBadge variant='active' size='sm' icon={<BadgeCheck size={9} />}>
                {c}
              </StatusBadge>
            </li>
          ))}
        </ul>
      ) : (
        '—'
      ),
  },
];

/** Sections expanded by default — core comparison only */
export const COMPARE_SECTIONS_ALWAYS_OPEN = new Set(['ภาพรวม', 'ราคาและจำนวน']);
