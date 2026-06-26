/** ข้อความรีวิวทั่วไป */
export const REVIEW_BODY_TEXT_CLASS = 'text-[12px]';

/** ชื่อผู้รีวิว / หัวข้อ section */
export const REVIEW_HEADING_TEXT_CLASS = 'text-[14px] font-semibold';

export type ReviewBrowseItem = {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  imageUrls?: string[];
  helpfulCount?: number;
  optionText?: string;
  factoryReply?: string;
};

export type ReviewRatingBreakdown = Record<'5' | '4' | '3' | '2' | '1', number>;

const EMPTY_BREAKDOWN: ReviewRatingBreakdown = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

export function emptyBreakdown(): ReviewRatingBreakdown {
  return { ...EMPTY_BREAKDOWN };
}

export function computeBreakdown(items: ReviewBrowseItem[]): ReviewRatingBreakdown {
  const breakdown = emptyBreakdown();
  for (const item of items) {
    const star = Math.round(Number(item.rating ?? 0));
    if (star >= 1 && star <= 5) {
      breakdown[String(star) as keyof ReviewRatingBreakdown] += 1;
    }
  }
  return breakdown;
}

export function mergeBreakdown(
  primary: ReviewRatingBreakdown | Record<string, number> | undefined,
  items: ReviewBrowseItem[],
): ReviewRatingBreakdown {
  const fromPrimary = emptyBreakdown();
  let hasPrimary = false;
  for (const key of ['5', '4', '3', '2', '1'] as const) {
    const n = Number(primary?.[key] ?? 0);
    if (n > 0) hasPrimary = true;
    fromPrimary[key] = n;
  }
  if (hasPrimary) return fromPrimary;
  return computeBreakdown(items);
}

export function computeAverage(items: ReviewBrowseItem[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + Number(item.rating ?? 0), 0);
  return sum / items.length;
}

export function normalizeShowcaseReview(row: {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt?: string;
  imageUrls?: string[];
  factoryReply?: string;
}): ReviewBrowseItem {
  return {
    id: row.id,
    reviewer: row.reviewer,
    rating: Number(row.rating ?? 0),
    comment: row.comment,
    date: row.createdAt ?? '',
    imageUrls: row.imageUrls,
    factoryReply: row.factoryReply,
  };
}

export function normalizeFactoryReview(row: {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  date?: string;
  created_at?: string;
  imageUrls?: string[];
  helpfulCount?: number;
  optionText?: string;
  factoryReply?: string;
}): ReviewBrowseItem {
  return {
    id: row.id,
    reviewer: row.reviewer,
    rating: Number(row.rating ?? 0),
    comment: row.comment,
    date: row.date ?? row.created_at ?? '',
    imageUrls: row.imageUrls,
    helpfulCount: row.helpfulCount,
    optionText: row.optionText,
    factoryReply: row.factoryReply,
  };
}

export type ReviewBrowseFilters = {
  star: number | null;
  withMedia: boolean;
  query: string;
};

export function filterReviews(
  items: ReviewBrowseItem[],
  filters: ReviewBrowseFilters,
): ReviewBrowseItem[] {
  const q = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.withMedia && !(item.imageUrls && item.imageUrls.length > 0)) return false;
    if (filters.star != null && Math.round(Number(item.rating ?? 0)) !== filters.star) return false;
    if (!q) return true;
    const haystack = `${item.reviewer} ${item.comment} ${item.optionText ?? ''}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function maskReviewer(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 2) return `${trimmed[0] ?? 'ล'}*****`;
  return `${trimmed[0]}${'*'.repeat(Math.min(5, trimmed.length - 2))}${trimmed[trimmed.length - 1]}`;
}

export function getProductReviewsBrowsePath(showcaseId: string, pathname: string): string {
  const id = encodeURIComponent(showcaseId);
  if (/\/factory-ideas\/products\/[^/]+/.test(pathname)) {
    return `/factory-ideas/products/${id}/reviews`;
  }
  return `/product-detail/reviews?showcase_id=${id}`;
}

export function getFactoryReviewsBrowsePath(factoryId: string): string {
  return `/factories/${encodeURIComponent(factoryId)}/reviews`;
}
