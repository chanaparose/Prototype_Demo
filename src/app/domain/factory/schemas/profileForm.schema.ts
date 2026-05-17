import { z } from 'zod';

export const profileFormSchema = z.object({
  image_url: z.string(),
  cover_image_url: z.string(),
  factory_name: z.string().trim().min(1, 'กรุณากรอกชื่อโรงงาน'),
  tax_id: z.string(),
  description: z.string(),
  factory_type_id: z.number().int().positive().nullable(),
  category_ids: z.array(z.number().int().positive()),
  sub_category_ids: z.array(z.number().int().positive()),
  min_order: z.number().int().positive().nullable(),
  lead_time_desc: z.string(),
});

export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormSchemaValues = z.output<typeof profileFormSchema>;
