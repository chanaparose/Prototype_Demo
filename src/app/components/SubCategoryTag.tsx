import React from 'react';

export type SubCategoryTagProps = {
  name: string;
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  /** ถ้า true แสดง prefix "sub: " (ตาม mock ใน spec) */
  showSubPrefix?: boolean;
};

export function SubCategoryTag({
  name,
  variant = 'outline',
  size = 'sm',
  className = '',
  showSubPrefix = false,
}: SubCategoryTagProps) {
  const n = name?.trim();
  if (!n) return null;
  const sz = size === 'md' ? 'text-[13px] px-3 py-1' : 'text-[11px] px-2.5 py-0.5';
  const base =
    variant === 'solid'
      ? 'bg-violet-600 text-white border-violet-600'
      : 'bg-violet-50/90 text-violet-700 border-violet-200';
  const label = showSubPrefix ? `sub: ${n}` : n;
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${sz} ${base} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
