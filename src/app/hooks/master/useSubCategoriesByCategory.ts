import { useQueries } from '@tanstack/react-query';
import { masterKeys } from '@/lib/queryKeys';
import { categoriesApi } from '@/services/api/masterApi';
import {
  sortSubCategories,
  type SubCategoryOption,
} from '@/components/factory/profile/subCategoryPicker.utils';

type Row = Record<string, unknown>;

function toOption(r: Row, categoryIdHint: number): SubCategoryOption | null {
  const id = Number(r.sub_category_id ?? r.id);
  const categoryId = Number(r.category_id ?? r.parent_category_id ?? categoryIdHint);
  const name = String(r.name ?? r.name_th ?? r.sub_category_name ?? '').trim();
  const sortOrderRaw = Number(r.sort_order ?? r.sortOrder ?? 0);
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(categoryId) || categoryId <= 0) return null;
  if (!name) return null;
  return { id, name, categoryId, sortOrder: Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0 };
}

export function useSubCategoriesByCategories(categoryIds: number[]) {
  const queries = useQueries({
    queries: categoryIds.map((cid) => ({
      queryKey: masterKeys.subCategories(cid) as const,
      queryFn: async (): Promise<SubCategoryOption[]> => {
        const raw = await categoriesApi.subCategories(cid);
        const arr = (Array.isArray(raw) ? raw : []) as Row[];
        return arr
          .map((r) => toOption(r, cid))
          .filter((x): x is SubCategoryOption => x != null)
          .sort(sortSubCategories);
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
    byCategory.set(cid, [...uniq.values()].sort(sortSubCategories));
  });

  const flat: SubCategoryOption[] = [];
  for (const list of byCategory.values()) flat.push(...list);

  return { byCategory, flat, isLoading, isError };
}

export type { SubCategoryOption };
