import { useQuery } from '@tanstack/react-query';
import {
  fetchAndMapFactoryProfile,
  type FactoryProfileFallbacks,
} from '@/domain/factory/mappers/mapFactoryProfile';
import { factoryKeys } from '@/lib/queryKeys';

export function useFactoryProfileQuery(
  factoryId: string | undefined,
  fallbacks: FactoryProfileFallbacks = {},
) {
  return useQuery({
    queryKey: factoryKeys.detail(factoryId ?? ''),
    queryFn: () => fetchAndMapFactoryProfile(factoryId!, fallbacks),
    enabled: Boolean(factoryId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
