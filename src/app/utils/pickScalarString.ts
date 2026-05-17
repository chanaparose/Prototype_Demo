/** คืนค่า string แรกที่เป็น string/number เท่านั้น (ไม่ stringify object เป็น [object Object]) */
export function pickScalarString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}
