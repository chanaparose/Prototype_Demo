import React from 'react';

type Incoterm = 'EXW' | 'FOB' | 'CIF' | 'DDP';

type Props = {
  value?: Incoterm;
  onChange: (v: Incoterm | undefined) => void;
  className?: string;
};

const OPTIONS: Incoterm[] = ['EXW', 'FOB', 'CIF', 'DDP'];

export function IncotermSelect({ value, onChange, className }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || undefined) as Incoterm | undefined)}
      className={className ?? 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'}
    >
      <option value=''>เลือก Incoterm</option>
      {OPTIONS.map((it) => (
        <option key={it} value={it}>
          {it}
        </option>
      ))}
    </select>
  );
}
