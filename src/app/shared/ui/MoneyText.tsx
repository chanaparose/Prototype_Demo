import React from 'react';
import { formatCurrency } from '@/utils/formatting/formatCurrency';

type Props = {
  value: number;
  currencyCode?: string;
  className?: string;
};

export function MoneyText({ value, currencyCode = 'THB', className }: Props) {
  const text = formatCurrency(value, currencyCode);

  return (
    <span className={className} aria-label={`${currencyCode} ${text}`}>
      {text}
    </span>
  );
}
