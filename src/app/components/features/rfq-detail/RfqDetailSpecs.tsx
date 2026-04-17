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

  const rows = [
    { label: 'ประเภทการผลิต', value: rfq.category },
    ...(hasSubFromApi
      ? [{ label: 'ประเภทย่อย', value: subLabel || '—' }]
      : []),
    ...(rfq.shippingMethodName
      ? [{ label: 'วิธีส่งของ', value: rfq.shippingMethodName }]
      : []),
    { label: 'จำนวน', value: `${rfq.quantity.toLocaleString()} ชิ้น` },
    { label: 'วัสดุ', value: rfq.material },
    { label: 'งบประมาณ', value: `฿${rfq.budget.toLocaleString()}` },
    { label: 'กำหนดส่ง', value: rfq.deadline },
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
        </div>
      )}
    </div>
  );
}
