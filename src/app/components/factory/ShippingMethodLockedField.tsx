import React from 'react';
import { Lock } from 'lucide-react';

type Props = {
  label?: string;
  methodName: string;
  hint?: string;
  /** แสดงเมื่อไม่มีชื่อจาก master */
  emptyFallback?: string;
};

/** วิธีจัดส่งแบบ read-only + 🔒 (FACTORY_RFQ_BOARD_UX_SPEC §3.4) */
export function ShippingMethodLockedField({
  label = 'วิธีจัดส่ง',
  methodName,
  hint = 'ใช้ตามที่ลูกค้าเลือกไว้ใน RFQ',
  emptyFallback = '—',
}: Props) {
  const text = methodName.trim() || emptyFallback;
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <Lock size={14} className="text-gray-400 shrink-0" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-gray-800">{text}</p>
      <p className="text-[11px] text-gray-500 mt-1">{hint}</p>
    </div>
  );
}
