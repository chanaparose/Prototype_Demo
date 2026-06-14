export const FACTORY_IDEAS_MOQ_OPTIONS = [
  { value: 'all', label: 'ขั้นต่ำทั้งหมด' },
  { value: '100', label: '≤ 100' },
  { value: '500', label: '≤ 500' },
  { value: '1000', label: '≤ 1,000' },
  { value: '5000', label: '≤ 5,000' },
  { value: '10000', label: '≤ 10,000' },
] as const;

export type FactoryIdeasMoqFilterValue = (typeof FACTORY_IDEAS_MOQ_OPTIONS)[number]['value'];

export function parseMoqFilterValue(value: FactoryIdeasMoqFilterValue): number | null {
  if (value === 'all') return null;
  return Number(value);
}

export function matchesMaxMoq(minOrder: number, maxMoq: number | null): boolean {
  if (maxMoq == null) return true;
  if (!Number.isFinite(minOrder) || minOrder <= 0) return true;
  return minOrder <= maxMoq;
}
