const CATEGORY_ICON_MAP: Record<string, string> = {
  อาหารสัตว์: '🐾',
  อาหารเม็ดสัตว์: '🐾',
  อาหารเสริม: '💊',
  ของเล่นสัตว์เลี้ยง: '🎾',
  เสื้อผ้าสัตว์เลี้ยง: '👕',
  'เสื้อผ้า/สิ่งทอ': '👕',
  อุปกรณ์สัตว์เลี้ยง: '🦮',
  'สายจูง อุปกรณ์': '🦮',
  บรรจุภัณฑ์: '📦',
  แพ็กเกจจิ้ง: '📦',
  เครื่องสำอาง: '✨',
  อุปกรณ์อาบน้ำ: '🧴',
  เฟอร์นิเจอร์: '🏠',
  ที่นอนและบ้าน: '🏠',
  พลาสติก: '🔩',
  ขนมสัตว์เลี้ยง: '🍖',
  ตู้ปลาและกรง: '🐟',
  กระเป๋าและรถเข็น: '🧳',
  ห้องน้ำและทราย: '🚿',
};

export function guessCategoryIcon(catName: string): string {
  const name = String(catName ?? '').trim();
  if (!name) return '📋';
  if (CATEGORY_ICON_MAP[name]) return CATEGORY_ICON_MAP[name];
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (name.includes(key) || key.includes(name)) return icon;
  }
  return '📋';
}
