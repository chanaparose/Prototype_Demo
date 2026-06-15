/**
 * Avatar fallback — สร้างเป็น SVG ในเครื่องเพื่อไม่พึ่ง cert/service ภายนอก
 */
export const CUSTOMER_AVATAR_STYLE = 'beam' as const;

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

const AVATAR_COLORS = ['8B5CF6', 'A855F7', 'C084FC', 'F3E8FF', '6D28D9'] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function buildCustomerAvatarUrl(seed: string, size = 128): string {
  const hash = hashSeed(seed);
  const primary = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const secondary = AVATAR_COLORS[(hash >> 3) % AVATAR_COLORS.length];
  const accent = AVATAR_COLORS[(hash >> 6) % AVATAR_COLORS.length];
  const rotate = hash % 360;
  const eyeOffset = 10 + (hash % 4);
  const mouthWidth = 15 + (hash % 7);
  const cheekY = 38 + (hash % 5);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 96 96" fill="none">
    <rect width="96" height="96" rx="28" fill="#F3E8FF"/>
    <g transform="rotate(${rotate} 48 48)" opacity="0.34">
      <circle cx="18" cy="22" r="18" fill="#${secondary}"/>
      <circle cx="80" cy="72" r="22" fill="#${accent}"/>
    </g>
    <circle cx="48" cy="48" r="30" fill="#${primary}"/>
    <circle cx="${48 - eyeOffset}" cy="42" r="4" fill="#FFFFFF"/>
    <circle cx="${48 + eyeOffset}" cy="42" r="4" fill="#FFFFFF"/>
    <path d="M${48 - mouthWidth / 2} 58c5 6 18 6 ${mouthWidth} 0" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
    <circle cx="30" cy="${cheekY}" r="5" fill="#FFFFFF" opacity="0.22"/>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
