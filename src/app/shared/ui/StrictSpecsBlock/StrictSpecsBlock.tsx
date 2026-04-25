import React from 'react';
import { Boxes, Clock3 } from 'lucide-react';

type Spec = {
  moq: number | null;
  lead_time_days: number | null;
};

type Props = {
  showcase: Spec;
};

const LABEL_COLOR = '#9D77B2';
const VALUE_COLOR = '#2E2252';

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: LABEL_COLOR }}>
        <span className="w-6 h-6 rounded-lg bg-[#F8F6FA] flex items-center justify-center">
          {icon}
        </span>
        {label}
      </span>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: VALUE_COLOR }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Strict specs block — shows only MOQ + lead time.
 * production_capacity / sample_available ถูกลบออกจาก DB schema แล้ว
 */
export function StrictSpecsBlock({ showcase }: Props) {
  const moq =
    showcase.moq != null && showcase.moq > 0
      ? `${showcase.moq.toLocaleString('th-TH')} ชิ้น`
      : '—';
  const lead =
    showcase.lead_time_days != null && showcase.lead_time_days > 0
      ? `${showcase.lead_time_days} วัน`
      : '—';

  return (
    <div className="divide-y divide-gray-100">
      <Row
        icon={<Boxes className="w-3.5 h-3.5" style={{ color: '#7A4B94' }} />}
        label="MOQ ขั้นต่ำ"
        value={moq}
      />
      <Row
        icon={<Clock3 className="w-3.5 h-3.5" style={{ color: '#7A4B94' }} />}
        label="Lead time"
        value={lead}
      />
    </div>
  );
}
