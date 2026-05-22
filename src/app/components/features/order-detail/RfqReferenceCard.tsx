import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { IQuoteNestedResponse, IRfqNestedResponse } from '@/types/api';
import { summarizeRfqAddress } from '@/utils/rfqAddressSummary';
import { OrderPhotoGallery } from '@/components/features/order-detail/OrderPhotoGallery';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

interface Props {
  rfq: IRfqNestedResponse;
  variant?: 'accordion';
  defaultOpen?: boolean;
  /** Optional quotation details to show alongside the RFQ spec */
  quotation?: IQuoteNestedResponse | null;
}

export function RfqReferenceCard({ rfq, defaultOpen = true, quotation }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Use enriched data from GET /orders/:id — no extra API calls needed.
  const data = rfq as unknown as Record<string, unknown>;
  const quantity = Math.max(0, pickScalarNumber(data.quantity, rfq.quantity) ?? 0);
  const categoryName = pickScalarString(data.category_name, rfq.category_name) || '-';
  const subCategoryName = pickScalarString(data.sub_category_name, data.subCategoryName);
  const subCategoryId = pickScalarNumber(data.sub_category_id, data.subCategoryId) ?? 0;
  const shippingMethodName = pickScalarString(
    data.shipping_method_name,
    data.shippingMethodName,
  );
  const deliveryAddress = summarizeRfqAddress(data);
  const materialGrade = pickScalarString(data.material_grade, data.materialGrade);
  const tolerance = pickScalarString(data.tolerance);
  const colorFinish = pickScalarString(data.color_finish, data.colorFinish);
  const dimensionSpec = pickScalarString(data.dimension_spec, data.dimensionSpec);
  const weightTargetG = pickScalarNumber(data.weight_target_g, data.weightTargetG) ?? 0;
  const packagingSpec = pickScalarString(data.packaging_spec, data.packagingSpec);
  const targetLeadTimeDays =
    pickScalarNumber(data.target_lead_time_days, data.targetLeadTimeDays) ?? 0;
  const requiredDeliveryDateRaw = pickScalarString(
    data.required_delivery_date,
    data.requiredDeliveryDate,
  );
  const deadlineRaw = pickScalarString(
    data.deadline,
    data.target_date,
    data.delivery_deadline,
    rfq.deadline_date,
  );
  const budgetTotal =
    pickScalarNumber(
      data.total_budget,
      data.target_total_budget,
      data.budget_total,
      data.target_price,
    ) ?? 0;
  const description = pickScalarString(data.details, data.description, rfq.details);
  const certifications = useMemo(() => {
    const input = data.certifications_required ?? data.certificationsRequired;
    if (Array.isArray(input)) {
      return input.map((x) => pickScalarString(x)).filter(Boolean);
    }
    if (typeof input === 'string' && input.trim()) {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed.map((x) => pickScalarString(x)).filter(Boolean);
      } catch {
        return [input.trim()];
      }
    }
    return [] as string[];
  }, [data.certifications_required, data.certificationsRequired]);

  const imageUrls = useMemo(() => {
    const fromImages =
      Array.isArray(rfq.images) && rfq.images.length > 0
        ? rfq.images.map((img) => pickScalarString(img.image_url)).filter(Boolean)
        : [];
    const collect = (input: unknown): string[] => {
      if (!input) return [];
      if (Array.isArray(input)) {
        return input
          .map((x) => {
            if (typeof x === 'string') return x.trim();
            if (x && typeof x === 'object') {
              const o = x as Record<string, unknown>;
              return pickScalarString(o.url, o.image_url, o.public_url);
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
    { label: 'จำนวน', value: `${formatCompactNumber(quantity)} ชิ้น` },
    ...(materialGrade ? [{ label: 'Material grade', value: materialGrade }] : []),
    ...(tolerance ? [{ label: 'Tolerance', value: tolerance }] : []),
    ...(colorFinish ? [{ label: 'Color / Finish', value: colorFinish }] : []),
    ...(dimensionSpec ? [{ label: 'Dimension', value: dimensionSpec }] : []),
    ...(Number.isFinite(weightTargetG) && weightTargetG > 0
      ? [{ label: 'Weight target', value: `${formatCompactNumber(weightTargetG)} g` }]
      : []),
    ...(packagingSpec ? [{ label: 'Packaging spec', value: packagingSpec }] : []),
    ...(Number.isFinite(budgetTotal) && budgetTotal > 0
      ? [{ label: 'งบประมาณรวม', value: formatCurrency(budgetTotal, 'THB') }]
      : []),
    ...(Number.isFinite(targetLeadTimeDays) && targetLeadTimeDays > 0
      ? [
          {
            label: 'ระยะเวลาผลิตที่ต้องการ',
            value: `${formatCompactNumber(targetLeadTimeDays)} วัน`,
          },
        ]
      : []),
    ...(requiredDeliveryDateLabel
      ? [{ label: 'วันที่ต้องการรับสินค้า', value: requiredDeliveryDateLabel }]
      : []),
    ...(deadlineLabel ? [{ label: 'กำหนดส่ง', value: deadlineLabel }] : []),
  ];

  const body = (
    <div className='space-y-4'>
      <div>
        <p className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2'>
          สเปคของโครงการ
        </p>
        <dl className='space-y-2 text-xs'>
          {specRows.map((row) => (
            <div key={row.label} className='flex items-start justify-between gap-3'>
              <dt className='text-gray-500'>{row.label}</dt>
              <dd className='text-gray-900 text-right' style={{ fontWeight: 600 }}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {imageUrls.length > 0 ? (
        <div>
          <p className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2'>
            รูปอ้างอิง / แนบมากับ RFQ
          </p>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
            {imageUrls.map((url) => (
              <Button
                variant='unstyled'
                key={url}
                type='button'
                onClick={() => setLightbox(url)}
                className='aspect-square rounded-lg overflow-hidden bg-gray-100'
              >
                <Image src={url} alt='' className='w-full h-full object-cover' />
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {description ? (
        <div>
          <p className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2'>
            รายละเอียด
          </p>
          <p className='text-sm text-gray-700 whitespace-pre-wrap'>{description}</p>
        </div>
      ) : null}

      {certifications.length > 0 ? (
        <div>
          <p className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2'>
            Certifications required
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {certifications.map((c) => (
              <span
                key={c}
                className='text-[11px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100'
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {quotation ? (
        <div>
          <p className='text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2'>
            รายละเอียดใบเสนอราคา
          </p>
          {(() => {
            const q = quotation as unknown as IQuoteNestedResponse & Record<string, unknown>;
            const pricePerPiece = Number(q.price_per_piece ?? 0);
            const qty = Math.max(0, Number(data.quantity ?? rfq.quantity ?? 0) || 0);
            const subtotalRaw = Number(q.subtotal ?? 0);
            const subtotal = subtotalRaw > 0 ? subtotalRaw : Math.max(0, pricePerPiece * qty);
            const shippingCost = Number(q.shipping_cost ?? 0);
            const packagingCost = Number(q.packaging_cost ?? 0);
            const toolingMoldCost = Number(
              q.tooling_mold_cost ?? q.mold_cost ?? quotation.mold_cost ?? 0,
            );
            const discountAmount = Number(q.discount_amount ?? 0);
            const vatRate = Number(q.vat_rate ?? 0);
            const vatAmountRaw = Number(q.vat_amount ?? 0);
            const vatAmount =
              vatAmountRaw > 0
                ? vatAmountRaw
                : Math.max(
                    0,
                    ((subtotal - discountAmount + shippingCost + packagingCost + toolingMoldCost) *
                      vatRate) /
                      100,
                  );
            const grandTotalRaw = Number(q.grand_total ?? 0);
            const grandTotal =
              grandTotalRaw > 0
                ? grandTotalRaw
                : Math.max(
                    0,
                    subtotal -
                      discountAmount +
                      shippingCost +
                      packagingCost +
                      toolingMoldCost +
                      vatAmount,
                  );
            const leadTimeDays = Number(q.lead_time_days ?? quotation.lead_time_days ?? 0);
            const validityDays = Math.max(0, Number(q.validity_days ?? 0));
            const formatTHB = (n: number) => formatCurrency(n, 'THB');

            return (
              <>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2'>
                  <div className='bg-gray-50 rounded-xl p-2.5 text-center'>
                    <p
                      className='text-sm text-brand-navy'
                      style={{ fontWeight: 700, color: 'var(--brand-mauve)' }}
                    >
                      {formatTHB(pricePerPiece)}
                    </p>
                    <p className='text-[12px] text-gray-500'>ราคาต่อชิ้น</p>
                  </div>
                  <div className='bg-gray-50 rounded-xl p-2.5 text-center'>
                    <p className='text-sm text-brand-navy' style={{ fontWeight: 700 }}>
                      {leadTimeDays > 0 ? leadTimeDays : '-'}
                    </p>
                    <p className='text-[12px] text-gray-500'>Lead time (วัน)</p>
                  </div>
                  <div className='bg-gray-50 rounded-xl p-2.5 text-center'>
                    <p
                      className='text-sm text-brand-navy'
                      style={{ fontWeight: 700, color: 'var(--brand-mauve)' }}
                    >
                      {formatTHB(grandTotal)}
                    </p>
                    <p className='text-[12px] text-gray-500'>ราคารวมเสนอ</p>
                  </div>
                  <div className='bg-gray-50 rounded-xl p-2.5 text-center'>
                    <p className='text-sm text-brand-navy' style={{ fontWeight: 700 }}>
                      {validityDays > 0 ? `${validityDays}` : '-'}
                    </p>
                    <p className='text-[12px] text-gray-500'>อายุใบเสนอราคา (วัน)</p>
                  </div>
                </div>

                <div className='rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-2 mb-3'>
                  <div className='flex items-center justify-between text-[11px] text-gray-600'>
                    <span>ค่าสินค้ารวม</span>
                    <span className='font-semibold text-brand-navy'>{formatTHB(subtotal)}</span>
                  </div>
                  {shippingCost > 0 ? (
                    <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                      <span>ค่าขนส่ง</span>
                      <span className='font-semibold text-brand-navy'>
                        {formatTHB(shippingCost)}
                      </span>
                    </div>
                  ) : null}
                  {packagingCost > 0 ? (
                    <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                      <span>ค่าบรรจุภัณฑ์</span>
                      <span className='font-semibold text-brand-navy'>
                        {formatTHB(packagingCost)}
                      </span>
                    </div>
                  ) : null}
                  {toolingMoldCost > 0 ? (
                    <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                      <span>ค่าแม่พิมพ์</span>
                      <span className='font-semibold text-brand-navy'>
                        {formatTHB(toolingMoldCost)}
                      </span>
                    </div>
                  ) : null}
                  {discountAmount > 0 ? (
                    <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                      <span>ส่วนลด</span>
                      <span className='font-semibold text-emerald-700'>
                        -{formatTHB(discountAmount)}
                      </span>
                    </div>
            ) : null}
                  <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                    <span>VAT {vatRate > 0 ? `${vatRate}%` : ''}</span>
                    <span className='font-semibold text-brand-navy'>{formatTHB(vatAmount)}</span>
                  </div>
                  <div className='border-t border-gray-200 mt-2 pt-2 flex items-center justify-between text-[12px]'>
                    <span className='font-semibold text-brand-navy'>รวมทั้งหมด</span>
                    <span className='font-bold text-brand-mauve'>{formatTHB(grandTotal)}</span>
                  </div>
                </div>

                {pickScalarString(q.factory_highlight, q.highlight) ? (
                  <div className='rounded-lg border border-violet-100 bg-violet-50/70 px-2.5 py-2 mb-2'>
                    <p className='text-[12px] font-semibold text-violet-700 mb-0.5'>
                      จุดเด่นจากโรงงาน
                    </p>
                    <p className='text-[11px] text-violet-900 leading-relaxed'>
                      {pickScalarString(q.factory_highlight, q.highlight)}
                    </p>
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>
      ) : null}
      <OrderPhotoGallery photoUrl={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );

  return (
    <section className='rounded-2xl border border-gray-100 bg-white'>
      <Button
        variant='unstyled'
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='w-full flex items-center justify-between px-4 py-3'
      >
        <span className='text-sm text-gray-900' style={{ fontWeight: 700 }}>
          รายละเอียดใบขอราคา
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open ? <div className='px-4 pb-4'>{body}</div> : null}
    </section>
  );
}
