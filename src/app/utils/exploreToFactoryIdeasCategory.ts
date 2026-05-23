import { categoryIdsMatch, TILE_DB_ID_TO_CONTEXT_ID } from '@/utils/exploreCategoriesFromApi';

// เทียบ id หมวดจาก API (ตัวเลข / string) กับค่าใน URL หรือ dropdown รวมแม็ป DB id ↔ context id
function categoryIdsEquivalent(a: string, b: string): boolean {
  const sa = a.trim();
  const sb = b.trim();
  if (categoryIdsMatch(sa, sb)) return true;
  const ctxA = TILE_DB_ID_TO_CONTEXT_ID[sa];
  if (ctxA && categoryIdsMatch(ctxA, sb)) return true;
  const ctxB = TILE_DB_ID_TO_CONTEXT_ID[sb];
  if (ctxB && categoryIdsMatch(sa, ctxB)) return true;
  if (ctxA && ctxB && categoryIdsMatch(ctxA, ctxB)) return true;
  return false;
}

export const EXPLORE_TILE_CATEGORY_ID_TO_SHOWCASE_CATEGORY: Record<string, string> = {
  '1': 'อาหารสัตว์',
  '2': 'อาหารเสริม',
  '3': 'ของเล่นสัตว์เลี้ยง',
  '4': 'เสื้อผ้าสัตว์เลี้ยง',
  '6': 'แพ็กเกจจิ้ง',
  '11': 'ขนมสัตว์เลี้ยง',
};

type CategoryLike = { id: string; name: string };

export function factoryIdeasCategoryOptionSelected(selectedId: string, optionId: string): boolean {
  if (optionId === 'all') return selectedId === 'all';
  if (selectedId === 'all') return false;
  return categoryIdsMatch(selectedId, optionId);
}

// กรอง showcase ตามหมวดที่เลือก — state ใช้ category id (เช่น จาก ?category_id= หลัง Explore)
// ถ้ามี `itemCategoryId` จาก API (`category_id`) จะเทียบกับ `selectedId` ก่อน แล้วค่อย fallback ชื่อหมวด
export function showcaseMatchesSelectedCategoryId(
  itemCategory: string,
  selectedId: string,
  masterCategories: CategoryLike[],
  contextCategories: CategoryLike[],
  itemCategoryId?: string,
): boolean {
  if (selectedId === 'all') return true;
  const cid = itemCategoryId?.trim();
  if (cid && categoryIdsEquivalent(cid, selectedId)) return true;

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
