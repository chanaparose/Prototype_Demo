import { z } from 'zod';
import { asRecord } from '@/lib/apiShape';

function isFutureOrToday(raw: string): boolean {
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
}

export const certFormSchema = z.object({
  cert_id: z.number().int().positive('กรุณาเลือกประเภทใบรับรอง'),
  cert_number: z.string().optional(),
  expire_date: z
    .string()
    .min(1, 'กรุณาเลือกวันหมดอายุ')
    .refine(isFutureOrToday, 'วันหมดอายุต้องเป็นวันนี้หรืออนาคต'),
  file: z.union([z.instanceof(File), z.null()]).optional(),
});

export type CertFormInput = z.input<typeof certFormSchema>;
export type CertFormValues = z.output<typeof certFormSchema>;

export type CertFormSubmitValue = {
  cert_id: number;
  cert_number?: string;
  expire_date: string;
  file: File | null;
};

export function certFormValuesFromRow(initial: unknown, fallbackCertId: number): CertFormInput {
  const row = asRecord(initial);
  const rawCertId = Number(row.certificate_id ?? row.cert_id ?? fallbackCertId);
  const expire = String(row.expire_date ?? '').trim();
  return {
    cert_id: Number.isFinite(rawCertId) && rawCertId > 0 ? rawCertId : fallbackCertId,
    cert_number: String(row.cert_number ?? '').trim(),
    expire_date: expire.length >= 10 ? expire.slice(0, 10) : expire,
    file: null,
  };
}

export function toCertSubmitValue(values: CertFormValues): CertFormSubmitValue {
  return {
    cert_id: values.cert_id,
    cert_number: values.cert_number?.trim() || undefined,
    expire_date: values.expire_date,
    file: values.file ?? null,
  };
}

export function validateCertFormForSubmit(
  values: CertFormValues,
  mode: 'create' | 'edit',
): string | null {
  const parsed = certFormSchema.safeParse(values);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง';
  }
  if (mode === 'create' && !values.file) {
    return 'กรุณาอัปโหลดไฟล์เอกสาร';
  }
  return null;
}
