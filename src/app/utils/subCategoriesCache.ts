import { categoriesApi } from '@/services/api';

export type SubCategoryRow = { id: string; name: string; sortOrder: number };

const INACTIVE_STATUS = new Set(['0', 'I', 'IN', 'X', 'DR', 'DL', 'INACTIVE']);

export function mapSubCategoryRows(raw: unknown): SubCategoryRow[] {
  const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
  return arr
    .filter((r) => {
      const s = r.status == null ? '' : String(r.status).trim().toUpperCase();
      return !INACTIVE_STATUS.has(s);
    })
    .map((r) => ({
      id: String(r.sub_category_id ?? r.id ?? ''),
      name: String(r.name ?? ''),
      sortOrder: Number(r.sort_order ?? 0),
    }))
    .filter((r) => r.id && r.name)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

const resolved = new Map<string, SubCategoryRow[]>();
/** In-flight promises (dedupe concurrent requests) */
const pending = new Map<string, Promise<SubCategoryRow[]>>();

export function loadSubCategories(categoryId: string | number): Promise<SubCategoryRow[]> {
  const key = String(categoryId);
  if (key === '' || key === 'all') return Promise.resolve([]);

  const done = resolved.get(key);
  if (done) return Promise.resolve(done);

  const inflight = pending.get(key);
  if (inflight) return inflight;

  const p = categoriesApi
    .subCategories(key)
    .then((raw) => {
      const mapped = mapSubCategoryRows(raw);
      resolved.set(key, mapped);
      pending.delete(key);
      return mapped;
    })
    .catch((err) => {
      console.error('[sub-categories] fetch failed for category', key, err);
      pending.delete(key);
      return [] as SubCategoryRow[];
    });

  pending.set(key, p);
  return p;
}

export function prefetchSubCategoriesFor(categoryIds: ReadonlyArray<string | number>): void {
  for (const id of categoryIds) {
    void loadSubCategories(id);
  }
}

/** Synchronous peek — returns resolved data if ready, else null. */
export function getCachedSubCategoriesSync(categoryId: string | number): SubCategoryRow[] | null {
  return resolved.get(String(categoryId)) ?? null;
}

/** Testing / hot-reload helper — drops every cache. */
export function clearSubCategoriesCache(): void {
  resolved.clear();
  pending.clear();
}
