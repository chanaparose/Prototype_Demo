import React, { type ReactNode } from 'react';
import { Boxes, Clock3 } from 'lucide-react';
import { appColors } from '@/styles/colors';
import { formatCompactNumber } from '@/utils/formatting/formatCurrency';

type Spec = {
  moq: number | null;
  lead_time_days: number | null;
};

type Props = {
  showcase: Spec;
};

const LABEL_COLOR = appColors.brand.mauveLight;
const VALUE_COLOR = appColors.brand.navy;

function Row({
  icon,
  label,
  value,
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: ReactNode;
}>) {
  return (
    <div className='flex items-center justify-between gap-3 py-2'>
      <span className='inline-flex items-center gap-2 text-[12px]' style={{ color: LABEL_COLOR }}>
        <span className='w-6 h-6 rounded-lg bg-brand-page flex items-center justify-center'>
          {icon}
        </span>
        {label}
      </span>
      <span className='text-[13px] font-semibold tabular-nums' style={{ color: VALUE_COLOR }}>
        {value}
      </span>
    </div>
  );
}

export function StrictSpecsBlock({ showcase }: Readonly<Props>) {
  const moq =
    showcase.moq != null && showcase.moq > 0 ? `${formatCompactNumber(showcase.moq)} ชิ้น` : '—';
  const lead =
    showcase.lead_time_days != null && showcase.lead_time_days > 0
      ? `${showcase.lead_time_days} วัน`
      : '—';

  return (
    <div className='divide-y divide-gray-100'>
      <Row
        icon={<Boxes className='w-3.5 h-3.5' style={{ color: 'var(--brand-mauve)' }} />}
        label='MOQ ขั้นต่ำ'
        value={moq}
      />
      <Row
        icon={<Clock3 className='w-3.5 h-3.5' style={{ color: 'var(--brand-mauve)' }} />}
        label='Lead time'
        value={lead}
      />
    </div>
  );
}
