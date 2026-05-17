import * as React from 'react';

import { cn } from '@lib/utils';

type EmptyStateProps = React.ComponentProps<'div'> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

function EmptyState({ className, icon, title, description, action, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot='empty-state'
      className={cn('flex flex-col items-center justify-center px-4 py-10 text-center', className)}
      {...props}
    >
      {icon ? (
        <div
          data-slot='empty-state-icon'
          className='mb-3 flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-500'
        >
          {icon}
        </div>
      ) : null}
      <p data-slot='empty-state-title' className='text-sm font-medium text-gray-600'>
        {title}
      </p>
      {description ? (
        <p data-slot='empty-state-description' className='mt-1 text-xs text-gray-400'>
          {description}
        </p>
      ) : null}
      {action ? <div className='mt-4'>{action}</div> : null}
    </div>
  );
}

export { EmptyState };
