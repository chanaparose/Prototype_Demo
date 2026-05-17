import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@lib/utils';

const cardVariants = cva('rounded-2xl border bg-white', {
  variants: {
    variant: {
      default: 'border-gray-100 shadow-sm',
      elevated: 'border-gray-100 shadow-md',
      outline: 'border-gray-200 shadow-none',
      ghost: 'border-transparent bg-transparent shadow-none',
      muted: 'border-slate-200 bg-slate-50/80 shadow-none',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'none',
  },
});

function Card({
  className,
  variant,
  padding,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot='card'
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn('border-b border-gray-100 px-4 py-3', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot='card-title'
      className={cn('text-sm font-semibold text-gray-900', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p data-slot='card-description' className={cn('text-xs text-gray-500', className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-content' className={cn('px-4 py-4', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn('border-t border-gray-100 px-4 py-3', className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
