import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/services/api/userApi';
import { factoryKeys } from '@/lib/queryKeys';

export type FactoryReviewSummary = {
  factory_id: number;
  average_rating: number;
  review_count: number;
  rating_breakdown: Record<string, number>;
};

function normalizeSummary(
  raw: Record<string, unknown> | null | undefined,
): FactoryReviewSummary | null {
  if (!raw) return null;
  const factoryId = Number(raw.factory_id ?? 0);
  const average = Number(raw.average_rating ?? 0);
  const count = Number(raw.review_count ?? 0);
  const b = raw.rating_breakdown;
  const breakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  if (b && typeof b === 'object' && !Array.isArray(b)) {
    const o = b as Record<string, unknown>;
    for (const k of ['5', '4', '3', '2', '1']) {
      const n = Number(o[k] ?? 0);
      breakdown[k] = Number.isFinite(n) && n > 0 ? n : 0;
    }
  }
  return {
    factory_id: Number.isFinite(factoryId) && factoryId > 0 ? factoryId : 0,
    average_rating: Number.isFinite(average) ? average : 0,
    review_count: Number.isFinite(count) && count > 0 ? count : 0,
    rating_breakdown: breakdown,
  };
}

export function useFactoryReviewSummary(factoryId: string | number | null | undefined) {
  const enabled = factoryId != null && Number(factoryId) > 0;
  return useQuery({
    queryKey: factoryKeys.reviewsSummary(factoryId as string | number),
    enabled,
    queryFn: async () => {
      const raw = (await reviewsApi.summaryByFactory(factoryId as string | number)) as Record<
        string,
        unknown
      >;
      return normalizeSummary(raw);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
