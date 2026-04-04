import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export type RfqForSpecs = {
  category: string;
  quantity: number;
  material: string;
  budget: number;
  deadline: string;
  createdAt: string;
  description?: string;
};

type RfqDetailSpecsProps = {
  rfq: RfqForSpecs;
  open: boolean;
  onToggle: () => void;
};

export function RfqDetailSpecs({ rfq, open, onToggle }: RfqDetailSpecsProps) {
  const rows = [
    { label: 'ประเภทการผลิต', value: rfq.category },
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
