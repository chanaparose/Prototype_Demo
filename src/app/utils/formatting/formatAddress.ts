export function formatAddressOneLine(address: {
  addressDetail?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  zipCode?: string;
}): string {
  return [
    address.addressDetail,
    address.subDistrict,
    address.district,
    address.province,
    address.zipCode,
  ]
    .filter(Boolean)
    .join(', ');
}

export function formatAddressMultiLine(address: {
  addressDetail?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  zipCode?: string;
}): string {
  return [
    address.addressDetail,
    address.subDistrict,
    address.district,
    address.province,
    address.zipCode,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatPostalCode(zip: string | null | undefined): string {
  if (!zip) return '';
  return String(zip).replace(/\D/g, '');
}

export function parsePostalCode(formatted: string): string {
  return (formatted || '').replace(/\D/g, '');
}

export function isValidPostalCode(zip: string | null | undefined): boolean {
  if (!zip) return false;
  const cleaned = String(zip).replace(/\D/g, '');
  return cleaned.length === 5;
}

export function normalizeAddress(address: {
  addressDetail?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  zipCode?: string;
}): typeof address {
  return {
    addressDetail: (address.addressDetail || '').trim() || undefined,
    subDistrict: (address.subDistrict || '').trim() || undefined,
    district: (address.district || '').trim() || undefined,
    province: (address.province || '').trim() || undefined,
    zipCode: (address.zipCode || '').trim() || undefined,
  };
}

export function isCompleteAddress(address: {
  addressDetail?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  zipCode?: string;
}): boolean {
  return !!(
    address.addressDetail &&
    address.subDistrict &&
    address.district &&
    address.province &&
    address.zipCode
  );
}

export function getAddressSummary(address: {
  addressDetail?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  zipCode?: string;
}): string {
  const parts = [address.district, address.province].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '—';
}
