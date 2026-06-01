import { HARDCODED_CUSTOMER_PROFILE_SRC } from '@/constants/customerProfile';

/** รวม avatar จาก bootstrap store / auth user ก่อน fallback เป็นรูป default */
export function resolveCustomerAvatarSrc(
  ...candidates: Array<string | null | undefined>
): string {
  for (const value of candidates) {
    const trimmed = value != null ? String(value).trim() : '';
    if (trimmed) return trimmed;
  }
  return HARDCODED_CUSTOMER_PROFILE_SRC;
}
