import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <Select
      value={value ?? ''}
      onValueChange={(next) => onChange(next === '__empty' ? undefined : (next as PaymentTerm))}
    >
      <SelectTrigger className={className ?? 'w-full'}>
        <SelectValue placeholder='เลือกเงื่อนไขชำระเงิน' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='__empty'>เลือกเงื่อนไขชำระเงิน</SelectItem>
        {OPTIONS.map((it) => (
          <SelectItem key={it.value} value={it.value}>
            {it.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
