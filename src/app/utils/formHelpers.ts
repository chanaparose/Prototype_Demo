const INPUT_BASE =
  'w-full px-4 py-2.5 md:py-3 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-shadow bg-gray-50/50 focus:bg-white';
const INPUT_NORMAL = 'border-gray-200 focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple';
const INPUT_ERROR = 'border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500';

export const inputStyles = {
  base: INPUT_BASE,
  normal: INPUT_NORMAL,
  error: INPUT_ERROR,
};

export function getInputClass(error?: string): string {
  return `${INPUT_BASE} ${error ? INPUT_ERROR : INPUT_NORMAL}`;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'กรุณากรอกอีเมล';
  if (!EMAIL_REGEX.test(email)) return 'อีเมลไม่ถูกต้อง';
  return null;
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `กรุณากรอก${fieldName}`;
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'กรุณากรอกรหัสผ่าน';
  if (password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  return null;
}

export function validateMatch(value1: string, value2: string, fieldName: string): string | null {
  if (value1 !== value2) return `${fieldName}ไม่ตรงกัน`;
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (value.length < min) return `${fieldName}ต้องมีอย่างน้อย ${min} ตัวอักษร`;
  return null;
}

export function validateMaxLength(value: string, max: number, fieldName: string): string | null {
  if (value.length > max) return `${fieldName}ต้องมีไม่เกิน ${max} ตัวอักษร`;
  return null;
}
