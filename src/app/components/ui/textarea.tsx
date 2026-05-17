import * as React from 'react';

import { cn } from '@lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'min-h-24 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-brand-purple/60 focus-visible:ring-[3px] focus-visible:ring-brand-purple/20 aria-invalid:border-status-danger aria-invalid:ring-status-danger/20',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
