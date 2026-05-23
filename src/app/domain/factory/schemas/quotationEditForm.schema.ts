import { z } from 'zod';
import { asRecord } from '@/lib/apiShape';

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0), {
    message: 'กรุณากรอกตัวเลขที่ถูกต้อง',
  });

const requiredPositive = z
  .string()
  .trim()
  .min(1, 'กรุณากรอกราคาต่อชิ้น')
  .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
    message: 'กรุณากรอกราคาต่อชิ้นที่ถูกต้อง',
  });

const requiredPositiveInt = z
  .string()
  .trim()
  .min(1, 'กรุณากรอกระยะเวลาผลิต')
  .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
    message: 'กรอกระยะเวลาผลิต (วัน) ให้มากกว่า 0',
  });

export const quotationEditFormSchema = z
  .object({
    price_per_piece: requiredPositive,
    mold_cost: optionalMoney,
    lead_time_days: requiredPositiveInt,
    shipping_method_id: z.number().int().positive().nullable(),
    reason: z.string().trim().min(1, 'กรุณากรอกเหตุผลการแก้ไข'),
  })
  .refine((data) => data.shipping_method_id != null, {
    message: 'ไม่พบวิธีจัดส่งในใบเสนอราคา — ไม่สามารถบันทึกได้',
    path: ['shipping_method_id'],
  });

export type QuotationEditFormInput = z.input<typeof quotationEditFormSchema>;
export type QuotationEditFormValues = z.output<typeof quotationEditFormSchema>;

export const quotationEditFormDefaults: QuotationEditFormInput = {
  price_per_piece: '',
  mold_cost: '',
  lead_time_days: '',
  shipping_method_id: null,
  reason: '',
};

export function mapQuotationToEditForm(raw: unknown): QuotationEditFormInput {
  const row = asRecord(raw);
  const sid = Number(row.shipping_method_id ?? 0);
  return {
    price_per_piece: String(row.price_per_piece ?? ''),
    mold_cost: String(row.mold_cost ?? row.tooling_mold_cost ?? ''),
    lead_time_days: String(row.lead_time_days ?? ''),
    shipping_method_id: Number.isFinite(sid) && sid > 0 ? sid : null,
    reason: '',
  };
}
