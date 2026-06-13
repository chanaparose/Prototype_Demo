import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@lib/utils';

type FactoryMetricCardProps = {
  label: string;
  value: React.ReactNode;
  badge: React.ReactNode;
  caption: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  badgeClassName?: string;
  onClick?: () => void;
};

export function FactoryMetricGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-4', className)}>
      {children}
    </div>
  );
}

export function FactoryMetricCard({
  label,
  value,
  badge,
  caption,
  active = false,
  danger = false,
  badgeClassName = 'bg-brand-lavender text-brand-purple',
  onClick,
}: FactoryMetricCardProps) {
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onClick}
      className={`rounded-lg border bg-white p-4 text-left transition-colors ${
        danger
          ? 'border-red-100 hover:border-red-200'
          : active
            ? 'border-brand-purple ring-2 ring-brand-purple/15'
            : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <p className={`text-xs font-medium ${danger ? 'text-red-600' : 'text-slate-500'}`}>{label}</p>
      <div className='mt-3 flex items-end justify-between gap-2'>
        <p
          className={`text-2xl font-bold tabular-nums leading-none sm:text-3xl ${
            danger ? 'text-red-700' : 'text-slate-900'
          }`}
        >
          {value}
        </p>
        <div className='flex min-w-0 items-center justify-end gap-1.5'>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClassName}`}
          >
            {badge}
          </span>
          <span className='truncate text-[11px] text-slate-400'>{caption}</span>
        </div>
      </div>
    </Button>
  );
}
