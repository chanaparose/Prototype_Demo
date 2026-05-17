import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Incoterm = 'EXW' | 'FOB' | 'CIF' | 'DDP';

type Props = {
  value?: Incoterm;
  onChange: (v: Incoterm | undefined) => void;
  className?: string;
};

const OPTIONS: Incoterm[] = ['EXW', 'FOB', 'CIF', 'DDP'];

export function IncotermSelect({ value, onChange, className }: Props) {
  return (
    <Select
      value={value ?? ''}
      onValueChange={(next) => onChange(next === '__empty' ? undefined : (next as Incoterm))}
    >
      <SelectTrigger className={className ?? 'w-full'}>
        <SelectValue placeholder='เลือก Incoterm' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='__empty'>เลือก Incoterm</SelectItem>
        {OPTIONS.map((it) => (
          <SelectItem key={it} value={it}>
            {it}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
