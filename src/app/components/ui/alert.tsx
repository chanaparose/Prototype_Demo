import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@lib/utils';

const alertVariants = cva('rounded-xl border', {
  variants: {
    variant: {
      default: 'bg-gray-50 text-gray-800 border-gray-200',
      destructive: 'text-red-600 bg-red-50 border-red-100',
      warning: 'text-amber-800 bg-amber-50 border-amber-100',
      success: 'text-emerald-800 bg-emerald-50 border-emerald-100',
      info: 'text-blue-800 bg-blue-50 border-blue-100',
    },
    size: {
      sm: 'text-xs px-3 py-2',
      md: 'text-sm px-4 py-3',
    },
  },
  defaultVariants: {
    variant: 'destructive',
    size: 'md',
  },
});

function Alert({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role='alert'
      data-slot='alert'
      className={cn(alertVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot='alert-title' className={cn('font-semibold leading-none', className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='alert-description'
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle, alertVariants };
