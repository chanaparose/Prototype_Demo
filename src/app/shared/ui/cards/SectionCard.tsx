import React from 'react';

type SectionCardProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  actionButton?: React.ReactNode;
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
    <div
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm ${className}`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b border-gray-100 ${headerClassName}`}>
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
              <h3 className={titleClassName}>{title}</h3>
              {subtitle && <p className='text-xs text-gray-500 mt-0.5'>{subtitle}</p>}
            </div>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            {badge}
            {actionButton}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`px-4 py-4 ${contentClassName}`}>{children}</div>
    </div>
  );
}
