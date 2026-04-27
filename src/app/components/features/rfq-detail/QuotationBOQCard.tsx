import React, { useCallback, useId, useState } from 'react';
import {
  BadgeCheck,
  Calendar,
  ChevronDown,
  CreditCard,
  Factory,
  Package,
  Shield,
  Sparkles,
  Timer,
  Truck,
} from 'lucide-react';
import { ImageWithFallback } from '../../shared';

/** ใบเสนอราคา (BOQ) จากโรงงาน — ใช้กับ BOQ Explorer / เปรียบเทียบข้อเสนอ */
export interface Quotation {
  quote_id: number;
  factory_name: string;
  price_per_piece: number;
  mold_cost: number;
  moq: number;
  lead_time_days: number;
  shipping_method: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
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
}

const MIDNIGHT = '#2E2252';
const PLUM = '#7A4B94';
const PLUM_SOFT = '#F8F6FA';

const STATUS_STYLES: Record<
  Quotation['status'],
  { label: string; className: string; dot: string }
> = {
  Pending: {
    label: 'รอพิจารณา',
    className: 'bg-amber-50 text-amber-900 ring-amber-200/80',
    dot: 'bg-amber-500',
  },
  Accepted: {
    label: 'ยอมรับแล้ว',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  Rejected: {
    label: 'ไม่ได้รับเลือก',
    className: 'bg-slate-100 text-slate-600 ring-slate-200/80',
    dot: 'bg-slate-400',
  },
};

function formatTHB(n: number): string {
  return (
    '฿' +
    n.toLocaleString('th-TH', {
      minimumFractionDigits: n % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
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
  const moq = detail?.moq ?? qtyBase;
  const numericId = parseInt(String(offer.id).replace(/\D/g, ''), 10);
  const quote_id =
    detail?.quote_id ??
    (Number.isFinite(numericId) && numericId > 0
      ? numericId
      : Math.abs(
          String(offer.id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1_000_000_000,
        ));
  const pricePerPiece =
    detail?.price_per_piece ?? (moq > 0 ? offer.price / moq : offer.price);
  const qSt = (offer.quoteStatus ?? 'PD').toUpperCase();
  const status: Quotation['status'] =
    detail?.status ??
    (qSt === 'AC' ? 'Accepted' : qSt === 'RJ' ? 'Rejected' : 'Pending');

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
    payment_condition:
      detail?.payment_condition ?? 'มัดจำ / งวดงาน ตามข้อตกลงกับโรงงาน',
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

export const MOCK_QUOTATION_BOQ: Quotation = {
  quote_id: 1042,
  factory_name: 'โรงงานบรรจุภัณฑ์สัตว์เลี้ยง พรีเมียร์แพ็ค',
  price_per_piece: 14.5,
  mold_cost: 8500,
  moq: 3000,
  lead_time_days: 18,
  shipping_method: 'ขนส่งเต็มคัน (FTL) — กรุงเทพฯ และปริมณฑล',
  status: 'Pending',
  material_detail:
    'กระดาษคราฟท์ 350 gsm, เคลือบด้าน, พิมพ์ 4 สี + Spot UV โลโก้, กาวเป็นมิตรต่อสิ่งแวดล้อม',
  payment_condition: 'มัดจำ 40% หลังสั่งผลิต, 60% ก่อนจัดส่ง (โอน/T/T)',
  sample_cost: 2500,
  valid_until: '2026-05-15',
  certifications: ['ISO 9001', 'GMP สำหรับบรรจุภัณฑ์สัมผัสอาหาร', 'FSC (กระดาษรีไซเคิล)'],
};

export type QuotationBOQCardProps = {
  quotation: Quotation;
  defaultExpanded?: boolean;
  className?: string;
  onToggle?: (expanded: boolean) => void;
};

export function QuotationBOQCard({
  quotation: q,
  defaultExpanded = false,
  className = '',
  onToggle,
}: QuotationBOQCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const headerId = useId();
  const st = STATUS_STYLES[q.status];

  const toggle = useCallback(() => {
    setExpanded((v) => {
      const next = !v;
      onToggle?.(next);
      return next;
    });
  }, [onToggle]);

  const estLineTotal = q.price_per_piece * q.moq + q.mold_cost;

  return (
    <article
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <button
        type="button"
        id={headerId}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
        className="flex w-full items-start gap-3 rounded-2xl p-4 text-left outline-none ring-[#7A4B94] ring-offset-2 transition-colors hover:bg-gray-50/80 focus-visible:ring-2"
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: PLUM_SOFT }}
          aria-hidden
        >
          <Factory size={20} style={{ color: PLUM }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold" style={{ color: MIDNIGHT }}>
              {q.factory_name}
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${st.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            ใบเสนอราคา #{q.quote_id}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="font-semibold" style={{ color: PLUM }}>
              {formatTHB(q.price_per_piece)}
              <span className="font-normal text-gray-500"> / ชิ้น</span>
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <Timer size={12} className="shrink-0 text-gray-400" />
              {q.lead_time_days} วัน
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <Package size={12} className="shrink-0 text-gray-400" />
              MOQ {q.moq.toLocaleString('th-TH')} ชิ้น
            </span>
          </div>
          <p className="mt-2 text-[10px] text-gray-400">
            ประมาณการรวม (MOQ + แม่พิมพ์):{' '}
            <span className="font-semibold text-gray-600">{formatTHB(estLineTotal)}</span>
          </p>
        </div>
        <ChevronDown
          size={22}
          className={`shrink-0 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div id={panelId} role="region" aria-labelledby={headerId} className="overflow-hidden min-h-0">
          <QuotationBOQDetailsPanel quotation={q} className="px-4 pb-5 pt-2" />
        </div>
      </div>
    </article>
  );
}

export type QuotationBOQDetailsPanelProps = {
  quotation: Quotation;
  className?: string;
};

/** เนื้อหา BOQ แบบขยาย — ใช้ภายในการ์ดเปรียบเทียบใบเสนอราคาได้ */
export function QuotationBOQDetailsPanel({ quotation: q, className = '' }: QuotationBOQDetailsPanelProps) {
  return (
    <div className={`space-y-4 border-t border-gray-100 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 pt-1">
        รายละเอียด BOQ
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow icon={<Sparkles size={14} />} label="วัสดุ & สเปก" value={q.material_detail} />
        <DetailRow icon={<Truck size={14} />} label="การจัดส่ง" value={q.shipping_method} />
        <DetailRow icon={<CreditCard size={14} />} label="เงื่อนไขการชำระ" value={q.payment_condition} />
        <DetailRow
          icon={<Calendar size={14} />}
          label="ใบเสนอราคาถึง"
          value={formatValidUntil(q.valid_until)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricTile label="ค่าแม่พิมพ์" value={formatTHB(q.mold_cost)} />
        <MetricTile label="ค่าตัวอย่าง" value={formatTHB(q.sample_cost)} />
        <MetricTile label="MOQ" value={`${q.moq.toLocaleString('th-TH')} ชิ้น`} />
        <MetricTile label="Lead time" value={`${q.lead_time_days} วัน`} />
      </div>

      {q.certifications.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
            <Shield size={14} className="text-[#7A4B94]" />
            ใบรับรอง & ความน่าเชื่อถือ
          </div>
          <ul className="flex flex-wrap gap-2">
            {q.certifications.map((c) => (
              <li
                key={c}
                className="inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50/80 px-2.5 py-1 text-[10px] font-semibold text-violet-900"
              >
                <BadgeCheck size={12} className="text-violet-600" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(q.image_urls) && q.image_urls.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
            <Package size={14} className="text-[#7A4B94]" />
            ภาพแนบจากใบเสนอราคา
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {q.image_urls.slice(0, 5).map((url, idx) => (
              <a
                key={`${url}-${idx}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
              >
                <ImageWithFallback src={url} alt="" className="w-full h-full object-cover" />
              </a>
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
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
        <span className="text-[#7A4B94]" aria-hidden>
          {icon}
        </span>
        {label}
      </div>
      <p className="text-xs leading-relaxed text-gray-800">{value}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ backgroundColor: PLUM_SOFT }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-xs font-bold" style={{ color: MIDNIGHT }}>
        {value}
      </p>
    </div>
  );
}
