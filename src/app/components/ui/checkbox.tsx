import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className={cn(
        'peer size-4 shrink-0 rounded border border-gray-300 bg-white shadow-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-brand-purple/60 focus-visible:ring-[3px] focus-visible:ring-brand-purple/20 data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple data-[state=checked]:text-white aria-invalid:border-status-danger aria-invalid:ring-status-danger/20',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot='checkbox-indicator'
        className='flex items-center justify-center text-current'
      >
        <CheckIcon className='size-3.5' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
