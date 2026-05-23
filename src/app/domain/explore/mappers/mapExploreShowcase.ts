import { exploreApi } from '@/services/api/exploreApi';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import {
  EMPTY_EXPLORE_PAGE_DATA,
  type IExploreArticle,
  type IExplorePageData,
  type IExploreShowcase,
  type IExploreSlide,
} from '@/domain/explore/types/explore.model';
import type { IExploreShowcaseResponse, IPromoSlideResponse } from '@/services/api/types/explore.types';
import { asRecord } from '@/lib/apiShape';

export type {
  IExploreArticle,
  IExplorePageData,
  IExploreShowcase,
  IExploreSlide,
} from '@/domain/explore/types/explore.model';

export { EMPTY_EXPLORE_PAGE_DATA };

function mapRowToExploreShowcase(row: IExploreShowcaseResponse): IExploreShowcase {
  const s = mapShowcaseFromApi(row);
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
    leadTime: s.leadTime,
    tags: s.tags,
    ...(s.factoryRating != null ? { factoryRating: s.factoryRating } : {}),
  };
}

function mapShowcaseList(rows: IExploreShowcaseResponse[]): IExploreShowcase[] {
  return rows.map(mapRowToExploreShowcase).filter((s) => s.id && s.title);
}

function normSlide(r: IPromoSlideResponse | unknown): IExploreSlide {
  const row = asRecord(r);
  return {
    id: String(row.slide_id ?? row.id ?? ''),
    title: String(row.title ?? ''),
    subtitle: String(row.subtitle ?? ''),
    code: String(row.code ?? ''),
    image: String(row.image_url ?? row.image ?? ''),
    linkTo: String(row.link_to ?? row.linkTo ?? ''),
  };
}

export async function fetchExplorePageData(): Promise<IExplorePageData> {
  // Single call to GET /api/v1/explore — replaces 6 separate calls
  const data = await exploreApi.get();
  const s = data.showcases ?? {};

  return {
    categories: (data.categories ?? []).map((c) => ({
      id: String(c.category_id ?? c.id ?? ''),
      name: c.name,
      parentId: null,
    })).filter((c) => c.id && c.name),
    pdShowcases: mapShowcaseList(Array.isArray(s.PD) ? s.PD! : []),
    mtShowcases: mapShowcaseList(Array.isArray(s.MT) ? s.MT! : []),
    pmShowcases: mapShowcaseList(Array.isArray(s.PM) ? s.PM! : []),
    idShowcases: mapShowcaseList(Array.isArray(s.ID) ? s.ID! : []),
    promoSlides: (Array.isArray(data.promoSlides) ? data.promoSlides : [])
      .map(normSlide)
      .filter((sl) => sl.id && sl.title),
    promoCodes: [],
  };
}

export function exploreShowcaseToArticle(s: IExploreShowcase): IExploreArticle {
  return {
    id: s.id,
    title: s.title,
    excerpt: s.excerpt,
    image: s.image,
    tag: s.category,
    factoryName: s.factoryName,
    likes: s.likes,
  };
}
