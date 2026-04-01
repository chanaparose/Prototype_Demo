import { categoriesApi, masterApi } from '../services/api';

export type ExploreCategoryItem = {
  id: string;
  name: string;
  parentId?: string | null;
};

/** แม็ป category_id (ฐานข้อมูล) → id ใน bundle/mock (pet_food …) เมื่อ prop ไม่ใช้เลข id */
export const TILE_DB_ID_TO_CONTEXT_ID: Record<string, string> = {
  '1': 'pet_food',
  '2': 'supplements',
  '3': 'pet_toys',
  '4': 'pet_clothes',
  '6': 'other',
};

export function extractCategoriesArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  for (const key of ['data', 'items', 'results', 'categories']) {
    const v = o[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export function categoryIdsMatch(a: string, b: string): boolean {
  const sa = String(a).trim();
  const sb = String(b).trim();
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && sa !== '' && sb !== '') return na === nb;
  return false;
}

export function parseCategoriesResponse(raw: unknown): ExploreCategoryItem[] {
  const rows = extractCategoriesArray(raw);
  const parsed: ExploreCategoryItem[] = [];
  for (const item of rows) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const idRaw =
      o.id ??
      o.category_id ??
      o.categoryId ??
      o.lbi_category_id ??
      o.product_category_id ??
      o.lbi_product_category_id;
    const nameRaw =
      o.name ??
      o.name_th ??
      o.name_en ??
      o.category_name ??
      o.title ??
      o.label;
    const id = idRaw != null ? String(idRaw).trim() : '';
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : String(nameRaw ?? '').trim();
    if (!id || !name) continue;
    const p = o.parent_id ?? o.parentId;
    const parentId = p == null || p === '' ? null : String(p);
    parsed.push({ id, name, parentId });
  }

  const dedupe = new Map<string, ExploreCategoryItem>();
  for (const c of parsed) {
    dedupe.set(String(c.id), c);
  }
  return [...dedupe.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

export function mergeCategoryLists(primary: ExploreCategoryItem[], secondary: ExploreCategoryItem[]): ExploreCategoryItem[] {
  const map = new Map<string, ExploreCategoryItem>();
  for (const c of secondary) map.set(String(c.id), c);
  for (const c of primary) map.set(String(c.id), c);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

export function exploreDisplayNameForTile(
  categoryId: string,
  fallbackName: string,
  fromApi: ExploreCategoryItem[],
  fromProp?: ExploreCategoryItem[],
): string {
  const matchApi = fromApi.find((c) => categoryIdsMatch(c.id, categoryId));
  if (matchApi?.name) return matchApi.name;
  const matchPropDirect = fromProp?.find((c) => categoryIdsMatch(c.id, categoryId));
  if (matchPropDirect?.name) return matchPropDirect.name;
  const contextId = TILE_DB_ID_TO_CONTEXT_ID[categoryId];
  if (contextId) {
    const matchPropSlug = fromProp?.find((c) => c.id === contextId);
    if (matchPropSlug?.name) return matchPropSlug.name;
  }
  return fallbackName;
}

export type FetchExploreCategoriesResult = {
  merged: ExploreCategoryItem[];
  bothFailed: boolean;
  catRejected: boolean;
  masterRejected: boolean;
  firstError: Error | null;
};

/** GET /categories + GET /master/product-categories — ใช้ร่วมกันทั้ง desktop/mobile */
export async function fetchExploreCategoriesMerged(): Promise<FetchExploreCategoriesResult> {
  const [catRes, masterRes] = await Promise.allSettled([
    categoriesApi.list(),
    masterApi.productCategories(),
  ]);

  const fromCat = catRes.status === 'fulfilled' ? parseCategoriesResponse(catRes.value) : [];
  const fromMaster = masterRes.status === 'fulfilled' ? parseCategoriesResponse(masterRes.value) : [];
  const merged = mergeCategoryLists(fromCat, fromMaster);

  if (import.meta.env.DEV) {
    const verbose =
      typeof localStorage !== 'undefined' && localStorage.getItem('VERBOSE_API_LOG') === '1';
    if (verbose) {
      console.debug('[ExploreCategories API] raw', {
        categories: catRes.status === 'fulfilled' ? catRes.value : catRes,
        master: masterRes.status === 'fulfilled' ? masterRes.value : masterRes,
      });
      console.debug('[ExploreCategories API] merged', merged);
    } else {
      console.debug('[ExploreCategories API]', {
        mergedCount: merged.length,
        parsedFromCategories: fromCat.length,
        parsedFromMaster: fromMaster.length,
      });
    }
  }

  const bothFailed = catRes.status === 'rejected' && masterRes.status === 'rejected';
  const firstError =
    catRes.status === 'rejected'
      ? catRes.reason instanceof Error
        ? catRes.reason
        : new Error(String(catRes.reason))
      : masterRes.status === 'rejected'
        ? masterRes.reason instanceof Error
          ? masterRes.reason
          : new Error(String(masterRes.reason))
        : null;

  return {
    merged,
    bothFailed,
    catRejected: catRes.status === 'rejected',
    masterRejected: masterRes.status === 'rejected',
    firstError,
  };
}
