import { categoryIdsMatch } from './exploreCategoriesFromApi';

/**
 * เชื่อมการ์ดหมวดบน Explore กับการกรองหน้า factory-ideas (item.category ใน showcase)
 */
export const EXPLORE_CARD_LABEL_TO_SHOWCASE_CATEGORY: Record<string, string> = {
  ของเล่น: 'ของเล่นสัตว์เลี้ยง',
  อาหารสัตว์เลี้ยง: 'อาหารสัตว์',
  ขนมสัตว์เลี้ยง: 'ขนมสัตว์เลี้ยง',
  อาหารเสริม: 'อาหารเสริม',
  เสื้อผ้า: 'เสื้อผ้าสัตว์เลี้ยง',
  แพ็คเกจจิ้ง: 'แพ็คเกจจิ้ง',
};

/** category_id บน Explore (ฐานข้อมูล) → ค่า factoryShowcase.category ใน mock/bundle */
export const EXPLORE_TILE_CATEGORY_ID_TO_SHOWCASE_CATEGORY: Record<string, string> = {
  '1': 'อาหารสัตว์',
  '2': 'อาหารเสริม',
  '3': 'ของเล่นสัตว์เลี้ยง',
  '4': 'เสื้อผ้าสัตว์เลี้ยง',
  '6': 'แพ็กเกจจิ้ง',
  '11': 'ขนมสัตว์เลี้ยง',
};

type CategoryLike = { id: string; name: string };

/** เปรียบเทียบหมวดที่เลือก (id) กับตัวเลือกใน dropdown */
export function factoryIdeasCategoryOptionSelected(selectedId: string, optionId: string): boolean {
  if (optionId === 'all') return selectedId === 'all';
  if (selectedId === 'all') return false;
  return categoryIdsMatch(selectedId, optionId);
}

/**
 * กรอง showcase ตามหมวดที่เลือก — state ใช้ category id (เช่น จาก ?category_id= หลัง Explore)
 */
export function showcaseMatchesSelectedCategoryId(
  itemCategory: string,
  selectedId: string,
  masterCategories: CategoryLike[],
  contextCategories: CategoryLike[],
): boolean {
  if (selectedId === 'all') return true;
  const primary = masterCategories.length > 0 ? masterCategories : contextCategories;
  const row = primary.find((c) => categoryIdsMatch(c.id, selectedId));
  if (row) return itemCategory === row.name;
  const secondary = masterCategories.length > 0 ? contextCategories : [];
  const rowCtx = secondary.find((c) => categoryIdsMatch(c.id, selectedId));
  if (rowCtx) return itemCategory === rowCtx.name;
  const byName = [...primary, ...secondary].find((c) => c.name === selectedId);
  if (byName) return itemCategory === byName.name;
  const fromTile = EXPLORE_TILE_CATEGORY_ID_TO_SHOWCASE_CATEGORY[selectedId.trim()];
  if (fromTile != null) return itemCategory === fromTile;
  return itemCategory === selectedId;
}

/** ข้อความบนปุ่ม dropdown / หัวข้อ — อ่านได้แม้ id ยังไม่อยู่ในรายการจาก API */
export function factoryIdeasSelectedCategoryLabel(
  selectedId: string,
  categoryOptions: { id: string; name: string }[],
): string {
  if (selectedId === 'all') return 'ทุกหมวดหมู่';
  const row = categoryOptions.find((c) => factoryIdeasCategoryOptionSelected(selectedId, c.id));
  if (row) return row.name;
  return EXPLORE_TILE_CATEGORY_ID_TO_SHOWCASE_CATEGORY[selectedId.trim()] ?? selectedId;
}

/**
 * ลิงก์ไป factory-ideas พร้อม categoryId จาก context ถ้าหาได้ ไม่เช่นนั้นใช้ query category=ชื่อที่ใช้กรอง showcase
 */
export function buildFactoryIdeasCategoryHref(
  exploreCardLabel: string,
  categories: CategoryLike[],
): string {
  const showcaseName =
    EXPLORE_CARD_LABEL_TO_SHOWCASE_CATEGORY[exploreCardLabel] ?? exploreCardLabel;
  const byName = categories.find(
    (c) => c.name === showcaseName || c.name === exploreCardLabel,
  );
  if (byName) {
    return `/factory-ideas?category_id=${encodeURIComponent(byName.id)}`;
  }
  return `/factory-ideas?category=${encodeURIComponent(showcaseName)}`;
}

/** แปลงผล GET /master/product-categories → { id, name }[] */
export function parseMasterProductCategories(raw: unknown): { id: string; name: string }[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: { id: string; name: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const nameRaw = o.name ?? o.name_th ?? o.category_name ?? o.label;
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : String(nameRaw ?? '').trim();
    if (!name) continue;
    const idRaw = o.id ?? o.category_id;
    const id = String(idRaw ?? name);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'th'));
}
