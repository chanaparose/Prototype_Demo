import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

type Row = Record<string, unknown>;

export interface MasterAddressOption {
  id: number;
  name: string;
}

export interface MasterSubDistrictOption extends MasterAddressOption {
  zipCode?: string;
}

export function mapProvinceOption(row: Row): MasterAddressOption | null {
  const id = pickScalarNumber(row.province_id, row.row_id, row.id) ?? 0;
  const name = pickScalarString(row.province_name, row.name_th, row.name, row.name_en);
  if (!Number.isFinite(id) || id <= 0 || !name) return null;
  return { id, name };
}

export function mapDistrictOption(row: Row): MasterAddressOption | null {
  const id = pickScalarNumber(row.district_id, row.row_id, row.id) ?? 0;
  const name = pickScalarString(row.district_name, row.name_th, row.name, row.name_en);
  if (!Number.isFinite(id) || id <= 0 || !name) return null;
  return { id, name };
}

export function mapSubDistrictOption(row: Row): MasterSubDistrictOption | null {
  const id = pickScalarNumber(row.sub_district_id, row.row_id, row.id) ?? 0;
  const name = pickScalarString(row.sub_district_name, row.name_th, row.name, row.name_en);
  if (!Number.isFinite(id) || id <= 0 || !name) return null;
  const zipCode = pickScalarString(row.zip_code, row.postcode);
  return {
    id,
    name,
    ...(zipCode ? { zipCode } : {}),
  };
}
