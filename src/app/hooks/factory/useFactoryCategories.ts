import { useQuery } from '@tanstack/react-query';
import { apiListAsRecords } from '@/lib/apiShape';
import { factoriesApi } from '@/services/api/factoryApi';
import { factoryKeys } from '@/lib/queryKeys';

export function useFactoryCategories(factoryId: number | string | null | undefined) {
  const enabled = factoryId != null && String(factoryId).trim() !== '';
  return useQuery({
    queryKey: factoryKeys.categories(factoryId),
    enabled,
    queryFn: async () => {
      const raw = await factoriesApi.getCategories(factoryId as string | number);
      return apiListAsRecords(raw)
        .map((r) => Number(r.category_id ?? r.row_id ?? r.id))
        .filter((n) => Number.isFinite(n) && n > 0);
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
