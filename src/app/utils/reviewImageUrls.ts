export const REVIEW_IMAGE_MAX = 5;

export function normalizeReviewImageUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out = [
    ...new Set(input.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)),
  ];
  return out.slice(0, REVIEW_IMAGE_MAX);
}
