import React from 'react';

type Props = {
  value: number;
  currencyCode?: string;
  className?: string;
};

export function MoneyText({ value, currencyCode = 'THB', className }: Props) {
  const text = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

  return (
    <span className={className} aria-label={`${currencyCode} ${text}`}>
      {text}
    </span>
  );
}
