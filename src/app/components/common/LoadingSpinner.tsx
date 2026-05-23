import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerVariant = 'ring' | 'pulse';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  color?: string;
  fullHeight?: boolean;
  className?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-6 w-6 border-2',
  md: 'h-9 w-9 border-2',
  lg: 'h-10 w-10 border-2',
};

const variantMap: Record<SpinnerVariant, string> = {
  ring: 'rounded-full border-violet-600 border-t-transparent',
  pulse: 'rounded-full',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'ring',
  color,
  fullHeight = false,
  className = '',
}: Readonly<LoadingSpinnerProps>) {
  const sizeClass = sizeMap[size];
  const variantClass = variantMap[variant];
  const spinColor = color || 'border-violet-600 border-t-transparent';

  const spinnerClass = `animate-spin ${sizeClass} ${variantClass} ${
    variant === 'ring' ? spinColor : ''
  } ${className}`;

  if (fullHeight) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center px-4 pb-20 pt-8'>
        <span className={spinnerClass} aria-hidden />
      </div>
    );
  }

  return <span className={spinnerClass} aria-hidden />;
}
