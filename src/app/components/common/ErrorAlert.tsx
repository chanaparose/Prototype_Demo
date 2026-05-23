import * as React from 'react';
import { type ReactNode } from 'react';

import { Alert, alertVariants } from '@/components/ui/alert';
import { cn } from '@lib/utils';
import type { VariantProps } from 'class-variance-authority';

type ErrorAlertSize = NonNullable<VariantProps<typeof alertVariants>['size']>;

type ErrorAlertProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  children: ReactNode;
  size?: ErrorAlertSize;
  action?: ReactNode;
  variant?: NonNullable<VariantProps<typeof alertVariants>['variant']>;
};

function ErrorAlert({
  children,
  className,
  size = 'md',
  action,
  variant = 'destructive',
  ...props
}: ErrorAlertProps) {
  return (
    <Alert
      variant={variant}
      size={size}
      className={cn(action && 'flex items-center justify-between gap-3', className)}
      {...props}
    >
      <span className='min-w-0'>{children}</span>
      {action}
    </Alert>
  );
}

export { ErrorAlert };
