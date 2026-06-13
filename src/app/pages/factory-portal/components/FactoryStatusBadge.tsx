import React from 'react';

import { cn } from '@lib/utils';

type FactoryStatusTone = 'neutral' | 'warning' | 'danger' | 'success' | 'info' | 'brand' | 'teal';

const toneClass: Record<FactoryStatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  success: 'bg-emerald-50 text-emerald-700',
  info: 'bg-sky-50 text-sky-700',
  brand: 'bg-brand-violet-soft text-brand-purple',
  teal: 'bg-teal-50 text-teal-700',
};

export function FactoryStatusBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: FactoryStatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type { FactoryStatusTone };
