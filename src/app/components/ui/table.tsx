import * as React from 'react';

import { cn } from '@lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return <table data-slot='table' className={cn('w-full text-sm', className)} {...props} />;
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot='table-header'
      className={cn('bg-gray-50 dark:bg-gray-800/60', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot='table-body'
      className={cn('divide-y divide-slate-100 dark:divide-slate-700/60', className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn('px-4 py-3 text-sm text-slate-700 dark:text-slate-300', className)}
      {...props}
    />
  );
}

function TableEmpty({ className, children, ...props }: React.ComponentProps<'td'>) {
  return (
    <TableCell
      data-slot='table-empty'
      className={cn('py-12 text-center text-sm text-slate-400', className)}
      {...props}
    >
      {children}
    </TableCell>
  );
}

function TableSkeletonRows({ rows = 5, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className='h-4 w-full' />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
};
