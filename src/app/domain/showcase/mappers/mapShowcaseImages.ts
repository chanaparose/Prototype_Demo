import { apiListAsRecords, asRecord } from '@/lib/apiShape';

export type ShowcaseApiImageMeta = {
  imageId: number;
  imageUrl: string;
  sortOrder: number;
};

export function mapShowcaseImageRow(raw: unknown): ShowcaseApiImageMeta | null {
  const row = asRecord(raw);
  const imageId = Number(row.image_id ?? row.id ?? 0);
  const imageUrl = String(row.image_url ?? row.url ?? '').trim();
  const sortOrder = Number(row.sort_order ?? 0);
  if (!Number.isFinite(imageId) || imageId <= 0 || !imageUrl) return null;
  return {
    imageId,
    imageUrl,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export function mapShowcaseImageList(raw: unknown): ShowcaseApiImageMeta[] {
  return apiListAsRecords(raw)
    .map(mapShowcaseImageRow)
    .filter((x): x is ShowcaseApiImageMeta => x != null);
}
