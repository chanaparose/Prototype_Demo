import React from 'react';
import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

export function FactoryPageHeader({
  title,
  subtitle,
  icon: Icon,
  count,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  count?: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className='rounded-md border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex items-start gap-3'>
          {Icon ? (
            <div className='w-10 h-10 rounded-md bg-brand-lavender text-brand-purple flex items-center justify-center shrink-0'>
              <Icon size={20} />
            </div>
          ) : null}
          <div className='min-w-0'>
            {subtitle ? <p className='text-xs font-medium text-slate-500'>{subtitle}</p> : null}
            <h1 className='text-lg sm:text-xl font-bold text-slate-900 truncate'>{title}</h1>
          </div>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          {typeof count === 'string' ? (
            <span className='inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700'>
              {count}
            </span>
          ) : null}
          {action ? (
            <Link
              to={action.to}
              className='inline-flex items-center gap-1 rounded-md bg-brand-purple px-3 py-2 text-xs font-semibold text-white hover:bg-brand-violet-deep'
            >
              {action.label}
              <ChevronRight size={14} />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
