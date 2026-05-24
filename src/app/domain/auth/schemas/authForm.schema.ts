import { z } from 'zod';

const emailField = z.string().trim().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง');

const passwordField = z.string().trim().min(1, 'กรุณากรอกรหัสผ่าน');

export const authLoginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type AuthLoginFormValues = z.infer<typeof authLoginSchema>;

export const authRegisterSchema = z.object({
  first_name: z.string().trim().min(1, 'กรุณากรอกชื่อ'),
  last_name: z.string().trim().min(1, 'กรุณากรอกนามสกุล'),
  email: emailField,
  phone: z.string().trim().min(9, 'กรุณากรอกเบอร์โทรศัพท์').max(15, 'เบอร์โทรศัพท์ไม่ถูกต้อง'),
  password: z.string().trim().min(8, 'รหัสผ่านอย่างน้อย 8 ตัวอักษร'),
});

export type AuthRegisterFormValues = z.infer<typeof authRegisterSchema>;

export const authChangePasswordSchema = z
  .object({
    current_password: z.string().trim().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    new_password: z.string().trim().min(8, 'รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร'),
    confirm_password: z.string().trim().min(1, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'รหัสผ่านใหม่ไม่ตรงกัน',
    path: ['confirm_password'],
  });

export type AuthChangePasswordFormValues = z.infer<typeof authChangePasswordSchema>;
