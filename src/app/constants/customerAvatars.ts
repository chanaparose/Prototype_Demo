/**
 * Avatar ลูกค้า — สร้างจาก DiceBear (ฟรี, ไม่ต้องอัปโหลดรูป)
 *
 * สไตล์ที่น่ารักกว่า avataaars (เปลี่ยน CUSTOMER_AVATAR_STYLE ได้):
 * - lorelei      — การ์ตูนนุ่มๆ สีพาสเทล (ค่าเริ่มต้น)
 * - fun-emoji    — หน้า emoji น่ารักมาก
 * - big-smile    — ตัวการ์ตูนยิ้มกว้าง
 * - croodles     — เส้นสเก็ตช์มือวาด ขี้เล่น
 * - micah        — มินิมอล น่ารัก
 * - adventurer   — ตัวละครผจญภัย (เหมาะแอปสัตว์เลี้ยง)
 *
 * ทางเลือกนอก DiceBear: Multiavatar — https://api.multiavatar.com/{seed}.png
 */
export const CUSTOMER_AVATAR_STYLE = 'lorelei' as const;

/** 10 ชุด seed — แต่ละ user ได้ 1 รูปคงที่จาก hash ของ user id */
export const CUSTOMER_AVATAR_SEEDS = [
  'mochi',
  'boba',
  'luna',
  'sunny',
  'peach',
  'coco',
  'milo',
  'nori',
  'pip',
  'zuzu',
] as const;

/** พื้นหลังพาสเทล — ผูกกับ seed ให้แต่ละ avatar มีโทนสีต่างกัน */
const AVATAR_BACKGROUNDS = [
  'ffd5dc',
  'ffdfbf',
  'fff5ba',
  'd1f4d1',
  'c9e7ff',
  'e8d5ff',
  'ffe0f0',
  'd4f5f5',
  'ffe8cc',
  'e2e8ff',
] as const;

export function buildCustomerAvatarUrl(seed: string, size = 128): string {
  const seedIndex = CUSTOMER_AVATAR_SEEDS.indexOf(seed as (typeof CUSTOMER_AVATAR_SEEDS)[number]);
  const bg =
    seedIndex >= 0
      ? AVATAR_BACKGROUNDS[seedIndex]
      : AVATAR_BACKGROUNDS[Math.abs(hashSeed(seed)) % AVATAR_BACKGROUNDS.length];

  const params = new URLSearchParams({
    seed,
    size: String(size),
    backgroundColor: bg,
  });

  return `https://api.dicebear.com/9.x/${CUSTOMER_AVATAR_STYLE}/png?${params.toString()}`;
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}
