import React from 'react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';

export type RfqForSpecs = {
  category: string;
  quantity: number;
  material: string;
  budget: number;
  deadline: string;
  createdAt: string;
  description?: string;
  imageUrls?: string[];
  subCategoryName?: string;
  /** จาก GET /rfqs/:id — แสดงแถวประเภทย่อยแม้ยัง resolve ชื่อไม่ได้ */
  subCategoryId?: number;
  shippingMethodName?: string;
  deliveryAddress?: string;
  materialGrade?: string;
  tolerance?: string;
  colorFinish?: string;
  dimensionSpec?: string;
  weightTargetG?: number;
  packagingSpec?: string;
  targetLeadTimeDays?: number;
  requiredDeliveryDate?: string;
  certificationsRequired?: string[];
  unitName?: string;
};

type RfqDetailSpecsProps = {
  rfq: RfqForSpecs;
  bare?: boolean;
};

export function RfqDetailSpecs({ rfq, bare = false }: RfqDetailSpecsProps) {
  const imageUrls = rfq.imageUrls?.filter(Boolean) ?? [];
  const subLabel = (rfq.subCategoryName ?? '').trim();
  const hasSubFromApi = Boolean(subLabel) || (rfq.subCategoryId != null && rfq.subCategoryId > 0);
  const rows = [
    { label: 'ประเภทการผลิต', value: rfq.category },
    ...(hasSubFromApi ? [{ label: 'ประเภทย่อย', value: subLabel || '—' }] : []),
    ...(rfq.shippingMethodName ? [{ label: 'วิธีส่งของ', value: rfq.shippingMethodName }] : []),
    ...(rfq.deliveryAddress ? [{ label: 'ที่อยู่จัดส่ง', value: rfq.deliveryAddress }] : []),
    { label: 'จำนวน', value: `${formatCompactNumber(rfq.quantity)} ${rfq.unitName || 'ชิ้น'}` },
    ...(rfq.materialGrade || rfq.material
      ? [{ label: 'Material grade', value: rfq.materialGrade || rfq.material }]
      : []),
    ...(rfq.tolerance ? [{ label: 'Tolerance', value: rfq.tolerance }] : []),
    ...(rfq.colorFinish ? [{ label: 'Color / Finish', value: rfq.colorFinish }] : []),
    ...(rfq.dimensionSpec ? [{ label: 'Dimension', value: rfq.dimensionSpec }] : []),
    ...(rfq.weightTargetG != null
      ? [{ label: 'Weight target', value: `${formatCompactNumber(rfq.weightTargetG)} g` }]
      : []),
    ...(rfq.packagingSpec ? [{ label: 'Packaging spec', value: rfq.packagingSpec }] : []),
    { label: 'งบประมาณรวม', value: formatCurrency(rfq.budget) },
    ...(rfq.targetLeadTimeDays != null
      ? [
          {
            label: 'ระยะเวลาผลิตที่ต้องการ',
            value: `${formatCompactNumber(rfq.targetLeadTimeDays)} วัน`,
          },
        ]
      : []),
    ...(rfq.requiredDeliveryDate
      ? [{ label: 'วันที่ต้องการรับสินค้า', value: rfq.requiredDeliveryDate }]
      : []),
    ...(rfq.deadline ? [{ label: 'กำหนดส่ง', value: rfq.deadline }] : []),
    { label: 'วันที่สร้าง', value: rfq.createdAt },
  ];

  const content = (
    <div className={bare ? 'px-4 py-4' : 'px-4 pb-4 border-t border-gray-50'}>
      <div className={`space-y-2.5 ${bare ? '' : 'mt-3'}`}>
        {rows.map((item) => (
          <div key={item.label} className='flex justify-between gap-4'>
            <span className='text-xs text-gray-500'>{item.label}</span>
            <span
              className='text-xs text-right'
              style={{ fontWeight: 500, color: 'var(--brand-navy)' }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
      {imageUrls.length > 0 && (
        <div className='mt-3 pt-3 border-t border-gray-100'>
          <p className='text-xs text-gray-500 mb-2'>รูปอ้างอิง / แนบมากับ RFQ</p>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
            {imageUrls.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type='button'
                onClick={() => openImageLightbox(url)}
                className='block aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 focus:outline-none active:opacity-80'
                aria-label='ดูรูปขนาดใหญ่'
              >
                <ImageWithFallback src={url} alt='' className='w-full h-full object-cover' />
              </button>
            ))}
          </div>
        </div>
      )}
      {rfq.description && (
        <div className='mt-3 pt-3 border-t border-gray-100'>
          <p className='text-xs text-gray-500 mb-1.5'>รายละเอียด</p>
          <div className='rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2.5'>
            <p className='text-xs leading-relaxed text-violet-950'>{rfq.description}</p>
          </div>
        </div>
      )}
      {Array.isArray(rfq.certificationsRequired) && rfq.certificationsRequired.length > 0 && (
        <div className='mt-3 pt-3 border-t border-gray-100'>
          <p className='text-xs text-gray-500 mb-2'>Certifications required</p>
          <div className='flex flex-wrap gap-1.5'>
            {rfq.certificationsRequired.map((c) => (
              <span
                key={c}
                className='text-[11px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100'
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (bare) return content;

  return <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>{content}</div>;
}
