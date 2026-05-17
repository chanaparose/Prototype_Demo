import * as React from 'react';

import { cn } from '@lib/utils';

type ErrorAlertSize = 'sm' | 'md';

type ErrorAlertProps = Omit<React.ComponentProps<'p'>, 'children'> & {
  children: React.ReactNode;
  size?: ErrorAlertSize;
  action?: React.ReactNode;
};

const sizeStyles: Record<ErrorAlertSize, string> = {
  sm: 'text-xs px-3 py-2',
  md: 'text-sm px-4 py-3',
};

function ErrorAlert({ children, className, size = 'md', action, ...props }: ErrorAlertProps) {
  const styles = cn(
    'text-red-600 bg-red-50 border border-red-100 rounded-xl',
    sizeStyles[size],
    action && 'flex items-center justify-between gap-3',
    className,
  );

  if (action) {
    return (
      <div role='alert' className={styles}>
        <span>{children}</span>
        {action}
      </div>
    );
  }

  return (
    <p role='alert' className={styles} {...props}>
      {children}
    </p>
  );
}

export { ErrorAlert };
