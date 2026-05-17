import { useQueries } from '@tanstack/react-query';
import { categoriesApi } from '@/services/api';

type Row = Record<string, unknown>;

export interface SubCategoryOption {
  id: number;
  name: string;
  categoryId: number;
}

function toOption(r: Row, categoryIdHint: number): SubCategoryOption | null {
  const id = Number(r.sub_category_id ?? r.id);
  const categoryId = Number(r.category_id ?? r.parent_category_id ?? categoryIdHint);
  const name = String(r.name ?? r.name_th ?? r.sub_category_name ?? '').trim();
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(categoryId) || categoryId <= 0) return null;
  if (!name) return null;
  return { id, name, categoryId };
}

/**
 * Fetch sub-categories for multiple categories in parallel.
 */
export function useSubCategoriesByCategories(categoryIds: number[]) {
  const queries = useQueries({
    queries: categoryIds.map((cid) => ({
      queryKey: ['master', 'sub-categories', cid] as const,
      queryFn: async (): Promise<SubCategoryOption[]> => {
        const raw = await categoriesApi.subCategories(cid);
        const arr = (Array.isArray(raw) ? raw : []) as Row[];
        return arr
          .map((r) => toOption(r, cid))
          .filter((x): x is SubCategoryOption => x != null)
          .sort((a, b) => a.name.localeCompare(b.name, 'th'));
      },
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
    })),
  });

  const byCategory = new Map<number, SubCategoryOption[]>();
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  queries.forEach((q, idx) => {
    if (!q.data) return;
    const cid = categoryIds[idx];
    const raw = (Array.isArray(q.data) ? q.data : []) as unknown[];
    const normalized = raw
      .map((r) => toOption((r ?? {}) as Row, cid))
      .filter((x): x is SubCategoryOption => x != null);
    const uniq = new Map<number, SubCategoryOption>();
    for (const item of normalized) {
      if (!uniq.has(item.id)) uniq.set(item.id, item);
    }
    byCategory.set(
      cid,
      [...uniq.values()].sort((a, b) => a.name.localeCompare(b.name, 'th')),
    );
  });

  const flat: SubCategoryOption[] = [];
  for (const list of byCategory.values()) flat.push(...list);

  return { byCategory, flat, isLoading, isError };
}
