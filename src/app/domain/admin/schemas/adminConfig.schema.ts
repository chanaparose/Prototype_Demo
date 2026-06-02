import { z } from 'zod';

export const adminGeneralConfigSchema = z.object({
  platform_name: z.string().trim().min(1, 'กรุณากรอกชื่อแพลตฟอร์ม'),
  contact_email: z.string().trim().email('รูปแบบอีเมลไม่ถูกต้อง'),
  support_phone: z.string().trim().min(1, 'กรุณากรอกเบอร์โทร'),
  rfq_expired: z
    .string()
    .trim()
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) > 0), 'ต้องเป็นจำนวนเต็มบวก'),
  shipping_days: z
    .string()
    .trim()
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) > 0), 'ต้องเป็นจำนวนเต็มบวก'),
});

export type AdminGeneralConfigFormValues = z.infer<typeof adminGeneralConfigSchema>;

// label is locked to 'default_comm' and not editable — only commission & vat are user-controlled
export const adminDefaultCommissionSchema = z.object({
  commission: z
    .string()
    .trim()
    .min(1, 'กรุณากรอกอัตราค่าคอม')
    .refine((v) => Number.isFinite(Number(v)), 'อัตราค่าคอมไม่ถูกต้อง'),
  vat: z
    .string()
    .trim()
    .min(1, 'กรุณากรอก VAT')
    .refine((v) => Number.isFinite(Number(v)), 'อัตรา VAT ไม่ถูกต้อง'),
});

export type AdminDefaultCommissionFormValues = z.infer<typeof adminDefaultCommissionSchema>;

export const adminNewConfigSchema = z.object({
  label: z.string().trim().min(1, 'กรุณากรอกชื่อ config'),
  default_commission_rate: z
    .string()
    .trim()
    .min(1, 'กรุณากรอกอัตราค่าคอม')
    .refine((v) => Number.isFinite(Number(v)), 'อัตราค่าคอมไม่ถูกต้อง'),
  vat_rate: z.string().trim().min(1, 'กรุณากรอก VAT'),
  effective_to: z.string(),
});

export type AdminNewConfigFormValues = z.infer<typeof adminNewConfigSchema>;
