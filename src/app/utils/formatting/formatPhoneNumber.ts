export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';

  const cleaned = String(phone).replace(/\D/g, '');

  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

export function parsePhoneNumber(formatted: string): string {
  return (formatted || '').replace(/\D/g, '');
}

export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.length === 10 && cleaned.startsWith('0');
}

export function toInternationalFormat(phone: string): string {
  const cleaned = (phone || '').replace(/\D/g, '');

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+66' + cleaned.slice(1);
  }

  if (cleaned.startsWith('66') && cleaned.length === 11) {
    return '+' + cleaned;
  }

  return phone;
}

export function toThaiFormat(phone: string): string {
  const cleaned = (phone || '').replace(/\D/g, '');

  if (cleaned.startsWith('66') && cleaned.length === 11) {
    return '0' + cleaned.slice(2);
  }

  return formatPhoneNumber(phone);
}
