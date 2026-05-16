import React from 'react';

type InfoBoxVariant = 'info' | 'warning' | 'success' | 'error' | 'neutral';

const variantStyles: Record<InfoBoxVariant, { bg: string; border: string }> = {
  info: 'bg-blue-50 border-blue-100',
  warning: 'bg-amber-50 border-amber-100',
  success: 'bg-emerald-50 border-emerald-100',
  error: 'bg-red-50 border-red-100',
  neutral: 'bg-gray-50 border-gray-100',
};

type InfoBoxProps = {
  icon?: React.ReactNode;
  title?: string;
  variant?: InfoBoxVariant;
  children: React.ReactNode;
  className?: string;
};

export function InfoBox({
  icon,
  title,
  variant = 'neutral',
  children,
  className = '',
}: InfoBoxProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${variantStyles[variant]} ${className}`}
    >
      {(icon || title) && (
        <div className="flex items-center gap-2 mb-2">
          {icon && <span className="text-lg shrink-0">{icon}</span>}
          {title && <p className="text-sm font-semibold text-gray-900">{title}</p>}
        </div>
      )}
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}
