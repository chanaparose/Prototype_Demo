export function formatCurrency(
  value: number,
  currencyCode: string = 'THB'
): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatCurrencyNoDecimals(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function parseCurrency(currencyStr: string): number {
  return Number(currencyStr.replace(/[^0-9.-]/g, '')) || 0;
}

export function formatPercentage(
  value: number,
  decimals: number = 0,
  scale: boolean = true
): string {
  const numValue = scale ? value * 100 : value;
  return new Intl.NumberFormat('th-TH', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(scale ? value : numValue / 100);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
