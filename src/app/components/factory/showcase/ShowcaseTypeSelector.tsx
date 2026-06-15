import React from 'react';
import { Button } from '@/components/ui/button';
import { ShowcaseTypeIcon } from '@/components/factory/showcase/ShowcaseTypeIcon';

export type ShowcaseType = 'PD' | 'PM' | 'ID' | 'MT';

interface ShowcaseTypeSelectorProps {
  value: ShowcaseType;
  onChange: (type: ShowcaseType) => void;
  disabled?: boolean;
}

const OPTIONS = [
  { type: 'PD', label: 'สินค้า', sublabel: 'Product Design' },
  { type: 'PM', label: 'โปรโมชัน', sublabel: 'Promotion' },
  { type: 'ID', label: 'ไอเดีย', sublabel: 'Industrial Design' },
  { type: 'MT', label: 'วัตถุดิบ', sublabel: 'Material' },
] as const;

export function ShowcaseTypeSelector({ value, onChange, disabled }: ShowcaseTypeSelectorProps) {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-gray-50 p-1 border border-gray-200'>
      {OPTIONS.map((opt) => {
        const active = value === opt.type;
        return (
          <Button
            variant='unstyled'
            key={opt.type}
            type='button'
            onClick={() => onChange(opt.type)}
            disabled={disabled}
            className={`rounded-lg px-3 py-2 text-left transition-colors border ${
              active
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            <div className='text-sm font-semibold flex items-center gap-1'>
              <ShowcaseTypeIcon type={opt.type} size={14} />
              <span>{opt.label}</span>
            </div>
            <p className={`text-[10px] ${active ? 'text-orange-100' : 'text-gray-400'}`}>
              {opt.sublabel}
            </p>
          </Button>
        );
      })}
    </div>
  );
}
