import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export type ApiAddressRow = Record<string, unknown>;

export type MappedAddress = {
  id: number;
  addressDetail: string;
  subDistrict: string;
  district: string;
  province: string;
  zipCode: string;
  addressType: string;
  isDefault: boolean;
};

export function mapAddressFromApi(row: ApiAddressRow): MappedAddress | null {
  const id = pickScalarNumber(row.address_id, row.id) ?? 0;
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    addressDetail: pickScalarString(row.address_detail, row.detail, row.address_line),
    subDistrict: pickScalarString(
      row.sub_district_name,
      row.subdistrict_name,
      row.sub_district,
      row.subDistrict,
    ),
    district: pickScalarString(row.district_name, row.amphoe_name, row.district),
    province: pickScalarString(row.province_name, row.provinceName, row.province),
    zipCode: pickScalarString(row.zip_code, row.zipCode, row.postcode),
    addressType: pickScalarString(row.address_type).toUpperCase(),
    isDefault: Boolean(row.is_default ?? false),
  };
}

export function formatAddressLabel(address: MappedAddress): string {
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

export function formatAddressLocation(address: Pick<MappedAddress, 'province' | 'district' | 'subDistrict' | 'zipCode'>): string {
  const isBangkok = /กรุงเทพ/.test(address.province);
  const subDistrictLabel = isBangkok ? 'แขวง' : 'ตำบล';
  const districtLabel = isBangkok ? 'เขต' : 'อำเภอ';
  const parts: string[] = [];

  if (address.subDistrict) parts.push(`${subDistrictLabel}${address.subDistrict}`);
  if (address.district) parts.push(`${districtLabel}${address.district}`);
  if (address.province) parts.push(`จ.${address.province}`);
  if (address.zipCode) parts.push(address.zipCode);

  return parts.length > 0 ? parts.join(' ') : '—';
}
