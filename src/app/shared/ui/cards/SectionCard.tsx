import React, { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SectionCardProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  actionButton?: ReactNode;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  titleClassName?: string;
};

export function SectionCard({
  icon,
  title,
  subtitle,
  badge,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  actionButton,
  iconClassName = 'w-11 h-11 rounded-xl bg-violet-50 text-base',
  iconStyle,
  titleClassName = 'text-sm font-semibold text-gray-900',
}: SectionCardProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className={headerClassName}>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-start gap-3 flex-1'>
            {icon && (
              <div
                className={`shrink-0 flex items-center justify-center ${iconClassName}`}
                style={iconStyle}
              >
                {icon}
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <CardTitle className={titleClassName}>{title}</CardTitle>
              {subtitle && <p className='text-xs text-gray-500 mt-0.5'>{subtitle}</p>}
            </div>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            {badge}
            {actionButton}
          </div>
        </div>
      </CardHeader>

      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
