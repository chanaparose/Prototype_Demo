import { useQuery } from '@tanstack/react-query';
import {
  fetchAndMapShowcaseList,
  type ShowcaseApiType,
} from '@/domain/showcase/mappers/mapShowcase';
import { showcaseKeys } from '@/lib/queryKeys';

export function useShowcasesQuery(type?: ShowcaseApiType) {
  return useQuery({
    queryKey: showcaseKeys.list(type ?? 'ALL'),
    queryFn: () => fetchAndMapShowcaseList(type),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
