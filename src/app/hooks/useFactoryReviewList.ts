import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/services/api/userApi';
import { factoryKeys } from '@/lib/queryKeys';
import {
  mapFactoryReviewList,
  type FactoryReviewListItem,
} from '@/domain/review/mappers/mapReview';

export type FactoryReviewItem = FactoryReviewListItem;

export function useFactoryReviewList(factoryId: string | number | null | undefined) {
  const enabled = factoryId != null && Number(factoryId) > 0;
  return useQuery({
    queryKey: factoryKeys.reviewsList(factoryId as string | number),
    enabled,
    queryFn: async () => {
      const raw = await reviewsApi.listByFactory(factoryId as string | number);
      return mapFactoryReviewList(raw);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
