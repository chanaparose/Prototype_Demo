import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export type DimensionValue = { L: number; W: number; H: number; unit: 'mm' | 'cm' | 'm' };

type Props = {
  value?: DimensionValue;
  onChange: (next: DimensionValue | undefined) => void;
};

export function DimensionInput({ value, onChange }: Props) {
  const v = value ?? { L: 0, W: 0, H: 0, unit: 'mm' as const };
  return (
    <div className='grid grid-cols-4 gap-2'>
      {(['L', 'W', 'H'] as const).map((key) => (
        <Input
          key={key}
          type='number'
          min={0}
          placeholder={key}
          value={v[key] || ''}
          onChange={(e) => onChange({ ...v, [key]: Number(e.target.value) || 0 })}
          className='rounded-xl border border-gray-200 px-3 py-2 text-sm'
        />
      ))}
      <Select
        value={v.unit}
        onValueChange={(next) => onChange({ ...v, unit: next as 'mm' | 'cm' | 'm' })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='mm'>mm</SelectItem>
          <SelectItem value='cm'>cm</SelectItem>
          <SelectItem value='m'>m</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
