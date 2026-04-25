import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ImageWithFallback } from '../../shared';

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
  sampleRequired?: boolean;
  sampleQty?: number;
  inspectionType?: 'self' | 'third_party' | 'buyer_onsite' | string;
};

type RfqDetailSpecsProps = {
  rfq: RfqForSpecs;
  open: boolean;
  onToggle: () => void;
};

export function RfqDetailSpecs({ rfq, open, onToggle }: RfqDetailSpecsProps) {
  const imageUrls = rfq.imageUrls?.filter(Boolean) ?? [];
  const subLabel = (rfq.subCategoryName ?? '').trim();
  const hasSubFromApi = Boolean(subLabel) || (rfq.subCategoryId != null && rfq.subCategoryId > 0);
  const inspectionTypeLabel =
    rfq.inspectionType === 'self'
      ? 'ตรวจสอบโดยโรงงาน'
      : rfq.inspectionType === 'third_party'
        ? 'ตรวจสอบโดยหน่วยงานภายนอก'
        : rfq.inspectionType === 'buyer_onsite'
          ? 'ผู้ซื้อเข้าตรวจที่โรงงาน'
          : (rfq.inspectionType ?? '').trim();

  const rows = [
    { label: 'ประเภทการผลิต', value: rfq.category },
    ...(hasSubFromApi
      ? [{ label: 'ประเภทย่อย', value: subLabel || '—' }]
      : []),
    ...(rfq.shippingMethodName
      ? [{ label: 'วิธีส่งของ', value: rfq.shippingMethodName }]
      : []),
    ...(rfq.deliveryAddress
      ? [{ label: 'ที่อยู่จัดส่ง', value: rfq.deliveryAddress }]
      : []),
    { label: 'จำนวน', value: `${rfq.quantity.toLocaleString()} ชิ้น` },
    ...(rfq.materialGrade || rfq.material ? [{ label: 'Material grade', value: rfq.materialGrade || rfq.material }] : []),
    ...(rfq.tolerance ? [{ label: 'Tolerance', value: rfq.tolerance }] : []),
    ...(rfq.colorFinish ? [{ label: 'Color / Finish', value: rfq.colorFinish }] : []),
    ...(rfq.dimensionSpec ? [{ label: 'Dimension', value: rfq.dimensionSpec }] : []),
    ...(rfq.weightTargetG != null ? [{ label: 'Weight target', value: `${rfq.weightTargetG.toLocaleString()} g` }] : []),
    ...(rfq.packagingSpec ? [{ label: 'Packaging spec', value: rfq.packagingSpec }] : []),
    { label: 'งบประมาณรวม', value: `฿${rfq.budget.toLocaleString()}` },
    ...(rfq.targetLeadTimeDays != null
      ? [{ label: 'ระยะเวลาผลิตที่ต้องการ', value: `${rfq.targetLeadTimeDays.toLocaleString()} วัน` }]
      : []),
    ...(rfq.requiredDeliveryDate
      ? [{ label: 'วันที่ต้องการรับสินค้า', value: rfq.requiredDeliveryDate }]
      : []),
    ...(rfq.deadline ? [{ label: 'กำหนดส่ง', value: rfq.deadline }] : []),
    ...(inspectionTypeLabel ? [{ label: 'รูปแบบตรวจคุณภาพ', value: inspectionTypeLabel }] : []),
    ...(rfq.sampleRequired
      ? [{ label: 'ต้องการตัวอย่าง', value: rfq.sampleQty ? `ใช่ (${rfq.sampleQty} ชิ้น)` : 'ใช่' }]
      : [{ label: 'ต้องการตัวอย่าง', value: 'ไม่' }]),
    { label: 'วันที่สร้าง', value: rfq.createdAt },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4"
      >
        <span className="text-sm" style={{ fontWeight: 600, color: '#2E2252' }}>
          สเปคของโครงการ
        </span>
        {open ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="space-y-2.5 mt-3">
            {rows.map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-xs" style={{ fontWeight: 500, color: '#2E2252' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          {imageUrls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">รูปอ้างอิง / แนบมากับ RFQ</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {imageUrls.map((url, idx) => (
                  <a
                    key={`${url}-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100"
                  >
                    <ImageWithFallback
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          {rfq.description && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">รายละเอียด</p>
              <p className="text-xs text-gray-700">{rfq.description}</p>
            </div>
          )}
          {Array.isArray(rfq.certificationsRequired) && rfq.certificationsRequired.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Certifications required</p>
              <div className="flex flex-wrap gap-1.5">
                {rfq.certificationsRequired.map((c) => (
                  <span
                    key={c}
                    className="text-[11px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
