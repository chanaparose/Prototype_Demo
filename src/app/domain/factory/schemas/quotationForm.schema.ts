import { z } from 'zod';

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0), {
    message: 'กรุณากรอกตัวเลขที่ถูกต้อง',
  });

const requiredPositive = z
  .string()
  .trim()
  .min(1, 'กรุณากรอกข้อมูล')
  .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
    message: 'กรุณากรอกตัวเลขมากกว่า 0',
  });

const requiredPositiveInt = z
  .string()
  .trim()
  .min(1, 'กรุณากรอกข้อมูล')
  .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
    message: 'กรุณากรอกจำนวนวันที่ถูกต้อง',
  });

export const quotationFormSchema = z.object({
  price_per_piece: requiredPositive,
  tooling_mold_cost: optionalMoney,
  shipping_cost: optionalMoney,
  packaging_cost: optionalMoney,
  lead_time_days: requiredPositiveInt,
  validity_days: z
    .string()
    .trim()
    .min(1, 'กรุณากรอกวันหมดอายุใบเสนอราคา')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
      message: 'กรุณากรอกจำนวนวันที่ถูกต้อง',
    }),
});

export type QuotationFormSchemaValues = z.infer<typeof quotationFormSchema>;
