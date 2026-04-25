import React from 'react';

export type DimensionValue = { L: number; W: number; H: number; unit: 'mm' | 'cm' | 'm' };

type Props = {
  value?: DimensionValue;
  onChange: (next: DimensionValue | undefined) => void;
};

export function DimensionInput({ value, onChange }: Props) {
  const v = value ?? { L: 0, W: 0, H: 0, unit: 'mm' as const };
  return (
    <div className="grid grid-cols-4 gap-2">
      {(['L', 'W', 'H'] as const).map((key) => (
        <input
          key={key}
          type="number"
          min={0}
          placeholder={key}
          value={v[key] || ''}
          onChange={(e) => onChange({ ...v, [key]: Number(e.target.value) || 0 })}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
      ))}
      <select
        value={v.unit}
        onChange={(e) => onChange({ ...v, unit: e.target.value as 'mm' | 'cm' | 'm' })}
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      >
        <option value="mm">mm</option>
        <option value="cm">cm</option>
        <option value="m">m</option>
      </select>
    </div>
  );
}
