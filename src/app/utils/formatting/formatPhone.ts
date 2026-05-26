/** Thai mobile: 10 digits, e.g. 098-889-3983 */
export const THAI_PHONE_RE = /^0[6-9]\d{8}$/;

export function digitsOnlyPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

/** Format as XXX-XXX-XXXX while typing */
export function formatThaiPhoneDisplay(value: string): string {
  const d = digitsOnlyPhone(value);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isValidThaiPhone(value: string): boolean {
  return THAI_PHONE_RE.test(digitsOnlyPhone(value));
}
