import React from 'react';
import type { ProductionStepTemplate } from '../../production/types';

type Props = {
  steps: ProductionStepTemplate[];
};

export function FadedStepPreview({ steps }: Props) {
  const sorted = [...steps].sort((a, b) => a.sort_order - b.sort_order);
  if (!sorted.length) return null;

  return (
    <div className="w-full max-w-md mx-auto opacity-40 pointer-events-none select-none">
      <p className="mb-3 text-center text-xs text-gray-600">
        เมื่อชำระแล้ว คุณจะเห็นขั้นตอนการผลิต 6 ขั้น:
      </p>
      <ul className="space-y-2">
        {sorted.map((s) => (
          <li
            key={s.step_id}
            className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-500 border border-gray-100">
              {s.sort_order}
            </span>
            <span className="flex-1 text-sm text-gray-800">{s.step_name_th}</span>
            {s.is_payment_trigger ? <span className="text-xs shrink-0">💰</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
