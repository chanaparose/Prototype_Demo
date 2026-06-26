import React from 'react';
import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@lib/utils';
import { FactoryIdeasHeaderBackdrop } from '@/components/features/factory-ideas/FactoryIdeasPageHeader';

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  count,
  action,
  actionNode,
  variant = 'card',
  withBackdrop = false,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  count?: string;
  action?: { label: string; to: string };
  actionNode?: React.ReactNode;
  variant?: 'card' | 'minimal';
  withBackdrop?: boolean;
  className?: string;
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
            <div className='mb-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-400'>
              {Icon ? (
                <Icon size={14} className='shrink-0 text-brand-purple/60' strokeWidth={2.25} />
              ) : null}
              {subtitle ? <span className='truncate'>{subtitle}</span> : null}
            </div>
          ) : subtitle ? (
            <p className='text-xs font-medium text-slate-500'>{subtitle}</p>
          ) : null}
          <h1
            className={
              variant === 'minimal'
                ? 'truncate text-[16px] font-semibold leading-snug text-brand-navy-ink sm:text-lg'
                : 'truncate text-lg font-bold text-slate-900 sm:text-xl'
            }
          >
            {title}
          </h1>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        {typeof count === 'string' ? (
          <span className='inline-flex items-center justify-center rounded-full bg-brand-violet-soft px-2 py-0.5 text-[10px] font-semibold text-brand-purple'>
            {count}
          </span>
        ) : null}
        {action ? (
          <Link
            to={action.to}
            className='inline-flex items-center gap-1.5 rounded-lg bg-brand-purple px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-violet-deep'
          >
            {action.label}
            <ChevronRight size={14} />
          </Link>
        ) : null}
        {actionNode}
      </div>
    </div>
  );

  if (variant === 'minimal') {
    const useBackdrop = withBackdrop !== false;

    if (useBackdrop) {
      return (
        <div className={cn('relative overflow-hidden', className)}>
          <FactoryIdeasHeaderBackdrop />
          <div className='relative z-10'>{content}</div>
        </div>
      );
    }

    return <div className={cn(className)}>{content}</div>;
  }

  return (
    <div className={cn('rounded-md border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5', className)}>
      {content}
    </div>
  );
}
