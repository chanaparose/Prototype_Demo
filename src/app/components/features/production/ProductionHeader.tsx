import React, { useMemo } from 'react';
import type { MergedProductionStep } from './types';

function orderStatusLabel(code: string): string {
  const u = code.toUpperCase();
  if (u === 'PR') return 'กำลังผลิต';
  if (u === 'QC') return 'ตรวจสอบคุณภาพ';
  if (u === 'SH') return 'พร้อมจัดส่ง';
  if (u === 'CP') return 'เสร็จสิ้น';
  if (u === 'WF' || u === 'PE' || u === 'PP') return 'รอดำเนินการ';
  return code || '—';
}

function formatRelativeTh(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return 'เมื่อสักครู่';
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const day = Math.floor(h / 24);
  return `${day} วันที่แล้ว`;
}

type Props = {
  merged: MergedProductionStep[];
  orderStatus: string;
};

export function ProductionHeader({ merged, orderStatus }: Props) {
  const total = merged.length;
  const done = merged.filter((m) => m.update.status === 'CD').length;

  const currentName = useMemo(() => {
    const ip = merged.find((m) => m.update.status === 'IP');
    if (ip) return ip.template.step_name_th;
    const pd = merged.find((m) => m.update.status === 'PD');
    return pd?.template.step_name_th ?? '—';
  }, [merged]);

  const lastIso = useMemo(() => {
    let best = '';
    for (const m of merged) {
      const t = m.update.last_updated_at;
      if (!t) continue;
      if (!best || new Date(t) > new Date(best)) best = t;
    }
    return best;
  }, [merged]);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-gray-900">ความคืบหน้าการผลิต</p>
        <span
          className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-800"
          aria-label={`สถานะคำสั่งซื้อ ${orderStatusLabel(orderStatus)}`}
        >
          {orderStatusLabel(orderStatus)}
        </span>
      </div>
      <div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#7C3AED' }} />
        </div>
        <p className="text-xs text-gray-600 mt-1.5">
          {done}/{total} ขั้นตอน
        </p>
      </div>
      <div>
        <p className="text-[10px] text-gray-500 uppercase">ขั้นปัจจุบัน</p>
        <p className="text-sm font-semibold text-gray-900">{currentName}</p>
      </div>
      {lastIso ? (
        <p className="text-xs text-gray-500">อัปเดตล่าสุด {formatRelativeTh(lastIso)}</p>
      ) : null}
    </div>
  );
}
