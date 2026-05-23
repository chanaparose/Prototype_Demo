import { type Factory, type FactoryShowcase } from '@/stores/types';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import { apiListAsRecords, asRecord, nestedRecord, type ApiRecord } from '@/lib/apiShape';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export type ReviewItem = {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ReviewsData = {
  summary: {
    average: number;
    total: number;
    breakdown: Record<string, number>;
  };
  items: ReviewItem[];
};

export type ShowcaseDetailBundle = {
  showcase: FactoryShowcase;
  factory: Factory | null;
  reviews: ReviewsData | null;
};

export function unwrapShowcaseDetailPayload(raw: unknown): ApiRecord {
  const root = asRecord(raw);
  const showcase = nestedRecord(root, 'showcase');
  if (showcase.showcase_id || showcase.id) return showcase;
  const data = nestedRecord(root, 'data');
  if (data.showcase_id || data.id) return data;
  return root;
}

export function mapEmbeddedFactory(raw: unknown): Factory {
  const f = asRecord(raw);
  return {
    id: pickScalarString(f.factory_id),
    name: pickScalarString(f.factory_name),
    location: pickScalarString(f.province),
    provinceName: pickScalarString(f.province),
    rating: pickScalarNumber(f.rating) ?? 0,
    reviews: pickScalarNumber(f.review_count) ?? 0,
    specialization: pickScalarString(f.factory_type),
    tags: [],
    minOrder: pickScalarNumber(f.min_order) ?? 0,
    leadTime: pickScalarString(f.lead_time_desc),
    image: pickScalarString(f.image_url),
    verified: Boolean(f.verified),
    completedOrders: pickScalarNumber(f.completed_orders) ?? 0,
    priceRange: '',
    factoryTypeName: pickScalarString(f.factory_type),
  };
}

export function mapEmbeddedReviews(raw: unknown): ReviewsData {
  const rRaw = asRecord(raw);
  const s = asRecord(rRaw.summary);
  const breakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const b = asRecord(s.breakdown ?? s.rating_breakdown);
  for (const k of ['5', '4', '3', '2', '1']) {
    const n = Number(b[k] ?? 0);
    if (Number.isFinite(n)) breakdown[k] = n;
  }
  return {
    summary: {
      average: pickScalarNumber(s.average) ?? 0,
      total: pickScalarNumber(s.total) ?? 0,
      breakdown,
    },
    items: apiListAsRecords(rRaw.items)
      .map((row) => ({
        id: pickScalarString(row.review_id, row.id),
        reviewer: pickScalarString(row.reviewer_name, row.reviewer, 'ลูกค้า'),
        rating: pickScalarNumber(row.rating) ?? 0,
        comment: pickScalarString(row.comment),
        createdAt: pickScalarString(row.created_at),
      }))
      .filter((r) => r.id),
  };
}

export function parseGroupedRelatedShowcases(raw: unknown, excludeId: string): FactoryShowcase[] {
  const buckets: FactoryShowcase[] = [];
  const root = asRecord(raw);
  if (Object.keys(root).length > 0 && !Array.isArray(raw)) {
    for (const rows of Object.values(root)) {
      buckets.push(...apiListAsRecords(rows).map(mapShowcaseFromApi));
    }
  } else {
    buckets.push(...apiListAsRecords(raw).map(mapShowcaseFromApi));
  }
  const uniq = new Map<string, FactoryShowcase>();
  for (const row of buckets) {
    if (!row.id || row.id === excludeId) continue;
    if (!['product', 'promotion', 'material'].includes(row.contentType)) continue;
    if (!uniq.has(row.id)) uniq.set(row.id, row);
  }
  return [...uniq.values()].slice(0, 8);
}

export function mapShowcaseDetailBundle(
  raw: unknown,
  acceptTypes: FactoryShowcase['contentType'][],
): ShowcaseDetailBundle {
  const root = asRecord(raw);
  const row = unwrapShowcaseDetailPayload(raw);
  const showcase = mapShowcaseFromApi(row);
  if (!showcase.id || !acceptTypes.includes(showcase.contentType)) {
    throw new Error('ไม่พบข้อมูลโชว์เคส');
  }
  const fRaw = row.factory ?? root.factory;
  const rRaw = row.reviews ?? root.reviews;
  return {
    showcase,
    factory: fRaw ? mapEmbeddedFactory(fRaw) : null,
    reviews: rRaw ? mapEmbeddedReviews(rRaw) : null,
  };
}
