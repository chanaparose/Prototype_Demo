import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  daysUntilDeadline,
  deadlineTone,
  formatThaiDeadlineShort,
  type DeadlineTone,
} from '../../utils/rfqDeadline';
import { formatDeadline } from '../../utils/formatting';

const TONE_STYLES: Record<DeadlineTone, { wrap: string }> = {
  ok: { wrap: 'bg-slate-100 text-slate-700 border-slate-200' },
  soon: { wrap: 'bg-amber-50 text-amber-900 border-amber-200' },
  urgent: { wrap: 'bg-rose-50 text-rose-900 border-rose-200' },
  past: { wrap: 'bg-gray-100 text-gray-600 border-gray-200' },
};

type Props = {
  deadlineIso: string | null | undefined;
  className?: string;
};

/** D-3 / D-7 / D-14 สีตาม spec — ใช้ทั้ง board และ detail */
export function DeadlineBadge({ deadlineIso, className = '' }: Props) {
  const dLeft = daysUntilDeadline(deadlineIso);
  const tone = deadlineTone(dLeft);
  const dateStr = formatThaiDeadlineShort(deadlineIso);
  const st = TONE_STYLES[tone];

  if (!dateStr && dLeft === null) return null;

  let label = '';
  if (dateStr) label = `ปิดรับ ${dateStr}`;
  if (dLeft !== null) {
    if (dLeft < 0) label = label ? `${label} · ปิดรับแล้ว` : 'ปิดรับแล้ว';
    else if (dLeft === 0) label = label ? `${label} · วันสุดท้าย` : 'วันสุดท้าย';
    else label = label ? `${label} · เหลือ ${dLeft} วัน` : `เหลือ ${dLeft} วัน`;
  }

  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${st.wrap} ${className}`}
    >
      {tone === 'urgent' ? <AlertTriangle size={12} className="shrink-0" aria-hidden /> : null}
      {label}
    </span>
  );
}
