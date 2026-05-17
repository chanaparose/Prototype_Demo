import { frontendApi, promoSlidesApi } from '@/services/api/exploreApi';
import { showcasesApi } from '@/services/api/factoryApi';
import type { IExploreShowcaseResponse } from '@/services/api/types/explore.types';
import {
  extractShowcaseRows,
  mapShowcaseFromApi,
} from '@/domain/showcase/mappers/mapShowcase';
import {
  EMPTY_EXPLORE_PAGE_DATA,
  type IExploreArticle,
  type IExplorePageData,
  type IExploreShowcase,
  type IExploreSlide,
} from '@/domain/explore/types/explore.model';

export type {
  IExploreArticle,
  IExplorePageData,
  IExploreShowcase,
  IExploreSlide,
} from '@/domain/explore/types/explore.model';

export { EMPTY_EXPLORE_PAGE_DATA };

function mapRowToExploreShowcase(row: Record<string, unknown>): IExploreShowcase {
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
  };
}

export function mapExploreShowcaseResponse(row: IExploreShowcaseResponse): IExploreShowcase {
  return mapRowToExploreShowcase(row as unknown as Record<string, unknown>);
}

function mapExploreShowcaseList(raw: unknown): IExploreShowcase[] {
  return extractShowcaseRows(raw)
    .map(mapRowToExploreShowcase)
    .filter((s) => s.id && s.title);
}

function normSlide(r: Record<string, unknown>): IExploreSlide {
  return {
    id: String(r.slide_id ?? r.id ?? ''),
    title: String(r.title ?? ''),
    subtitle: String(r.subtitle ?? ''),
    code: String(r.code ?? ''),
  };
}

export async function fetchExplorePageData(): Promise<IExplorePageData> {
  const [pdRes, pmRes, idRes, mtRes, exploreRes, slidesRes] = await Promise.allSettled([
    showcasesApi.list('PD'),
    showcasesApi.list('PM'),
    showcasesApi.list('ID'),
    showcasesApi.list('MT'),
    frontendApi.getExplore(),
    promoSlidesApi.list(),
  ]);

  const pdShowcases = pdRes.status === 'fulfilled' ? mapExploreShowcaseList(pdRes.value) : [];
  const pmShowcases = pmRes.status === 'fulfilled' ? mapExploreShowcaseList(pmRes.value) : [];
  const idShowcases = idRes.status === 'fulfilled' ? mapExploreShowcaseList(idRes.value) : [];
  const mtShowcases = mtRes.status === 'fulfilled' ? mapExploreShowcaseList(mtRes.value) : [];

  let promoCodes: IExploreSlide[] = [];
  if (exploreRes.status === 'fulfilled') {
    const c = (
      Array.isArray(exploreRes.value.promo_codes) ? exploreRes.value.promo_codes : []
    ) as Record<string, unknown>[];
    promoCodes = c.map(normSlide).filter((v) => v.id && v.title);
  }

  let promoSlides: IExploreSlide[] = [];
  if (slidesRes.status === 'fulfilled') {
    const arr = (Array.isArray(slidesRes.value) ? slidesRes.value : []) as Record<string, unknown>[];
    promoSlides = arr.map(normSlide).filter((s) => s.id && s.title);
  }

  return { pdShowcases, pmShowcases, idShowcases, mtShowcases, promoSlides, promoCodes };
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
