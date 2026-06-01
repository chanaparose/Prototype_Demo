import {
  CUSTOMER_AVATAR_SEEDS,
  buildCustomerAvatarUrl,
} from '@/constants/customerAvatars';

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Avatar ลูกค้าจากชุด 10 รูป — user คนเดิมได้รูปเดิมเสมอ */
export function getCustomerAvatarUrl(
  userKey?: string | number | null,
  size = 128,
): string {
  const key =
    userKey != null && String(userKey).trim() !== '' ? String(userKey).trim() : 'guest';
  const seed = CUSTOMER_AVATAR_SEEDS[hashKey(key) % CUSTOMER_AVATAR_SEEDS.length];
  return buildCustomerAvatarUrl(seed, size);
}

export function resolveCustomerAvatarSrc(
  userKey?: string | number | null,
  size?: number,
): string {
  return getCustomerAvatarUrl(userKey, size);
}
