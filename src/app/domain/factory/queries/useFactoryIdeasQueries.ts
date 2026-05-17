import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '@/services/api/factoryApi';
import { masterApi } from '@/services/api/masterApi';
import { type Factory } from '@/stores/types';
import { factoryIdeasKeys } from '@/lib/queryKeys';
import { fetchExploreCategoriesMerged } from '@/utils/exploreCategoriesFromApi';
import {
  parseMasterProductCategories,
} from '@/utils/exploreToFactoryIdeasCategory';
import { logFactoryIdeasCategory } from '@/utils/debugFactoryIdeasCategory';
import {
  getCachedSubCategoriesSync,
  loadSubCategories,
  prefetchSubCategoriesFor,
  type SubCategoryRow,
} from '@/utils/subCategoriesCache';
import { normalizeFactoryIdeaFactory } from '@/components/features/factory-ideas/factoryIdeasTheme';

export type FactoryIdeasCategoryRow = { id: string; name: string };

export function useFactoryIdeasCategoriesQuery(materialTab: boolean) {
  return useQuery({
    queryKey: factoryIdeasKeys.categories(materialTab),
    queryFn: async (): Promise<FactoryIdeasCategoryRow[]> => {
      if (materialTab) {
        const raw = (await masterApi.lbiCategories('MT')) as unknown as Record<string, unknown>;
        const arr = (Array.isArray(raw.categories) ? raw.categories : []) as Record<
          string,
          unknown
        >[];
        return arr
          .map((c) => ({ id: String(c.category_id ?? c.id ?? ''), name: String(c.name ?? '') }))
          .filter((r) => r.id && r.name);
      }

      const res = await fetchExploreCategoriesMerged();
      let rows = res.merged.map((c) => ({ id: String(c.id), name: c.name }));
      let categorySource: 'exploreMerged' | 'masterProductCategories' | 'empty' = 'exploreMerged';
      if (rows.length === 0) {
        categorySource = 'empty';
        try {
          const rawPD = await masterApi.productCategories();
          rows = parseMasterProductCategories(rawPD);
          categorySource = rows.length > 0 ? 'masterProductCategories' : 'empty';
        } catch {
          /* keep [] */
        }
      }
      prefetchSubCategoriesFor(rows.map((r) => r.id));
      logFactoryIdeasCategory('categoryMenu.apiCategoriesAll', {
        source: categorySource,
        exploreMergedCount: res.merged.length,
        rowCount: rows.length,
        rows,
      });
      return rows;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useFactoryIdeasFactoryListQuery(enabled: boolean) {
  return useQuery({
    queryKey: factoryIdeasKeys.factoryList(),
    queryFn: async () => {
      const raw = await factoriesApi.list();
      const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      return arr.map(normalizeFactoryIdeaFactory).filter((f) => f.id && f.name) as Factory[];
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useFactoryIdeasSubCategoriesQuery(
  categoryId: string | null,
  options?: { enabled?: boolean; logContext?: 'panelSubs' | 'selected' },
) {
  const enabled = Boolean(categoryId) && (options?.enabled !== false);

  return useQuery({
    queryKey: [...factoryIdeasKeys.all, 'sub-categories', categoryId ?? ''] as const,
    queryFn: async (): Promise<SubCategoryRow[]> => {
      if (!categoryId) return [];
      const cached = getCachedSubCategoriesSync(categoryId);
      if (cached) {
        if (options?.logContext === 'panelSubs') {
          logFactoryIdeasCategory('panelSubs.cacheHit', {
            menuHighlightCategoryId: categoryId,
            panelSubs: cached,
          });
        }
        return cached;
      }
      if (options?.logContext === 'panelSubs') {
        logFactoryIdeasCategory('panelSubs.request', {
          endpoint: `GET sub-categories (category_id=${categoryId})`,
          menuHighlightCategoryId: categoryId,
        });
      }
      const mapped = await loadSubCategories(categoryId);
      if (options?.logContext === 'panelSubs') {
        logFactoryIdeasCategory('panelSubs.apiResponse', {
          menuHighlightCategoryId: categoryId,
          mappedLength: mapped.length,
          mapped,
        });
      }
      return mapped;
    },
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
