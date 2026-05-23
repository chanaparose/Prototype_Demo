import { apiListAsRecords, asRecord } from '@/lib/apiShape';
import { normalizeReviewImageUrls } from '@/utils/reviewImageUrls';

export type ReviewItem = {
  reviewId: number;
  factoryName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isEditable: boolean;
  imageUrls: string[];
};

export function mapReviewItem(raw: unknown): ReviewItem | null {
  const row = asRecord(raw);
  const reviewId = Number(row.review_id ?? row.id ?? 0);
  if (!Number.isFinite(reviewId) || reviewId <= 0) return null;
  return {
    reviewId,
    factoryName: String(row.factory_name ?? row.factory ?? ''),
    rating: Number(row.rating ?? 0),
    comment: String(row.comment ?? ''),
    createdAt: String(row.created_at ?? ''),
    isEditable: Boolean(row.is_editable),
    imageUrls: normalizeReviewImageUrls(row.image_urls),
  };
}

export function mapReviewItems(raw: unknown): ReviewItem[] {
  return apiListAsRecords(raw)
    .map(mapReviewItem)
    .filter((item): item is ReviewItem => Boolean(item));
}
