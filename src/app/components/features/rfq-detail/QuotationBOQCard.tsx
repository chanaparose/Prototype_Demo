import React from 'react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { BadgeCheck, Calendar, Package, Shield, Truck } from 'lucide-react';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
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

const MIDNIGHT = 'var(--brand-navy)';
const PLUM = 'var(--brand-mauve)';
const PLUM_SOFT = 'var(--brand-page)';

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
  const moq = detail?.moq ?? qtyBase;
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
  return (
    <div className={`space-y-4 border-t border-gray-100 ${className}`}>
      <p className='text-[11px] font-bold uppercase tracking-wide text-gray-400 pt-1'>
        รายละเอียด BOQ
      </p>

      <div className='grid gap-3 sm:grid-cols-2'>
        <DetailRow icon={<Truck size={14} />} label='การจัดส่ง' value={q.shipping_method} />
        <DetailRow
          icon={<Calendar size={14} />}
          label='ใบเสนอราคาถึง'
          value={formatValidUntil(q.valid_until)}
        />
      </div>

      <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
        <MetricTile label='ค่าแม่พิมพ์' value={formatCurrency(q.mold_cost)} />
        <MetricTile label='MOQ' value={`${formatCompactNumber(q.moq)} ชิ้น`} />
        <MetricTile label='Lead time' value={`${q.lead_time_days} วัน`} />
      </div>

      {q.certifications.length > 0 && (
        <div>
          <div className='mb-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-500'>
            <Shield size={14} className='text-brand-mauve' />
            ใบรับรอง & ความน่าเชื่อถือ
          </div>
          <ul className='flex flex-wrap gap-2'>
            {q.certifications.map((c) => (
              <li key={c}>
                <StatusBadge variant='active' size='sm' icon={<BadgeCheck size={12} />}>
                  {c}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(q.image_urls) && q.image_urls.length > 0 && (
        <div>
          <div className='mb-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-500'>
            <Package size={14} className='text-brand-mauve' />
            ภาพแนบจากใบเสนอราคา
          </div>
          <div className='grid grid-cols-3 sm:grid-cols-5 gap-2'>
            {q.image_urls.slice(0, 5).map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type='button'
                onClick={() => openImageLightbox(url)}
                className='block aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 focus:outline-none active:opacity-80'
                aria-label='ดูรูปขนาดใหญ่'
              >
                <ImageWithFallback src={url} alt='' className='w-full h-full object-cover' />
              </button>
            ))}
          </div>
        </div>
      )}
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

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='rounded-xl border border-gray-100 bg-gray-50/50 p-3'>
      <div className='mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500'>
        <span className='text-brand-mauve' aria-hidden>
          {icon}
        </span>
        {label}
      </div>
      <p className='text-xs leading-relaxed text-gray-800'>{value}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl px-3 py-2.5' style={{ backgroundColor: PLUM_SOFT }}>
      <p className='text-[9px] font-semibold uppercase tracking-wide text-gray-500'>{label}</p>
      <p className='mt-0.5 text-xs font-bold' style={{ color: MIDNIGHT }}>
        {value}
      </p>
    </div>
  );
}
