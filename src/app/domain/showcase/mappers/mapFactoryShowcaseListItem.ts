type ApiRecord = Record<string, unknown>;

export type FactoryShowcaseType = 'PD' | 'PM' | 'ID' | 'MT';
export type FactoryShowcaseStatus = 'DR' | 'AC' | 'HI' | 'AR';

export type FactoryShowcaseListItem = {
  id: string;
  title: string;
  contentType: string;
  status: FactoryShowcaseStatus;
  imageUrl?: string;
  price: number;
  moq: number;
  categoryLine: string;
  locationLine: string;
  rating: number;
  reviewCount: number;
  factoryName: string;
};

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? (value as ApiRecord) : {};
}

function firstImage(row: ApiRecord): string | undefined {
  const direct = String(row.image_url ?? '').trim();
  if (direct) return direct;
  const images = row.images ?? row.image_urls;
  if (!Array.isArray(images) || images.length === 0) return undefined;
  const first = images[0];
  if (typeof first === 'string') return first;
  const image = asRecord(first);
  const url = String(image.url ?? image.image_url ?? '').trim();
  return url || undefined;
}

function asPositiveInt(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

export function mapFactoryShowcaseListItem(raw: unknown): FactoryShowcaseListItem {
  const row = asRecord(raw);
  return {
    id: String(row.showcase_id ?? row.id ?? ''),
    title: String(row.title ?? 'Untitled'),
    contentType: String(row.content_type ?? '').toUpperCase(),
    status: String(row.status ?? 'DR').toUpperCase() as FactoryShowcaseStatus,
    imageUrl: firstImage(row),
    price: Number(row.price_min ?? row.price ?? 0),
    moq: asPositiveInt(row.moq),
    categoryLine: [row.category_name, row.sub_category_name].filter(Boolean).join(' › '),
    locationLine: String(row.factory_location ?? row.province_name ?? '').trim(),
    rating: Number(row.rating_avg ?? row.factory_rating_avg ?? 0),
    reviewCount: asPositiveInt(row.review_count ?? row.reviews),
    factoryName: String(row.factory_name ?? ''),
  };
}

export function mapFactoryShowcaseList(raw: unknown): FactoryShowcaseListItem[] {
  return (Array.isArray(raw) ? raw : []).map(mapFactoryShowcaseListItem);
}
