import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/services/api/userApi';
import { factoryKeys } from '@/lib/queryKeys';
import {
  mapFactoryReviewSummary,
  type FactoryReviewSummary,
} from '@/domain/review/mappers/mapReview';

export type { FactoryReviewSummary };

export function useFactoryReviewSummary(factoryId: string | number | null | undefined) {
  const enabled = factoryId != null && Number(factoryId) > 0;
  return useQuery({
    queryKey: factoryKeys.reviewsSummary(factoryId as string | number),
    enabled,
    queryFn: async () => {
      const raw = await reviewsApi.summaryByFactory(factoryId as string | number);
      return mapFactoryReviewSummary(raw);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
