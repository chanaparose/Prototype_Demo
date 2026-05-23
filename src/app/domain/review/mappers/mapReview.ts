import { apiListAsRecords, asRecord } from '@/lib/apiShape';
import { normalizeReviewImageUrls } from '@/utils/reviewImageUrls';
import { pickScalarString } from '@/utils/pickScalarString';

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
  return apiListAsRecords(raw, ['reviews'])
    .map(mapReviewItem)
    .filter((item): item is ReviewItem => Boolean(item));
}

export type FactoryReviewListItem = {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type FactoryReviewSummary = {
  factory_id: number;
  average_rating: number;
  review_count: number;
  rating_breakdown: Record<string, number>;
};

export function mapFactoryReviewListItem(raw: unknown): FactoryReviewListItem | null {
  const row = asRecord(raw);
  const id = pickScalarString(row.review_id, row.id);
  if (!id) return null;
  const firstName = pickScalarString(row.first_name);
  const lastName = pickScalarString(row.last_name);
  const fullName = `${firstName} ${lastName}`.trim();
  const reviewer = pickScalarString(
    fullName,
    row.reviewer_name,
    row.reviewer,
    row.user_name,
    row.display_name,
    'ลูกค้า',
  );
  return {
    id,
    reviewer: reviewer || 'ลูกค้า',
    rating: Number(row.rating ?? 0),
    comment: pickScalarString(row.comment, row.text),
    created_at: pickScalarString(row.created_at, row.date),
  };
}

export function mapFactoryReviewList(raw: unknown): FactoryReviewListItem[] {
  return apiListAsRecords(raw, ['reviews'])
    .map(mapFactoryReviewListItem)
    .filter((x): x is FactoryReviewListItem => x != null);
}

export function mapFactoryReviewSummary(raw: unknown): FactoryReviewSummary | null {
  const row = asRecord(raw);
  if (Object.keys(row).length === 0) return null;
  const factoryId = Number(row.factory_id ?? 0);
  const average = Number(row.average_rating ?? 0);
  const count = Number(row.review_count ?? 0);
  const breakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const b = asRecord(row.rating_breakdown);
  for (const k of ['5', '4', '3', '2', '1']) {
    const n = Number(b[k] ?? 0);
    breakdown[k] = Number.isFinite(n) && n > 0 ? n : 0;
  }
  return {
    factory_id: Number.isFinite(factoryId) && factoryId > 0 ? factoryId : 0,
    average_rating: Number.isFinite(average) ? average : 0,
    review_count: Number.isFinite(count) && count > 0 ? count : 0,
    rating_breakdown: breakdown,
  };
}
