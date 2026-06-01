import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function CertificationChips({ options, value, onChange }: Props) {
  return (
    <div className='flex flex-wrap gap-2' role='listbox' aria-label='certifications'>
      {options.map((opt, idx) => {
        const active = value.includes(opt);
        return (
          <Button
            key={opt}
            role='option'
            aria-selected={active}
            tabIndex={0}
            onClick={() => onChange(active ? value.filter((v) => v !== opt) : [...value, opt])}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
                onChange(active ? value.filter((v) => v !== opt) : [...value, opt]);
              }
              if (e.key === 'ArrowRight') {
                const next =
                  document.querySelectorAll<HTMLButtonElement>('[role="option"]')[idx + 1];
                next?.focus();
              }
              if (e.key === 'ArrowLeft') {
                const prev =
                  document.querySelectorAll<HTMLButtonElement>('[role="option"]')[idx - 1];
                prev?.focus();
              }
            }}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              active
                ? 'border-violet-300 bg-violet-100 text-violet-800 hover:border-violet-400 hover:bg-violet-200/80'
                : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800'
            }`}
          >
            {opt}
          </Button>
        );
      })}
    </div>
  );
}
