import {
  type Factory,
  type FactoryProfile,
  type FactoryReview,
  type FactoryShowcase,
} from '@/stores/types';
import { conversationsApi } from '@/services/api/chatApi';
import { factoriesApi, showcasesApi } from '@/services/api/factoryApi';
import { frontendApi } from '@/services/api/exploreApi';
import { reviewsApi } from '@/services/api/userApi';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import { normalizeReviewImageUrls } from '@/utils/reviewImageUrls';
import { pickFactoryCoverUrl } from '@/utils/normalizeFactoryRow';
import type { IFactoryWithDetailsResponse } from '@/services/api/types/factory.types';
import type { IFactoryReviewSummaryResponse } from '@/services/api/userApi';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export type FactorySubCategoryPair = { categoryLabel: string; subLabel: string };

export type FactoryProfileDetail = {
  factory: Factory;
  profile: FactoryProfile | null;
  reviews: FactoryReview[];
  showcases: FactoryShowcase[];
  factoryCategoryNames: string[];
  factorySubCategoryNames: string[];
  factorySubCategoryPairs: FactorySubCategoryPair[];
  apiCertificates: Record<string, unknown>[];
};

export type FactoryProfileFallbacks = {
  factory?: Factory | null;
  profile?: FactoryProfile | null;
};

function nameFromCatRow(row: unknown): string | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  const n = pickScalarString(o.name, o.category_name, o.sub_category_name);
  return n || null;
}

function extractNestedArray(
  top: Record<string, unknown>,
  inner: Record<string, unknown>,
  key: string,
): unknown[] {
  if (Array.isArray(top[key])) return top[key] as unknown[];
  if (Array.isArray(inner[key])) return inner[key] as unknown[];
  return [];
}

function mapFactoryFromApi(
  row: Record<string, unknown>,
  id: string,
  fallback?: Factory | null,
): Factory {
  const b = fallback ?? undefined;
  const ftn = pickScalarString(row.factory_type_name, row.factoryTypeName);
  const coverImageUrl = pickFactoryCoverUrl(row) || pickScalarString(b?.coverImageUrl);
  let image = pickScalarString(row.image_url, row.image, row.logo_url);
  if (!image) image = pickScalarString(b?.image);
  if (!image && coverImageUrl) image = coverImageUrl;
  return {
    id: pickScalarString(row.id, row.factory_id, id),
    name: pickScalarString(row.name, row.factory_name, b?.name),
    location: pickScalarString(row.location, row.province_name, row.city, b?.location),
    rating: pickScalarNumber(row.avg_rating, row.rating, b?.rating) ?? 0,
    reviews: pickScalarNumber(row.review_count, row.reviews, b?.reviews) ?? 0,
    specialization: pickScalarString(row.specialization, row.description, b?.specialization),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : (b?.tags ?? []),
    minOrder: pickScalarNumber(row.min_order, row.minOrder, b?.minOrder) ?? 0,
    leadTime: pickScalarString(row.lead_time, row.leadTime, b?.leadTime),
    image,
    ...(coverImageUrl ? { coverImageUrl } : {}),
    verified: Boolean(row.is_verified ?? row.verified ?? b?.verified ?? false),
    completedOrders:
      pickScalarNumber(row.completed_orders, row.completedOrders, b?.completedOrders) ?? 0,
    priceRange: pickScalarString(row.price_range, row.priceRange, b?.priceRange),
    ...(ftn ? { factoryTypeName: ftn } : {}),
  };
}

function mapProfileFromApi(
  p: Record<string, unknown>,
  factoryId: string,
  fallback?: FactoryProfile | null,
): FactoryProfile {
  const b = fallback;
  const addr = pickScalarString(p.address, p.address_detail, b?.address);
  const types = Array.isArray(p.accepted_product_types)
    ? p.accepted_product_types.map(String)
    : Array.isArray(p.acceptedProductTypes)
      ? p.acceptedProductTypes.map(String)
      : (b?.acceptedProductTypes ?? []);
  const certs = Array.isArray(p.certificates)
    ? p.certificates.map(String)
    : (b?.certificates ?? []);
  return {
    factoryId: pickScalarString(p.factory_id, factoryId),
    address: addr,
    acceptedProductTypes: types,
    certificates: certs,
  };
}

function mapReviewFromApi(r: Record<string, unknown>, factoryId: string): FactoryReview | null {
  const rid = pickScalarString(r.id, r.review_id);
  if (!rid) return null;
  const userId = pickScalarNumber(r.user_id, r.userId) ?? 0;
  const firstName = pickScalarString(r.first_name, r.firstName);
  const lastName = pickScalarString(r.last_name, r.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const fallbackByUserId = Number.isFinite(userId) && userId > 0 ? `ผู้ใช้ #${userId}` : '';
  const reviewer = pickScalarString(
    fullName,
    r.reviewer_name,
    r.reviewer,
    r.user_name,
    r.display_name,
    fallbackByUserId,
    'ลูกค้า',
  );
  const imageUrls = normalizeReviewImageUrls(r.image_urls);
  return {
    id: rid,
    factoryId,
    reviewer,
    rating: pickScalarNumber(r.rating) ?? 0,
    comment: pickScalarString(r.comment, r.text),
    date: pickScalarString(r.created_at, r.date),
    helpfulCount: pickScalarNumber(r.helpful_count, r.useful_count) ?? 0,
    optionText: pickScalarString(r.option_text, r.variant, r.sku_option) || undefined,
    ...(imageUrls.length > 0 ? { imageUrls } : {}),
  };
}

export async function fetchAndMapFactoryProfile(
  factoryId: string,
  fallbacks: FactoryProfileFallbacks = {},
): Promise<FactoryProfileDetail> {
  const fid = pickScalarString(factoryId);
  const fb = fallbacks.factory ?? null;
  const profFallback = fallbacks.profile ?? null;

  const factorySubCategoryPairs: FactorySubCategoryPair[] = [];
  const factoryCategoryNames: string[] = [];
  const factorySubCategoryNames: string[] = [];
  let apiCertificates: Record<string, unknown>[] = [];

  const pushPair = (cat: string, sub: string) => {
    const c = cat.trim();
    const s = sub.trim();
    if (!s) return;
    factorySubCategoryPairs.push({ categoryLabel: c || 'หมวด', subLabel: s });
  };

  const [factRes, frontRes, summaryRes] = await Promise.allSettled([
    factoriesApi.get(fid),
    frontendApi.getFactory(factoryId),
    reviewsApi.summaryByFactory(fid),
  ]);

  let factory: Factory | null = null;
  let profile: FactoryProfile | null = profFallback;
  let reviews: FactoryReview[] = [];
  let showcases: FactoryShowcase[] = [];

  if (factRes.status === 'fulfilled' && factRes.value) {
    const details = factRes.value as IFactoryWithDetailsResponse;
    const raw = asRecord(details);
    const rawF = asRecord(details.factory);
    factory = mapFactoryFromApi(rawF, fid, fb);

    for (const row of extractNestedArray(raw, rawF, 'categories')) {
      const n = nameFromCatRow(row);
      if (n) factoryCategoryNames.push(n);
    }
    for (const row of extractNestedArray(raw, rawF, 'sub_categories')) {
      const n = nameFromCatRow(row);
      if (n) factorySubCategoryNames.push(n);
    }

    for (const row of extractNestedArray(raw, rawF, 'factory_sub_categories')) {
      if (!row || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      pushPair(
        pickScalarString(o.category_name, o.parent_category_name),
        pickScalarString(o.sub_category_name, o.name),
      );
    }
    for (const row of extractNestedArray(raw, rawF, 'sub_categories')) {
      if (!row || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      const cat = pickScalarString(o.category_name, o.parent_category_name);
      const sub = pickScalarString(o.sub_category_name, o.name);
      if (cat && sub) pushPair(cat, sub);
    }

    const seen = new Set<string>();
    const dedupedPairs = factorySubCategoryPairs.filter((p) => {
      const k = `${p.categoryLabel}|${p.subLabel}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    factorySubCategoryPairs.length = 0;
    factorySubCategoryPairs.push(...dedupedPairs);

    const certArr = extractNestedArray(raw, rawF, 'certificates');
    apiCertificates = certArr.filter(
      (x): x is Record<string, unknown> => x != null && typeof x === 'object',
    );
  }

  if (frontRes.status === 'fulfilled' && frontRes.value) {
    const res = frontRes.value;
    const rawF = (res.factory && typeof res.factory === 'object' ? res.factory : {}) as Record<
      string,
      unknown
    >;
    factory = mapFactoryFromApi(rawF, fid, factory ?? fb);

    const rawP =
      res.profile && typeof res.profile === 'object'
        ? (res.profile as Record<string, unknown>)
        : null;
    profile =
      rawP && Object.keys(rawP).length > 0
        ? mapProfileFromApi(rawP, fid, profFallback)
        : profFallback;

    const revRows = Array.isArray(res.reviews) ? (res.reviews as Record<string, unknown>[]) : [];
    reviews = revRows
      .map((r) => mapReviewFromApi(r, fid))
      .filter((x): x is FactoryReview => x != null);

    for (const key of ['products', 'promotions', 'ideas'] as const) {
      const arr = res[key];
      if (Array.isArray(arr)) {
        for (const raw of arr) {
          const s = mapShowcaseFromApi(raw as Record<string, unknown>);
          if (s.id && s.title) {
            if (!s.factoryId) s.factoryId = fid;
            showcases.push(s);
          }
        }
      }
    }
  }

  if (factory) {
    try {
      const rawList = await showcasesApi.listByFactory(factoryId);
      const arr = (Array.isArray(rawList) ? rawList : []) as Record<string, unknown>[];
      const fromApi = arr
        .map((row) => mapShowcaseFromApi(row))
        .filter((s) => s.id && s.title)
        .map((s) => {
          if (!s.factoryId) s.factoryId = fid;
          return s;
        });
      if (fromApi.length > 0) showcases = fromApi;
    } catch {
      /* keep BFF showcases */
    }
  }

  if (factRes.status === 'fulfilled' && reviews.length === 0 && factRes.value) {
    const details = factRes.value as IFactoryWithDetailsResponse;
    const raw = asRecord(details);
    const rawF = asRecord(details.factory);
    const revRows = extractNestedArray(raw, rawF, 'reviews') as Record<string, unknown>[];
    reviews = revRows
      .map((r) => mapReviewFromApi(r, fid))
      .filter((x): x is FactoryReview => x != null);
  }

  if (!factory) {
    throw new Error('factory not found');
  }

  if (summaryRes.status === 'fulfilled' && summaryRes.value) {
    const s = summaryRes.value as IFactoryReviewSummaryResponse;
    const avg = pickScalarNumber(s.average_rating);
    const count = pickScalarNumber(s.review_count, s.total_reviews);
    if (avg != null && avg >= 0) factory.rating = avg;
    if (count != null && count >= 0) factory.reviews = count;
  }

  return {
    factory,
    profile,
    reviews,
    showcases,
    factoryCategoryNames,
    factorySubCategoryNames,
    factorySubCategoryPairs,
    apiCertificates,
  };
}

export async function createFactoryConversation(
  factoryId: string,
  customerId: number | string,
): Promise<string | null> {
  const res = await conversationsApi.create({
    customer_id: pickScalarNumber(customerId) ?? 0,
    factory_id: pickScalarNumber(factoryId) ?? 0,
  });
  return res.conv_id > 0 ? String(res.conv_id) : null;
}
