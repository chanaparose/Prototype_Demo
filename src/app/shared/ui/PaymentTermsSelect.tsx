import React from 'react';

type PaymentTerm = '50_50' | '30_70' | 'net_30' | 'lc_at_sight';

type Props = {
  value?: PaymentTerm;
  onChange: (v: PaymentTerm | undefined) => void;
  className?: string;
};

const OPTIONS: { value: PaymentTerm; label: string }[] = [
  { value: '50_50', label: 'มัดจำ 50% / ก่อนส่ง 50%' },
  { value: '30_70', label: 'มัดจำ 30% / ก่อนส่ง 70%' },
  { value: 'net_30', label: 'Net 30 วัน' },
  { value: 'lc_at_sight', label: 'L/C at sight' },
];

export function PaymentTermsSelect({ value, onChange, className }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || undefined) as PaymentTerm | undefined)}
      className={className ?? 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'}
    >
      <option value="">เลือกเงื่อนไขชำระเงิน</option>
      {OPTIONS.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  );
}
