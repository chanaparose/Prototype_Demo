import { useQuery } from '@tanstack/react-query';
import { showcasesApi } from '@/services/api/factoryApi';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import { showcaseKeys } from '@/lib/queryKeys';

export function useFactoryShowcasesQuery(factoryId: number) {
  return useQuery({
    queryKey: showcaseKeys.factoryList(factoryId),
    queryFn: async () => {
      const rows = await showcasesApi.listByFactory(factoryId);
      return (Array.isArray(rows) ? rows : [])
        .map((r) => mapShowcaseFromApi(r))
        .filter((s) => s.contentType === 'product' || s.contentType === 'promotion');
    },
    enabled: Number.isFinite(factoryId) && factoryId > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
