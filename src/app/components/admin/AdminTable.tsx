import * as React from 'react';
import { cn } from '@lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
} from '@/components/ui/table';

function AdminTableContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      <div className='overflow-x-auto'>
        {children}
      </div>
    </div>
  );
}

function AdminTable({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <Table
      className={cn('w-full text-sm lg:text-base', className)}
      {...props}
    />
  );
}

function AdminTableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <TableHeader
      className={cn('bg-slate-50 border-b border-slate-200', className)}
      {...props}
    />
  );
}

function AdminTableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <TableBody
      className={cn('divide-y divide-slate-100', className)}
      {...props}
    />
  );
}

function AdminTableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <TableRow
      className={cn('hover:bg-slate-50 transition-colors', className)}
      {...props}
    />
  );
}

function AdminTableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <TableHead
      className={cn(
        'text-left px-4 py-3 text-sm font-semibold text-slate-600 uppercase tracking-wide',
        className
      )}
      {...props}
    />
  );
}

function AdminTableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <TableCell
      className={cn('px-4 py-3', className)}
      {...props}
    />
  );
}

export {
  AdminTableContainer,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  TableSkeletonRows,
};
