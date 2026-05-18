import * as React from 'react';

import { cn } from '@lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot='input'
        className={cn(
          'h-9 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-700 focus-visible:border-brand-purple/60 focus-visible:ring-[3px] focus-visible:ring-brand-purple/20 aria-invalid:border-status-danger aria-invalid:ring-status-danger/20',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
