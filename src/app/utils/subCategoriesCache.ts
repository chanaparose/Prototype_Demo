/**
 * Sub-categories prefetch + module-level cache.
 *
 * ─────────────────────────────────────────────────────────────────
 *  Why a module-level cache (and not a `useRef` per component)?
 *  1. Survives navigation (Explore → FactoryIdeas doesn't refetch)
 *  2. Shared across mobile + desktop instances
 *  3. Lets us prefetch ALL categories' subs in parallel once
 *     `/categories` resolves — subsequent clicks are instant.
 *
 *  BE returns `status: '1'` for active rows (per schema
 *  `lbi_sub_categories`), NOT `'A'`. We treat "anything that is
 *  not explicitly inactive" as active to be resilient to either
 *  convention.
 * ─────────────────────────────────────────────────────────────────
 */

import { categoriesApi } from '../services/api';

export type SubCategoryRow = { id: string; name: string; sortOrder: number };

/** Status codes that should hide a row. Everything else → visible. */
const INACTIVE_STATUS = new Set(['0', 'I', 'IN', 'X', 'DR', 'DL', 'INACTIVE']);

/** Normalize raw rows from `GET /categories/:id/sub-categories` → UI shape */
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

// ─── Module-level caches ─────────────────────────────────────────
/** Resolved rows (final state, synchronous lookup) */
const resolved = new Map<string, SubCategoryRow[]>();
/** In-flight promises (dedupe concurrent requests) */
const pending = new Map<string, Promise<SubCategoryRow[]>>();

/**
 * Fetch (or reuse) sub-categories for a single category.
 *
 * - Cache hit → returns resolved data (instant).
 * - In-flight → returns the same Promise (no duplicate request).
 * - Cold → sends GET, caches result, returns Promise.
 */
export function loadSubCategories(
  categoryId: string | number,
): Promise<SubCategoryRow[]> {
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

/** Fire-and-forget prefetch for many categories in parallel. */
export function prefetchSubCategoriesFor(
  categoryIds: ReadonlyArray<string | number>,
): void {
  for (const id of categoryIds) {
    void loadSubCategories(id);
  }
}

/** Synchronous peek — returns resolved data if ready, else null. */
export function getCachedSubCategoriesSync(
  categoryId: string | number,
): SubCategoryRow[] | null {
  return resolved.get(String(categoryId)) ?? null;
}

/** Testing / hot-reload helper — drops every cache. */
export function clearSubCategoriesCache(): void {
  resolved.clear();
  pending.clear();
}
