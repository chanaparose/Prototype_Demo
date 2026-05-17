import { z } from 'zod';

export const rejectReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร')
    .max(1000, 'เหตุผลยาวเกินไป'),
});

export type RejectReasonFormValues = z.infer<typeof rejectReasonSchema>;
