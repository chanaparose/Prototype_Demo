import { z } from 'zod';
import { asRecord, type ApiRecord } from '@/lib/apiShape';

export const addressFormSchema = z.object({
  address_type: z.enum(['M', 'B', 'S']),
  province_id: z.string().min(1, 'กรุณาเลือกจังหวัด'),
  district_id: z.string().min(1, 'กรุณาเลือกอำเภอ/เขต'),
  sub_district_id: z.string().min(1, 'กรุณาเลือกตำบล/แขวง'),
  zip_code: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'),
  address_detail: z.string().trim().min(1, 'กรุณากรอกที่อยู่'),
  is_default: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

export type AddressFormPayload = {
  address_type: 'M' | 'B' | 'S';
  address_detail: string;
  sub_district_id: number;
  district_id: number;
  province_id: number;
  zip_code: string;
  is_default?: boolean;
};

export const defaultAddressFormValues: AddressFormValues = {
  address_type: 'M',
  province_id: '',
  district_id: '',
  sub_district_id: '',
  zip_code: '',
  address_detail: '',
  is_default: false,
};

export function addressFormValuesFromRow(row: unknown): AddressFormValues {
  const r = asRecord(row);
  const t = String(r.address_type ?? '').toUpperCase();
  return {
    address_type: t === 'B' || t === 'S' ? t : 'M',
    province_id: String(r.province_id ?? '').trim(),
    district_id: String(r.district_id ?? '').trim(),
    sub_district_id: String(r.sub_district_id ?? '').trim(),
    zip_code: String(r.zip_code ?? '').trim(),
    address_detail: String(r.address_detail ?? '').trim(),
    is_default: Boolean(r.is_default),
  };
}

export function toAddressFormPayload(values: AddressFormValues): AddressFormPayload {
  const province_id = Number(values.province_id);
  const district_id = Number(values.district_id);
  const sub_district_id = Number(values.sub_district_id);
  return {
    address_type: values.address_type,
    address_detail: values.address_detail.trim(),
    province_id,
    district_id,
    sub_district_id,
    zip_code: values.zip_code.trim(),
    ...(values.is_default ? { is_default: true } : {}),
  };
}
