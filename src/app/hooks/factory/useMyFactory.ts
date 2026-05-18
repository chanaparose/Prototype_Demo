import { useQuery } from '@tanstack/react-query';
import { factoriesApi } from '@/services/api/factoryApi';

export function useMyFactory() {
  const query = useQuery({
    queryKey: ['factory', 'me'] as const,
    queryFn: () => factoriesApi.getMe(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const categoryIds = (query.data?.categories ?? []).map((c) => c.category_id);
  const subCategoryIds = (query.data?.sub_categories ?? []).map((s) => s.sub_category_id);

  return { ...query, categoryIds, subCategoryIds };
}
