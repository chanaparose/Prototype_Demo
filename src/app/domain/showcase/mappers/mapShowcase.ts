import { type FactoryShowcase, type ShowcaseImageRow, type ShowcaseSpecRow } from '@/stores/types';
import { showcasesApi } from '@/services/api/factoryApi';
import { partitionLinkedShowcases } from '@/utils/linkedShowcases';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export type ShowcaseApiType = 'PD' | 'PM' | 'ID' | 'MT';

const CT_MAP: Record<string, 'product' | 'promotion' | 'idea' | 'material'> = {
  PD: 'product',
  PR: 'product',
  PM: 'promotion',
  ID: 'idea',
  MT: 'material',
  product: 'product',
  promotion: 'promotion',
  idea: 'idea',
  material: 'material',
};

function parseImageUrls(raw: unknown): string[] {
  const src = Array.isArray(raw)
    ? raw
    : typeof raw === 'string' && raw.trim().startsWith('[')
      ? (() => {
          try {
            const p = JSON.parse(raw) as unknown;
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];
  return src
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      const row = item as Record<string, unknown>;
      return pickScalarString(row.url, row.image_url, row.public_url);
    })
    .filter((u) => u !== '')
    .slice(0, 5);
}

export function mapShowcaseFromApi(r: Record<string, unknown>): FactoryShowcase {
  const leadRaw = r.lead_time ?? r.leadTime ?? r.lead_time_days;
  const leadTime = leadRaw != null && leadRaw !== '' ? pickScalarString(leadRaw) : '';
  const imageUrls = parseImageUrls(r.images ?? r.image_urls ?? r.imageUrls);
  const { imageUrls: linkedImageUrls, showcaseIds } = partitionLinkedShowcases(
    r.linked_showcases ?? r.linkedShowcases,
  );
  const linkedFirstImage = linkedImageUrls[0] ?? '';
  const ctRaw = pickScalarString(r.content_type, r.type).toUpperCase();
  const firstImage =
    ctRaw === 'PD' || ctRaw === 'PR' || ctRaw === 'PM'
      ? linkedFirstImage || imageUrls[0] || pickScalarString(r.image_url, r.image)
      : imageUrls[0] || linkedFirstImage || pickScalarString(r.image_url, r.image);

  const catIdRaw = pickScalarString(r.category_id, r.categoryId);
  const categoryId = catIdRaw !== '' ? catIdRaw : undefined;

  const subRaw = r.sub_category_id ?? r.subCategoryId;
  let sub_category_id: number | undefined;
  const subIdNum = pickScalarNumber(subRaw);
  if (subIdNum != null && subIdNum > 0) sub_category_id = subIdNum;

  const sub_category_name = pickScalarString(r.sub_category_name, r.subCategoryName) || null;

  const factoryImageUrl = pickScalarString(r.factory_image_url, r.factoryImageUrl);
  const fr = r.factory_rating ?? r.factoryRating;
  const factoryRating =
    fr != null && String(fr).trim() !== '' && Number.isFinite(Number(fr)) ? Number(fr) : undefined;
  const factoryVerified = Boolean(r.factory_verified ?? r.factoryVerified);

  return {
    id: pickScalarString(r.showcase_id, r.id, r.showcaseId),
    factoryId: pickScalarString(r.factory_id, r.factoryId),
    factoryName: pickScalarString(r.factory_name, r.factoryName),
    title: pickScalarString(r.title, r.name, r.headline),
    excerpt: pickScalarString(r.excerpt, r.summary),
    image: firstImage,
    ...(imageUrls.length > 0 ? { imageUrls } : {}),
    contentType: CT_MAP[pickScalarString(r.content_type, r.type)] ?? 'product',
    category: pickScalarString(r.category_name, r.category),
    categoryId,
    sub_category_id,
    sub_category_name,
    postedAt: pickScalarString(r.published_at, r.created_at, r.postedAt),
    likes: Number(r.likes_count ?? r.likes ?? 0),
    minOrder: Number(r.moq ?? r.min_order ?? r.minOrder ?? 0),
    leadTime,
    ...(pickScalarString(r.content) !== '' ? { content: pickScalarString(r.content) } : {}),
    ...(r.base_price != null && Number.isFinite(Number(r.base_price))
      ? { basePrice: Number(r.base_price) }
      : {}),
    ...(r.promo_price != null && Number.isFinite(Number(r.promo_price))
      ? { promoPrice: Number(r.promo_price) }
      : {}),
    ...(pickScalarString(r.start_date) !== '' ? { startDate: pickScalarString(r.start_date) } : {}),
    ...(pickScalarString(r.end_date) !== '' ? { endDate: pickScalarString(r.end_date) } : {}),
    ...(pickScalarString(r.status) !== '' ? { status: pickScalarString(r.status) } : {}),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    ...(factoryImageUrl ? { factoryImageUrl } : {}),
    ...(factoryRating != null ? { factoryRating } : {}),
    ...(factoryVerified ? { factoryVerified } : {}),
    ...(pickScalarString(r.description) !== ''
      ? { description: pickScalarString(r.description) }
      : {}),
    ...(pickScalarString(r.price_range, r.priceRange) !== ''
      ? { priceRange: pickScalarString(r.price_range, r.priceRange) }
      : {}),
    ...(Array.isArray(r.sections) && r.sections.length > 0
      ? { sections: r.sections as import('@/stores/types').ShowcaseSection[] }
      : {}),
    ...(Array.isArray(r.images) && r.images.length > 0
      ? { images: r.images as ShowcaseImageRow[] }
      : {}),
    ...(Array.isArray(r.specs) && r.specs.length > 0
      ? {
          specs: (r.specs as Record<string, unknown>[]).map((sp) => ({
            spec_key: pickScalarString(sp.spec_key),
            spec_value: pickScalarString(sp.spec_value),
            sort_order: Number(sp.sort_order ?? 0),
          })) as ShowcaseSpecRow[],
        }
      : {}),
    ...(linkedImageUrls.length > 0 || showcaseIds.length > 0
      ? { linkedShowcases: [...linkedImageUrls, ...showcaseIds] }
      : {}),
  };
}

function unwrapShowcaseRow(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const inner = o.showcase;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return o;
}

export function extractShowcaseRows(raw: unknown): Record<string, unknown>[] {
  const top = raw as Record<string, unknown> | null;
  const rows: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((top as Record<string, unknown> | null)?.showcases)
      ? ((top as Record<string, unknown>).showcases as unknown[])
      : Array.isArray((top as Record<string, unknown> | null)?.data)
        ? ((top as Record<string, unknown>).data as unknown[])
        : Array.isArray((top as Record<string, unknown> | null)?.items)
          ? ((top as Record<string, unknown>).items as unknown[])
          : Array.isArray((top as Record<string, unknown> | null)?.results)
            ? ((top as Record<string, unknown>).results as unknown[])
            : [];
  return rows.map(unwrapShowcaseRow).filter((r): r is Record<string, unknown> => r != null);
}

export async function fetchAndMapShowcaseList(type?: ShowcaseApiType): Promise<FactoryShowcase[]> {
  const raw = await showcasesApi.list(type);
  const arr = extractShowcaseRows(raw);
  return arr.map(mapShowcaseFromApi).filter((s) => s.id && s.title);
}

export function showcaseQueryTypeFromTab(
  tab: 'all' | 'product' | 'promotion' | 'idea' | 'material' | 'factory',
): ShowcaseApiType | undefined {
  if (tab === 'all' || tab === 'factory') return undefined;
  if (tab === 'product') return 'PD';
  if (tab === 'promotion') return 'PM';
  if (tab === 'material') return 'MT';
  return 'ID';
}
