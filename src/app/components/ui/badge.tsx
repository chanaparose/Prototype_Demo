import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-semibold border rounded-full shrink-0 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-50 text-gray-700 border-gray-200',
        pending: 'bg-amber-50 text-amber-900 border-amber-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        error: 'bg-red-50 text-red-700 border-red-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        active: 'bg-violet-50 text-violet-700 border-violet-200',
        inactive: 'bg-gray-100 text-gray-600 border-gray-200',
        outline: 'bg-transparent text-gray-700 border-gray-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-[11px]',
        lg: 'px-3 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot='badge'
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
