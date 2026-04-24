import React from 'react';

type Props = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function CertificationChips({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label="certifications">
      {options.map((opt, idx) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            role="option"
            aria-selected={active}
            tabIndex={0}
            onClick={() =>
              onChange(active ? value.filter((v) => v !== opt) : [...value, opt])
            }
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
                onChange(active ? value.filter((v) => v !== opt) : [...value, opt]);
              }
              if (e.key === 'ArrowRight') {
                const next = document.querySelectorAll<HTMLButtonElement>('[role="option"]')[idx + 1];
                next?.focus();
              }
              if (e.key === 'ArrowLeft') {
                const prev = document.querySelectorAll<HTMLButtonElement>('[role="option"]')[idx - 1];
                prev?.focus();
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              active
                ? 'bg-violet-100 border-violet-300 text-violet-800'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
