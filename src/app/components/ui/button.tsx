import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../../lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-1',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-300',
        outline: 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50',
        secondary: 'bg-gray-100 text-gray-800 shadow-none hover:bg-gray-200',
        neutral: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800',
        ghost: 'shadow-none text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        link: 'h-auto rounded-none p-0 shadow-none text-violet-700 underline-offset-4 hover:underline',
        unstyled: '',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: 'h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*="size-"])]:size-3',
        sm: 'h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-xl px-6 has-[>svg]:px-4',
        icon: 'size-9 p-0',
        'icon-xs': 'size-6 rounded-md p-0 [&_svg:not([class*="size-"])]:size-3',
        'icon-sm': 'size-8 p-0',
        'icon-lg': 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  type,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
}) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={variant === 'unstyled' ? cn(className) : cn(buttonVariants({ variant, size, className }))}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    />
  );
}

export { Button, buttonVariants };
