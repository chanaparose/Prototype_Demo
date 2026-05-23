import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { type ReactNode } from 'react';

import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@lib/utils';

type StatusVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

type StatusBadgeProps = {
  variant?: StatusVariant;
  children: ReactNode;
  icon?: ReactNode;
  size?: NonNullable<VariantProps<typeof badgeVariants>['size']>;
  className?: string;
};

export function StatusBadge({
  variant = 'default',
  children,
  icon,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  return (
    <Badge variant={variant} size={size} className={cn(className)}>
      {icon}
      {children}
    </Badge>
  );
}
