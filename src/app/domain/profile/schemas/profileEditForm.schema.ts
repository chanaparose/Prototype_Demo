import { z } from 'zod';

export const profileEditFormSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().trim().min(1, 'กรุณากรอกเบอร์โทร'),
  bio: z.string().max(300, 'บันทึกย่อไม่เกิน 300 ตัวอักษร'),
  address_line1: z.string(),
  sub_district: z.string(),
  district: z.string(),
  province: z.string(),
  postal_code: z.string(),
  description: z.string(),
  specialization: z.string(),
  min_order: z.string(),
  lead_time_desc: z.string(),
  price_range: z.string(),
});

export type ProfileEditFormValues = z.infer<typeof profileEditFormSchema>;

export function validateProfileEditForRole(
  values: ProfileEditFormValues,
  role: string,
): string | null {
  if (role.toUpperCase() === 'CT') {
    if (!values.first_name.trim() || !values.last_name.trim()) {
      return 'กรุณากรอกชื่อและนามสกุล';
    }
  }
  return null;
}
