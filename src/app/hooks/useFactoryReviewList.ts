import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/services/api/userApi';

export type FactoryReviewItem = {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  created_at: string;
  factoryReply?: string;
  factoryReplyAt?: string;
};

function mapReviewRow(raw: Record<string, unknown>): FactoryReviewItem | null {
  const id = String(raw.review_id ?? raw.id ?? '').trim();
  if (!id) return null;
  const firstName = String(raw.first_name ?? '').trim();
  const lastName = String(raw.last_name ?? '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const reviewer = String(
    fullName ||
      String(raw.reviewer_name ?? raw.reviewer ?? raw.user_name ?? raw.display_name ?? 'ลูกค้า'),
  ).trim();
  return {
    id,
    reviewer: reviewer || 'ลูกค้า',
    rating: Number(raw.rating ?? 0),
    comment: String(raw.comment ?? raw.text ?? '').trim(),
    created_at: String(raw.created_at ?? raw.date ?? ''),
    ...(raw.factory_reply ? { factoryReply: String(raw.factory_reply) } : {}),
    ...(raw.factory_reply_at ? { factoryReplyAt: String(raw.factory_reply_at) } : {}),
  };
}

export function useFactoryReviewList(factoryId: string | number | null | undefined) {
  const enabled = factoryId != null && Number(factoryId) > 0;
  return useQuery({
    queryKey: ['factory', String(factoryId), 'reviews-list'] as const,
    enabled,
    queryFn: async () => {
      const raw = await reviewsApi.listByFactory(factoryId as string | number);
      let rows: Record<string, unknown>[] = [];
      if (Array.isArray(raw)) {
        rows = raw as Record<string, unknown>[];
      } else if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        if (Array.isArray(r.reviews)) rows = r.reviews as Record<string, unknown>[];
        else if (Array.isArray(r.data)) rows = r.data as Record<string, unknown>[];
        else if (Array.isArray(r.items)) rows = r.items as Record<string, unknown>[];
      }
      return rows.map(mapReviewRow).filter((x): x is FactoryReviewItem => x != null);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
