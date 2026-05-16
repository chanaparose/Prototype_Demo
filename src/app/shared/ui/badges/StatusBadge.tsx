import React from 'react';

type StatusVariant =
  | 'pending'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'active'
  | 'inactive'
  | 'default';

type StatusBadgeProps = {
  variant?: StatusVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
};

const variantStyles: Record<StatusVariant, { bg: string; text: string; border: string }> = {
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  active: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
  default: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-[11px]',
};

export function StatusBadge({
  variant = 'default',
  children,
  icon,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeStyles[size]} font-semibold rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
