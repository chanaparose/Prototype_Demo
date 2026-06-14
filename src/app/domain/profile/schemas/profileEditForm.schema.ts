import { z } from 'zod';

export const profileEditFormSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().trim().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.string().trim().min(1, 'กรุณากรอกเบอร์โทร'),
  description: z.string(),
  specialization: z.string(),
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
