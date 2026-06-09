import React from 'react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { BadgeCheck, Calendar, Package, Shield, Truck } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';

function mapQuotationStatus(qSt: string): 'Pending' | 'Accepted' | 'Rejected' | 'Expired' {
  const statusMap: Record<string, 'Pending' | 'Accepted' | 'Rejected' | 'Expired'> = {
    AC: 'Accepted',
    RJ: 'Rejected',
    EX: 'Expired',
  };
  return statusMap[qSt] ?? 'Pending';
}

export interface Quotation {
  quote_id: number;
  factory_name: string;
  price_per_piece: number;
  mold_cost: number;
  moq: number;
  lead_time_days: number;
  shipping_method: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  material_detail: string;
  payment_condition: string;
  sample_cost: number;
  valid_until: string;
  validity_days?: number;
  certifications: string[];
  subtotal?: number;
  discount_amount?: number;
  shipping_cost?: number;
  packaging_cost?: number;
  tooling_mold_cost?: number;
  vat_rate?: number;
  vat_amount?: number;
  grand_total?: number;
  platform_commission_rate?: number;
  platform_commission_amount?: number;
  factory_net_receivable?: number;
  image_urls?: string[];
  factory_qty?: number | null;
  factory_unit_id?: number | null;
  factory_unit_name?: string | null;
}

/** ข้อมูลจาก OfferItem / API สำหรับสร้าง Quotation แบบเต็ม (เติมค่า default ถ้าขาด) */
export type QuotationOfferSource = {
  id: string;
  factoryName: string;
  price: number;
  leadTime: number;
  quoteStatus?: string;
  quotationDetail?: Partial<Quotation>;
};

export function quotationFromOfferSource(
  offer: QuotationOfferSource,
  rfqQuantity: number,
): Quotation {
  const detail = offer.quotationDetail;
  const qtyBase = rfqQuantity > 0 ? rfqQuantity : 1000;
  const moq =
    (detail?.factory_qty != null && detail.factory_qty > 0)
      ? detail.factory_qty
      : detail?.moq ?? qtyBase;
  const numericId = parseInt(String(offer.id).replace(/\D/g, ''), 10);
  const quote_id =
    detail?.quote_id ??
    (Number.isFinite(numericId) && numericId > 0
      ? numericId
      : Math.abs(
          String(offer.id)
            .split('')
            .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1_000_000_000,
        ));
  const pricePerPiece = detail?.price_per_piece ?? (moq > 0 ? offer.price / moq : offer.price);
  const qSt = (offer.quoteStatus ?? 'PD').toUpperCase();
  const status: Quotation['status'] = detail?.status ?? mapQuotationStatus(qSt);

  return {
    quote_id,
    factory_name: detail?.factory_name ?? offer.factoryName,
    price_per_piece: Math.round(pricePerPiece * 100) / 100,
    mold_cost: detail?.mold_cost ?? 0,
    moq,
    lead_time_days: detail?.lead_time_days ?? offer.leadTime,
    shipping_method: detail?.shipping_method ?? 'ตามที่ตกลงกับโรงงาน',
    status,
    material_detail:
      detail?.material_detail ??
      'รายละเอียดวัสดุและสเปก — โรงงานจะยืนยันอีกครั้งหลังส่งใบเสนอราคาอย่างเป็นทางการ',
    payment_condition: detail?.payment_condition ?? 'มัดจำ / งวดงาน ตามข้อตกลงกับโรงงาน',
    sample_cost: detail?.sample_cost ?? 0,
    valid_until: detail?.valid_until ?? '',
    validity_days: detail?.validity_days,
    certifications: detail?.certifications ?? [],
    subtotal: detail?.subtotal,
    discount_amount: detail?.discount_amount,
    shipping_cost: detail?.shipping_cost,
    packaging_cost: detail?.packaging_cost,
    tooling_mold_cost: detail?.tooling_mold_cost,
    vat_rate: detail?.vat_rate,
    vat_amount: detail?.vat_amount,
    grand_total: detail?.grand_total,
    platform_commission_rate: detail?.platform_commission_rate,
    platform_commission_amount: detail?.platform_commission_amount,
    factory_net_receivable: detail?.factory_net_receivable,
    image_urls: Array.isArray(detail?.image_urls)
      ? detail.image_urls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      : [],
    factory_qty: detail?.factory_qty ?? null,
    factory_unit_id: detail?.factory_unit_id ?? null,
    factory_unit_name: detail?.factory_unit_name ?? null,
  };
}

export type QuotationBOQDetailsPanelProps = {
  quotation: Quotation;
  className?: string;
};

export function QuotationBOQDetailsPanel({
  quotation: q,
  className = '',
}: QuotationBOQDetailsPanelProps) {
  const validUntil = formatValidUntil(q.valid_until);
  const validityDays =
    q.validity_days != null && q.validity_days > 0 ? `${q.validity_days} วัน` : null;
  const expiryLabel =
    validUntil !== '—'
      ? validityDays
        ? `${validUntil} (${validityDays})`
        : validUntil
      : validityDays ?? '—';
  const hasImages = Array.isArray(q.image_urls) && q.image_urls.length > 0;
  const hasCerts = q.certifications.length > 0;

  return (
    <div className={`border-t border-gray-100 pt-2 space-y-2 ${className}`}>
      <div className='grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2'>
        <CompactItem icon={<Truck size={12} />} label='การจัดส่ง' value={q.shipping_method} />
        <CompactItem icon={<Calendar size={12} />} label='หมดอายุ' value={expiryLabel} />
        {q.mold_cost > 0 ? (
          <CompactItem label='ค่าแม่พิมพ์' value={formatCurrency(q.mold_cost)} />
        ) : null}
      </div>

      {hasCerts ? (
        <div className='flex flex-wrap items-center gap-1.5'>
          <Shield size={11} className='shrink-0 text-brand-mauve' aria-hidden />
          <ul className='flex flex-wrap gap-1'>
            {q.certifications.map((c) => (
              <li key={c}>
                <StatusBadge variant='active' size='sm' icon={<BadgeCheck size={10} />}>
                  {c}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasImages ? (
        <div className='flex items-center gap-1.5'>
          <Package size={11} className='shrink-0 text-brand-mauve' aria-hidden />
          <div className='flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5'>
            {q.image_urls!.slice(0, 5).map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type='button'
                onClick={() => openImageLightbox(url)}
                className='block h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 focus:outline-none active:opacity-80'
                aria-label='ดูรูปขนาดใหญ่'
              >
                <ImageWithFallback src={url} alt='' className='h-full w-full object-cover' />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatValidUntil(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T12:00:00'));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function CompactItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='flex min-w-0 items-start gap-1 text-[11px] leading-snug'>
      {icon ? (
        <span className='mt-px shrink-0 text-brand-mauve' aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className='shrink-0 text-gray-500'>{label}:</span>
      <span className='min-w-0 font-medium text-gray-800'>{value}</span>
    </div>
  );
}
