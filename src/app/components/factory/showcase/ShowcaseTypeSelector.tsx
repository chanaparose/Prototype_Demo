import React from 'react';
import { Button } from '@/components/ui/button';
import { SHOWCASE_TYPES, SHOWCASE_TYPE_META, type ShowcaseType } from '@/constants/showcase';

export type { ShowcaseType };

interface ShowcaseTypeSelectorProps {
  value: ShowcaseType;
  onChange: (type: ShowcaseType) => void;
  disabled?: boolean;
}

export function ShowcaseTypeSelector({ value, onChange, disabled }: ShowcaseTypeSelectorProps) {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-gray-50 p-1 border border-gray-200'>
      {SHOWCASE_TYPES.map((type) => {
        const opt = SHOWCASE_TYPE_META[type];
        const active = value === type;
        return (
          <Button
            variant='unstyled'
            key={type}
            type='button'
            onClick={() => onChange(type)}
            disabled={disabled}
            className={`rounded-xl px-3 py-2 text-left transition-colors border ${
              active
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            <div className='text-sm font-semibold flex items-center gap-1'>
              <span>{opt.icon}</span>
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
