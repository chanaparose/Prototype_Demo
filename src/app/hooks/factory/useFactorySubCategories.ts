import { useQuery } from '@tanstack/react-query';
import { apiListAsRecords } from '@/lib/apiShape';
import { factoriesApi } from '@/services/api/factoryApi';
import { factoryKeys } from '@/lib/queryKeys';

export function useFactorySubCategories(factoryId: number | string | null | undefined) {
  const enabled = factoryId != null && String(factoryId).trim() !== '';
  return useQuery({
    queryKey: factoryKeys.subCategories(factoryId),
    enabled,
    queryFn: async () => {
      const raw = await factoriesApi.getSubCategories(factoryId as string | number);
      return apiListAsRecords(raw)
        .map((r) => Number(r.sub_category_id ?? r.row_id ?? r.id))
        .filter((n) => Number.isFinite(n) && n > 0);
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
