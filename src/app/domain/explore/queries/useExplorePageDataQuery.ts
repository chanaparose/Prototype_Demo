import { useQuery } from '@tanstack/react-query';
import {
  EMPTY_EXPLORE_PAGE_DATA,
  fetchExplorePageData,
} from '@/domain/explore/mappers/mapExploreShowcase';
import { exploreKeys } from '@/lib/queryKeys';

export function useExplorePageDataQuery(enabled = true) {
  return useQuery({
    queryKey: exploreKeys.pageData(),
    queryFn: fetchExplorePageData,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: EMPTY_EXPLORE_PAGE_DATA,
  });
}
