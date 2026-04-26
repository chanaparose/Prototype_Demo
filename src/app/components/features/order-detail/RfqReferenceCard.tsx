import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, DollarSign, Clock, Wrench } from 'lucide-react';
import type { RfqNestedDTO, QuoteNestedDTO } from '../../../types/api';
import { rfqsApi } from '../../../services/api';
import { summarizeRfqAddress } from '../../../utils/rfqAddressSummary';
import { OrderPhotoGallery } from './OrderPhotoGallery';

interface Props {
  rfq: RfqNestedDTO;
  variant?: 'accordion';
  defaultOpen?: boolean;
  /** Optional quotation details to show alongside the RFQ spec */
  quotation?: QuoteNestedDTO | null;
}

export function RfqReferenceCard({ rfq, defaultOpen = false, quotation }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [rfqDetail, setRfqDetail] = useState<Record<string, unknown> | null>(null);
  const [rfqLoading, setRfqLoading] = useState(false);
  const [rfqError, setRfqError] = useState('');

  useEffect(() => {
    let mounted = true;
    const rfqId = Number(rfq.rfq_id ?? 0);
    if (!Number.isFinite(rfqId) || rfqId <= 0) return () => void 0;
    const load = async () => {
      setRfqLoading(true);
      setRfqError('');
      try {
        const res = await rfqsApi.get(rfqId);
        const payload = res.rfq;
        const row: Record<string, unknown> =
          payload && typeof payload === 'object'
            ? (payload as unknown as Record<string, unknown>)
            : (res as unknown as Record<string, unknown>);
        if (!mounted) return;
        setRfqDetail(row);
      } catch (e) {
        if (!mounted) return;
        setRfqError(e instanceof Error ? e.message : 'โหลดข้อมูล RFQ ไม่สำเร็จ');
      } finally {
        if (mounted) setRfqLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [rfq.rfq_id]);

  const data = rfqDetail ?? (rfq as unknown as Record<string, unknown>);
  const quantity = Math.max(0, Number(data.quantity ?? rfq.quantity ?? 0) || 0);
  const categoryName = String(data.category_name ?? rfq.category_name ?? '').trim() || '-';
  const subCategoryName = String(data.sub_category_name ?? data.subCategoryName ?? '').trim();
  const subCategoryId = Number(data.sub_category_id ?? data.subCategoryId ?? 0);
  const shippingMethodName = String(data.shipping_method_name ?? data.shippingMethodName ?? '').trim();
  const deliveryAddress = summarizeRfqAddress(data);
  const materialGrade = String(data.material_grade ?? data.materialGrade ?? '').trim();
  const tolerance = String(data.tolerance ?? '').trim();
  const colorFinish = String(data.color_finish ?? data.colorFinish ?? '').trim();
  const dimensionSpec = String(data.dimension_spec ?? data.dimensionSpec ?? '').trim();
  const weightTargetG = Number(data.weight_target_g ?? data.weightTargetG ?? 0);
  const packagingSpec = String(data.packaging_spec ?? data.packagingSpec ?? '').trim();
  const targetLeadTimeDays = Number(data.target_lead_time_days ?? data.targetLeadTimeDays ?? 0);
  const requiredDeliveryDateRaw = String(
    data.required_delivery_date ?? data.requiredDeliveryDate ?? '',
  ).trim();
  const deadlineRaw = String(data.deadline ?? data.target_date ?? data.delivery_deadline ?? rfq.deadline_date ?? '').trim();
  const inspectionType = String(data.inspection_type ?? data.inspectionType ?? '').trim();
  const sampleRequired = Boolean(data.sample_required ?? data.sampleRequired);
  const sampleQty = Number(data.sample_qty ?? data.sampleQty ?? 0);
  const budgetTotal = Number(
    data.total_budget ??
      data.target_total_budget ??
      data.budget_total ??
      data.target_unit_price ??
      0,
  );
  const description = String(data.details ?? data.description ?? rfq.details ?? '').trim();
  const certifications = useMemo(() => {
    const input = data.certifications_required ?? data.certificationsRequired;
    if (Array.isArray(input)) {
      return input.map((x) => String(x ?? '').trim()).filter(Boolean);
    }
    if (typeof input === 'string' && input.trim()) {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x ?? '').trim()).filter(Boolean);
      } catch {
        return [input.trim()];
      }
    }
    return [] as string[];
  }, [data.certifications_required, data.certificationsRequired]);

  const imageUrls = useMemo(() => {
    const fromImages =
      Array.isArray(rfq.images) && rfq.images.length > 0
        ? rfq.images.map((img) => String(img.image_url ?? '').trim()).filter(Boolean)
        : [];
    const collect = (input: unknown): string[] => {
      if (!input) return [];
      if (Array.isArray(input)) {
        return input
          .map((x) => {
            if (typeof x === 'string') return x.trim();
            if (x && typeof x === 'object') {
              const o = x as Record<string, unknown>;
              return String(o.url ?? o.image_url ?? o.public_url ?? '').trim();
            }
            return '';
          })
          .filter(Boolean);
      }
      if (typeof input === 'string' && input.trim().startsWith('[')) {
        try {
          return collect(JSON.parse(input));
        } catch {
          return [];
        }
      }
      return [];
    };
    const urls = [
      ...collect(data.reference_images),
      ...collect(data.image_urls),
      ...collect(data.images),
      ...fromImages,
    ];
    return Array.from(new Set(urls)).slice(0, 5);
  }, [data.image_urls, data.images, data.reference_images, rfq.images]);

  const inspectionTypeLabel =
    inspectionType === 'self'
      ? 'ตรวจสอบโดยโรงงาน'
      : inspectionType === 'third_party'
        ? 'ตรวจสอบโดยหน่วยงานภายนอก'
        : inspectionType === 'buyer_onsite'
          ? 'ผู้ซื้อเข้าตรวจที่โรงงาน'
          : inspectionType;

  const deadlineLabel =
    deadlineRaw && deadlineRaw.includes('T') ? deadlineRaw.split('T')[0] : deadlineRaw;
  const requiredDeliveryDateLabel =
    requiredDeliveryDateRaw && requiredDeliveryDateRaw.includes('T')
      ? requiredDeliveryDateRaw.split('T')[0]
      : requiredDeliveryDateRaw;

  const specRows = [
    { label: 'ประเภทการผลิต', value: categoryName },
    ...(subCategoryName || (Number.isFinite(subCategoryId) && subCategoryId > 0)
      ? [{ label: 'ประเภทย่อย', value: subCategoryName || '—' }]
      : []),
    ...(shippingMethodName ? [{ label: 'วิธีส่งของ', value: shippingMethodName }] : []),
    ...(deliveryAddress ? [{ label: 'ที่อยู่จัดส่ง', value: deliveryAddress }] : []),
    { label: 'จำนวน', value: `${quantity.toLocaleString('th-TH')} ชิ้น` },
    ...(materialGrade ? [{ label: 'Material grade', value: materialGrade }] : []),
    ...(tolerance ? [{ label: 'Tolerance', value: tolerance }] : []),
    ...(colorFinish ? [{ label: 'Color / Finish', value: colorFinish }] : []),
    ...(dimensionSpec ? [{ label: 'Dimension', value: dimensionSpec }] : []),
    ...(Number.isFinite(weightTargetG) && weightTargetG > 0
      ? [{ label: 'Weight target', value: `${weightTargetG.toLocaleString('th-TH')} g` }]
      : []),
    ...(packagingSpec ? [{ label: 'Packaging spec', value: packagingSpec }] : []),
    ...(Number.isFinite(budgetTotal) && budgetTotal > 0
      ? [{ label: 'งบประมาณรวม', value: `฿${budgetTotal.toLocaleString('th-TH')}` }]
      : []),
    ...(Number.isFinite(targetLeadTimeDays) && targetLeadTimeDays > 0
      ? [{ label: 'ระยะเวลาผลิตที่ต้องการ', value: `${targetLeadTimeDays.toLocaleString('th-TH')} วัน` }]
      : []),
    ...(requiredDeliveryDateLabel ? [{ label: 'วันที่ต้องการรับสินค้า', value: requiredDeliveryDateLabel }] : []),
    ...(deadlineLabel ? [{ label: 'กำหนดส่ง', value: deadlineLabel }] : []),
    ...(inspectionTypeLabel ? [{ label: 'รูปแบบตรวจคุณภาพ', value: inspectionTypeLabel }] : []),
    ...(sampleRequired
      ? [{ label: 'ต้องการตัวอย่าง', value: Number.isFinite(sampleQty) && sampleQty > 0 ? `ใช่ (${sampleQty} ชิ้น)` : 'ใช่' }]
      : [{ label: 'ต้องการตัวอย่าง', value: 'ไม่' }]),
  ];

  const body = (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">สเปคของโครงการ</p>
        <dl className="space-y-2 text-xs">
          {specRows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <dt className="text-gray-500">{row.label}</dt>
              <dd className="text-gray-900 text-right" style={{ fontWeight: 600 }}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {imageUrls.length > 0 ? (
        <div>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">รูปอ้างอิง / แนบมากับ RFQ</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {imageUrls.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightbox(url)}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {description ? (
        <div>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">รายละเอียด</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
        </div>
      ) : null}

      {certifications.length > 0 ? (
        <div>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Certifications required</p>
          <div className="flex flex-wrap gap-1.5">
            {certifications.map((c) => (
              <span
                key={c}
                className="text-[11px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {quotation ? (
        <div>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">รายละเอียดใบเสนอราคา</p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <MetaRow
              icon={<DollarSign size={12} />}
              label="ราคา/ชิ้น"
              value={`฿${quotation.price_per_piece.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
            />
            {quotation.mold_cost > 0 ? (
              <MetaRow
                icon={<Wrench size={12} />}
                label="ค่าแม่พิมพ์"
                value={`฿${quotation.mold_cost.toLocaleString('th-TH')}`}
              />
            ) : null}
             
            <MetaRow
              icon={<DollarSign size={12} />}
              label="มูลค่ารวม"
              value={`฿${(quotation.price_per_piece * rfq.quantity).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
            />
          </dl>
        </div>
      ) : null}
      {rfqLoading ? <p className="text-xs text-gray-400">กำลังโหลดสเปค RFQ...</p> : null}
      {rfqError ? <p className="text-xs text-red-500">{rfqError}</p> : null}
      <OrderPhotoGallery photoUrl={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );

  return (
    <section className="rounded-2xl border border-gray-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
          รายละเอียดใบขอราคา
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="px-4 pb-4">{body}</div> : null}
    </section>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500 flex items-center gap-1">
        {icon}
        {label}
      </dt>
      <dd className="text-gray-900" style={{ fontWeight: 600 }}>
        {value}
      </dd>
    </div>
  );
}
