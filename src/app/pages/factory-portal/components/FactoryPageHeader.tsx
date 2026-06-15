import React from 'react';
import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { factoryBadgeClass, factoryButtonClass } from '@/pages/factory-portal/factoryUi';

export function FactoryPageHeader({
  title,
  subtitle,
  icon: Icon,
  count,
  action,
  actionNode,
  variant = 'card',
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  count?: string;
  action?: { label: string; to: string };
  actionNode?: React.ReactNode;
  variant?: 'card' | 'minimal';
}) {
  const content = (
    <div className='flex items-start justify-between gap-3'>
      <div className='min-w-0 flex items-start gap-3'>
        {Icon && variant !== 'minimal' ? (
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-lavender text-brand-purple'>
            <Icon size={20} strokeWidth={2} />
          </div>
        ) : null}
        <div className='min-w-0'>
          {variant === 'minimal' ? (
            <div className='mb-1.5 flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-400'>
              {Icon ? (
                <Icon size={16} className='shrink-0 text-brand-purple/70' strokeWidth={1.9} />
              ) : null}
              {subtitle ? <span className='truncate'>{subtitle}</span> : null}
            </div>
          ) : subtitle ? (
            <p className='text-xs font-medium text-slate-500'>{subtitle}</p>
          ) : null}
          <h1
            className={
              variant === 'minimal'
                ? 'truncate text-xl font-bold text-slate-950 sm:text-2xl'
                : 'truncate text-lg font-bold text-slate-900 sm:text-xl'
            }
          >
            {title}
          </h1>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        {typeof count === 'string' ? (
          <span
            className={factoryBadgeClass({
              variant: 'count',
              className: 'bg-slate-100 text-slate-700',
            })}
          >
            {count}
          </span>
        ) : null}
        {action ? (
          <Link to={action.to} className={factoryButtonClass({ variant: 'primary', size: 'sm' })}>
            {action.label}
            <ChevronRight size={14} />
          </Link>
        ) : null}
        {actionNode}
      </div>
    </div>
  );

  if (variant === 'minimal') {
    return <div className='border-b border-slate-200/70 pb-4'>{content}</div>;
  }

  return (
    <div className='rounded-md border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5'>
      {content}
    </div>
  );
}
