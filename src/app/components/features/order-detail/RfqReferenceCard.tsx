import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RfqNestedDTO, QuoteNestedDTO } from '../../../types/api';
import { rfqsApi, quotationsApi } from '../../../services/api';
import { summarizeRfqAddress } from '../../../utils/rfqAddressSummary';
import { OrderPhotoGallery } from './OrderPhotoGallery';

interface Props {
  rfq: RfqNestedDTO;
  variant?: 'accordion';
  defaultOpen?: boolean;
  /** Optional quotation details to show alongside the RFQ spec */
  quotation?: QuoteNestedDTO | null;
}

export function RfqReferenceCard({ rfq, defaultOpen = true, quotation }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [rfqDetail, setRfqDetail] = useState<Record<string, unknown> | null>(null);
  const [quotationDetail, setQuotationDetail] = useState<Record<string, unknown> | null>(null);
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

  useEffect(() => {
    let mounted = true;
    const quoteId = Number(quotation?.quote_id ?? 0);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
      setQuotationDetail(null);
      return () => void 0;
    }
    const load = async () => {
      try {
        const res = await quotationsApi.get(quoteId);
        const payload =
          res && typeof res === 'object' && !Array.isArray(res) && res.quotation && typeof res.quotation === 'object'
            ? (res.quotation as Record<string, unknown>)
            : (res as Record<string, unknown>);
        if (!mounted) return;
        setQuotationDetail(payload);
      } catch {
        if (!mounted) return;
        setQuotationDetail(null);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [quotation?.quote_id]);

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
  const budgetTotal = Number(
    data.total_budget ??
      data.target_total_budget ??
      data.budget_total ??
      data.target_price ??
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
          {(() => {
            const q = {
              ...(quotation as unknown as Record<string, unknown>),
              ...(quotationDetail ?? {}),
            } as QuoteNestedDTO & Record<string, unknown>;
            const pricePerPiece = Number(q.price_per_piece ?? 0);
            const qty = Math.max(0, Number(data.quantity ?? rfq.quantity ?? 0) || 0);
            const subtotalRaw = Number(q.subtotal ?? 0);
            const subtotal = subtotalRaw > 0 ? subtotalRaw : Math.max(0, pricePerPiece * qty);
            const shippingCost = Number(q.shipping_cost ?? 0);
            const packagingCost = Number(q.packaging_cost ?? 0);
            const toolingMoldCost = Number(q.tooling_mold_cost ?? q.mold_cost ?? quotation.mold_cost ?? 0);
            const discountAmount = Number(q.discount_amount ?? 0);
            const vatRate = Number(q.vat_rate ?? 0);
            const vatAmountRaw = Number(q.vat_amount ?? 0);
            const vatAmount =
              vatAmountRaw > 0
                ? vatAmountRaw
                : Math.max(0, ((subtotal - discountAmount + shippingCost + packagingCost + toolingMoldCost) * vatRate) / 100);
            const grandTotalRaw = Number(q.grand_total ?? 0);
            const grandTotal =
              grandTotalRaw > 0
                ? grandTotalRaw
                : Math.max(0, subtotal - discountAmount + shippingCost + packagingCost + toolingMoldCost + vatAmount);
            const leadTimeDays = Number(q.lead_time_days ?? quotation.lead_time_days ?? 0);
            const validityDays = Math.max(0, Number(q.validity_days ?? 0));
            const formatTHB = (n: number) =>
              `฿${n.toLocaleString('th-TH', { minimumFractionDigits: n % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`;

            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700, color: '#7A4B94' }}>
                      {formatTHB(pricePerPiece)}
                    </p>
                    <p className="text-[12px] text-gray-500">ราคาต่อชิ้น</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700 }}>
                      {leadTimeDays > 0 ? leadTimeDays : '-'}
                    </p>
                    <p className="text-[12px] text-gray-500">Lead time (วัน)</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700, color: '#7A4B94' }}>
                      {formatTHB(grandTotal)}
                    </p>
                    <p className="text-[12px] text-gray-500">ราคารวมเสนอ</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700 }}>
                      {validityDays > 0 ? `${validityDays}` : '-'}
                    </p>
                    <p className="text-[12px] text-gray-500">อายุใบเสนอราคา (วัน)</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-2 mb-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>ค่าสินค้ารวม</span>
                    <span className="font-semibold text-[#2E2252]">{formatTHB(subtotal)}</span>
                  </div>
                  {shippingCost > 0 ? (
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mt-1">
                      <span>ค่าขนส่ง</span>
                      <span className="font-semibold text-[#2E2252]">{formatTHB(shippingCost)}</span>
                    </div>
                  ) : null}
                  {packagingCost > 0 ? (
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mt-1">
                      <span>ค่าบรรจุภัณฑ์</span>
                      <span className="font-semibold text-[#2E2252]">{formatTHB(packagingCost)}</span>
                    </div>
                  ) : null}
                  {toolingMoldCost > 0 ? (
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mt-1">
                      <span>ค่าแม่พิมพ์</span>
                      <span className="font-semibold text-[#2E2252]">{formatTHB(toolingMoldCost)}</span>
                    </div>
                  ) : null}
                  {discountAmount > 0 ? (
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mt-1">
                      <span>ส่วนลด</span>
                      <span className="font-semibold text-emerald-700">-{formatTHB(discountAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-[11px] text-gray-600 mt-1">
                    <span>VAT {vatRate > 0 ? `${vatRate}%` : ''}</span>
                    <span className="font-semibold text-[#2E2252]">{formatTHB(vatAmount)}</span>
                  </div>
                  <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#2E2252]">รวมทั้งหมด</span>
                    <span className="font-bold text-[#7A4B94]">{formatTHB(grandTotal)}</span>
                  </div>
                </div>

                {String(q.factory_highlight ?? q.highlight ?? '').trim() ? (
                  <div className="rounded-lg border border-violet-100 bg-violet-50/70 px-2.5 py-2 mb-2">
                    <p className="text-[12px] font-semibold text-violet-700 mb-0.5">จุดเด่นจากโรงงาน</p>
                    <p className="text-[11px] text-violet-900 leading-relaxed">
                      {String(q.factory_highlight ?? q.highlight ?? '').trim()}
                    </p>
                  </div>
                ) : null}
              </>
            );
          })()}
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
