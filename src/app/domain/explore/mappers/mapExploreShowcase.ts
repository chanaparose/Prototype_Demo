import { exploreApi, EXPLORE_PREVIEW_LIMIT } from '@/services/api/exploreApi';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import {
  EMPTY_EXPLORE_PAGE_DATA,
  type IExploreArticle,
  type IExploreFactory,
  type IExplorePageData,
  type IExploreShowcase,
  type IExploreSlide,
} from '@/domain/explore/types/explore.model';
import type {
  IExploreFactoryItem,
  IExploreShowcaseResponse,
  IPromoSlideResponse,
} from '@/services/api/types/explore.types';
import { pickScalarString } from '@/utils/pickScalarString';

export type {
  IExploreArticle,
  IExplorePageData,
  IExploreShowcase,
  IExploreSlide,
} from '@/domain/explore/types/explore.model';

export { EMPTY_EXPLORE_PAGE_DATA };

function mapRowToExploreShowcase(row: IExploreShowcaseResponse): IExploreShowcase {
  const s = mapShowcaseFromApi(row as unknown as Record<string, unknown>);
  return {
    id: s.id,
    factoryId: s.factoryId,
    factoryName: s.factoryName,
    title: s.title,
    excerpt: s.excerpt,
    image: s.image,
    contentType: s.contentType,
    category: s.category,
    subCategoryName: s.sub_category_name ?? '',
    postedAt: s.postedAt,
    likes: s.likes,
    minOrder: s.minOrder,
    ...(s.unitId != null && s.unitId > 0 ? { unitId: s.unitId } : {}),
    ...(s.moqUnit ? { moqUnit: s.moqUnit } : {}),
    leadTime: s.leadTime,
    tags: s.tags,
    ...(s.factoryRating != null ? { factoryRating: s.factoryRating } : {}),
    ...(pickScalarString(s.location) !== '' ? { location: pickScalarString(s.location) } : {}),
  };
}

function mapShowcaseList(rows: IExploreShowcaseResponse[]): IExploreShowcase[] {
  return rows
    .slice(0, EXPLORE_PREVIEW_LIMIT)                    // FE safeguard — cap ที่ 10 เสมอ
    .map(mapRowToExploreShowcase)
    .filter((s) => s.id && s.title);
}

function normSlide(r: IPromoSlideResponse | Record<string, unknown>): IExploreSlide {
  return {
    id: String((r as IPromoSlideResponse).slide_id ?? (r as Record<string, unknown>).id ?? ''),
    title: String((r as IPromoSlideResponse).title ?? (r as Record<string, unknown>).title ?? ''),
    subtitle: String((r as Record<string, unknown>).subtitle ?? ''),
    code: String((r as Record<string, unknown>).code ?? ''),
    image: String(
      (r as IPromoSlideResponse).image_url ?? (r as Record<string, unknown>).image ?? '',
    ),
    linkTo: String(
      (r as IPromoSlideResponse).link_to ?? (r as Record<string, unknown>).linkTo ?? '',
    ),
  };
}

function mapExploreFactory(f: IExploreFactoryItem): IExploreFactory {
  return {
    id: f.id,
    name: f.name,
    image: f.image,
    location: f.location,
    rating: f.rating,
    reviews: f.reviews,
    minOrder: f.min_order,
    ...(f.min_order_unit ? { minOrderUnit: f.min_order_unit } : {}),
    verified: f.verified,
  };
}

export async function fetchExplorePageData(): Promise<IExplorePageData> {
  // Single call to GET /api/v1/explore — replaces 6 separate calls
  const data = await exploreApi.get();
  const s = data.showcases ?? {};

  return {
    categories: (data.categories ?? [])
      .map((c) => ({
        id: String(c.category_id ?? c.id ?? ''),
        name: c.name,
        parentId: null,
      }))
      .filter((c) => c.id && c.name),
    pdShowcases: mapShowcaseList(Array.isArray(s.PD) ? s.PD! : []),
    mtShowcases: mapShowcaseList(Array.isArray(s.MT) ? s.MT! : []),
    pmShowcases: mapShowcaseList(Array.isArray(s.PM) ? s.PM! : []),
    idShowcases: mapShowcaseList(Array.isArray(s.ID) ? s.ID! : []),
    promoSlides: (Array.isArray(data.promoSlides) ? data.promoSlides : [])
      .map(normSlide)
      .filter((sl) => sl.id && sl.title),
    promoCodes: [],
    factories: (Array.isArray(data.factories) ? data.factories : [])
      .slice(0, EXPLORE_PREVIEW_LIMIT)                  // FE safeguard — cap ที่ 10 เสมอ
      .map(mapExploreFactory),
  };
}

export function exploreShowcaseToArticle(s: IExploreShowcase): IExploreArticle {
  return {
    id: s.id,
    factoryId: s.factoryId,
    title: s.title,
    excerpt: s.excerpt,
    image: s.image,
    tag: s.category,
    factoryName: s.factoryName,
    likes: s.likes,
  };
}
