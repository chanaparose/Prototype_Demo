import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { IRfqNestedResponse } from '@/types/api';
import { summarizeRfqAddress } from '@/utils/rfqAddressSummary';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

interface Props {
  rfq: IRfqNestedResponse;
  variant?: 'accordion';
  defaultOpen?: boolean;
  collapsible?: boolean;
}

export function RfqReferenceCard({ rfq, defaultOpen = true, collapsible = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  // Use enriched data from GET /orders/:id — no extra API calls needed.
  const data = rfq as unknown as Record<string, unknown>;
  const quantity = Math.max(0, pickScalarNumber(data.quantity, rfq.quantity) ?? 0);
  const categoryName = pickScalarString(data.category_name, rfq.category_name) || '-';
  const subCategoryName = pickScalarString(data.sub_category_name, data.subCategoryName);
  const subCategoryId = pickScalarNumber(data.sub_category_id, data.subCategoryId) ?? 0;
  const shippingMethodName = pickScalarString(data.shipping_method_name, data.shippingMethodName);
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

      {deliveryAddress ? (
        <div className='rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2'>
          <p className='text-[11px] text-gray-500 mb-1'>ที่อยู่จัดส่ง</p>
          <p className='text-xs text-gray-900 leading-5 line-clamp-2 break-words' style={{ fontWeight: 600 }}>
            {deliveryAddress}
          </p>
        </div>
      ) : null}

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
                onClick={() => openImageLightbox(url)}
                className='aspect-square rounded-lg overflow-hidden bg-gray-100 focus:outline-none active:opacity-80'
                aria-label='ดูรูปขนาดใหญ่'
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
          <div className='rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2.5'>
            <p className='text-sm leading-relaxed text-violet-950 whitespace-pre-wrap'>{description}</p>
          </div>
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

    </div>
  );

  return (
    <section className='my-3 rounded-2xl border border-gray-100 bg-white'>
      {collapsible ? (
        <>
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
        </>
      ) : (
        <div className='px-4 py-4'>
          <p className='text-sm text-gray-900 mb-3' style={{ fontWeight: 700 }}>
            รายละเอียดใบขอราคา
          </p>
          {body}
        </div>
      )}
    </section>
  );
}
