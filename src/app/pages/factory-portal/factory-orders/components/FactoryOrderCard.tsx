import React from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { formatDateTh } from '../../../../components/features/order-detail/utils';
import type { DerivedCardState, FactoryOrderRow } from '../types';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  PP: { label: 'รอชำระมัดจำ', badgeClass: 'bg-amber-100 text-amber-800', icon: '⏳' },
  PE: { label: 'หมดกำหนดชำระ', badgeClass: 'bg-red-100 text-red-800', icon: '⛔' },
  PD: { label: 'ชำระมัดจำแล้ว', badgeClass: 'bg-teal-100 text-teal-800', icon: '💳' },
  PR: { label: 'กำลังผลิต', badgeClass: 'bg-violet-100 text-violet-800', icon: '⚙️' },
  QC: { label: 'ตรวจสอบคุณภาพ', badgeClass: 'bg-indigo-100 text-indigo-800', icon: '🔍' },
  SH: { label: 'จัดส่งแล้ว', badgeClass: 'bg-sky-100 text-sky-800', icon: '📦' },
  CP: { label: 'เสร็จสิ้น', badgeClass: 'bg-emerald-100 text-emerald-800', icon: '✓' },
  CN: { label: 'ยกเลิก', badgeClass: 'bg-gray-100 text-gray-700', icon: '×' },
  CC: { label: 'ยกเลิก', badgeClass: 'bg-gray-100 text-gray-700', icon: '×' },
  CL: { label: 'ยกเลิก', badgeClass: 'bg-gray-100 text-gray-700', icon: '×' },
};

export function FactoryOrderCard({
  row,
  derived,
  onPrimaryCta,
}: {
  row: FactoryOrderRow;
  derived: DerivedCardState;
  onPrimaryCta: (row: FactoryOrderRow, cta: DerivedCardState['primaryCta']) => void;
}) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 hover:shadow-sm min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
            {row.rfq?.title ?? `Order #${row.order_id}`}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Order #{row.order_id}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${STATUS_CONFIG[row.status].badgeClass}`}>
            {STATUS_CONFIG[row.status].icon} {STATUS_CONFIG[row.status].label}
          </span>
          {derived.flags.isOverdue ? <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-red-100 text-red-800">ล่าช้า {derived.flags.daysOverdue} วัน</span> : null}
          {!derived.flags.isOverdue && derived.flags.isNearDeadline ? <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">ใกล้กำหนด</span> : null}
          {derived.flags.hasRejected ? <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-red-100 text-red-800">ขอตรวจสอบใหม่</span> : null}
          {derived.flags.isStaleUpdate ? <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">ยังไม่อัปเดต</span> : null}
        </div>
      </div>
      {row.customer?.display_name ? <p className="text-xs text-gray-500 mt-2">ลูกค้า: {row.customer.display_name}</p> : null}
      <p className="text-xs text-gray-600 mt-1">
        ฿{row.total_amount.toLocaleString('th-TH')}
        {row.rfq?.quantity ? ` · ${row.rfq.quantity.toLocaleString('th-TH')} ${row.rfq.unit_name}` : ''}
        {row.estimated_delivery ? ` · กำหนดส่ง ${formatDateTh(row.estimated_delivery)}` : ''}
      </p>
      {row.production_summary ? (
        <p className="text-xs text-gray-500 mt-1">
          ขั้นปัจจุบัน: {row.production_summary.current_step_name_th ?? '—'} ({row.production_summary.completed_count}/{row.production_summary.total_count})
        </p>
      ) : null}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <Link to={`/factory/orders/${row.order_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
          ดูรายละเอียด <ChevronRight size={16} />
        </Link>
        {derived.primaryCta.kind !== 'view_only' ? (
          <button
            type="button"
            disabled={derived.primaryCta.kind === 'waiting_customer'}
            onClick={() => onPrimaryCta(row, derived.primaryCta)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              derived.primaryCta.kind === 'waiting_customer'
                ? 'bg-gray-100 text-gray-500'
                : derived.primaryCta.kind === 'mark_shipped'
                  ? 'bg-sky-600 text-white'
                  : derived.primaryCta.kind === 'start_qc'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#4F46E5] text-white'
            }`}
          >
            {derived.primaryCta.kind === 'update_step'
              ? `⚡ อัปเดตขั้น ${derived.primaryCta.stepNameTh}`
              : derived.primaryCta.kind === 'start_qc'
                ? 'เริ่ม QC'
                : derived.primaryCta.kind === 'mark_shipped'
                  ? 'บันทึกจัดส่ง'
                  : 'รอลูกค้า'}
          </button>
        ) : null}
      </div>
    </article>
  );
}
