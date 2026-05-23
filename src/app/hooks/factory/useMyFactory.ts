import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '@/services/api/factoryApi';
import { factoryKeys } from '@/lib/queryKeys';

export function useMyFactory() {
  const query = useQuery({
    queryKey: factoryKeys.me(),
    queryFn: async () => {
      const init = await factoriesApi.getProfileInit();
      const factory = (init?.factory ?? {}) as Record<string, unknown>;
      return {
        ...factory,
        categories: Array.isArray(factory.categories) ? factory.categories : [],
        sub_categories: Array.isArray(factory.sub_categories) ? factory.sub_categories : [],
        certificates: Array.isArray(factory.certificates) ? factory.certificates : [],
      };
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const categoryIds = (query.data?.categories ?? [])
    .map((c) => Number((c as Record<string, unknown>).category_id))
    .filter((n) => Number.isFinite(n) && n > 0);
  const subCategoryIds = (query.data?.sub_categories ?? [])
    .map((s) => Number((s as Record<string, unknown>).sub_category_id))
    .filter((n) => Number.isFinite(n) && n > 0);

  return { ...query, categoryIds, subCategoryIds };
}
