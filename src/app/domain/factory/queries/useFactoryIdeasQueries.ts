import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '@/services/api/factoryApi';
import { categoriesApi } from '@/services/api/masterApi';
import { showcasesPaginatedApi } from '@/services/api/exploreApi';
import { type Factory, type FactoryShowcase } from '@/stores/types';
import { factoryIdeasKeys } from '@/lib/queryKeys';
import { pickScalarString } from '@/utils/pickScalarString';
import { normalizeFactoryIdeaFactory } from '@/components/features/factory-ideas/factoryIdeasTheme';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';

export type SubCategoryRow = { id: string; name: string; sortOrder: number };
export type FactoryIdeasCategoryRow = {
  id: string;
  name: string;
  scope: string;
  hubId?: number;
  subCategories: SubCategoryRow[];
};

// Single query — always fetch ALL categories with subs once; hub/scope filtering is client-side.
export function useFactoryIdeasCategoriesQuery() {
  return useQuery({
    queryKey: factoryIdeasKeys.categories('all'),
    queryFn: async (): Promise<FactoryIdeasCategoryRow[]> => {
      const raw = await categoriesApi.listWithSubs('ALL');
      return raw
        .map((c) => ({
          id: String(c.category_id),
          name: c.name,
          scope: c.scope ?? '',
          hubId: c.hub_id ? Number(c.hub_id) : undefined,
          subCategories: (c.sub_categories ?? [])
            .map((s) => ({
              id: String(s.sub_category_id ?? s.id ?? ''),
              name: String(s.name ?? ''),
              sortOrder: Number(s.sort_order ?? 0),
            }))
            // sort_order 99 = sentinel "ทั้งหมด" — hide from browse / filter UIs
            .filter((s) => s.id && s.name && s.sortOrder !== 99)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }))
        .filter((r) => r.name);
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useFactoryIdeasFactoryListQuery(enabled: boolean, scope?: 'PD' | 'MT', hubId?: number) {
  return useQuery({
    queryKey: hubId ? [...factoryIdeasKeys.factoryList(scope), 'hub', hubId] : factoryIdeasKeys.factoryList(scope),
    queryFn: async () => {
      const raw = await factoriesApi.list(scope, hubId);
      const r = raw as unknown;
      const arr = (
        Array.isArray(r)
          ? r
          : Array.isArray((r as Record<string, unknown>)?.factories)
            ? (r as Record<string, unknown>).factories
            : Array.isArray((r as Record<string, unknown>)?.data)
              ? (r as Record<string, unknown>).data
              : []
      ) as Record<string, unknown>[];
      return arr
        .map((row) => normalizeFactoryIdeaFactory(row))
        .filter((f) => f.id && f.name) as Factory[];
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export type ShowcasePaginatedParams = {
  types: ('PD' | 'PM' | 'ID' | 'MT')[];
  page: number;
  limit: number;
  categoryId?: string;
  subCategoryId?: string;
  hubId?: number;
  keyword?: string;
};

export type ShowcasePaginatedResult = {
  total: number;
  page: number;
  limit: number;
  items: FactoryShowcase[];
};

export function useFactoryIdeasShowcasesPaginatedQuery(
  params: ShowcasePaginatedParams,
  enabled = true,
) {
  return useQuery<ShowcasePaginatedResult>({
    queryKey: factoryIdeasKeys.showcasesPaginated(params as unknown as Record<string, unknown>),
    queryFn: async () => {
      const raw = await showcasesPaginatedApi.list({
        types: params.types,
        page: params.page,
        limit: params.limit,
        categoryId: params.categoryId || undefined,
        subCategoryId: params.subCategoryId || undefined,
        hubId: params.hubId || undefined,
        keyword: params.keyword || undefined,
      });
      return {
        total: raw.total,
        page: raw.page,
        limit: raw.limit,
        items: (raw.items ?? [])
          .map((r) => mapShowcaseFromApi(r as unknown as Record<string, unknown>))
          .filter((s): s is FactoryShowcase => Boolean(s.id && s.title)),
      };
    },
    enabled: enabled && params.types.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
