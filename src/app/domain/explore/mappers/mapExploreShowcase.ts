import { showcasesExploreApi, promoSlidesApi } from '@/services/api/exploreApi';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import {
  EMPTY_EXPLORE_PAGE_DATA,
  type IExploreArticle,
  type IExplorePageData,
  type IExploreShowcase,
  type IExploreSlide,
} from '@/domain/explore/types/explore.model';
import type { IExploreShowcaseResponse, IPromoSlideResponse } from '@/services/api/types/explore.types';

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
    leadTime: s.leadTime,
    tags: s.tags,
  };
}

function mapShowcaseList(rows: IExploreShowcaseResponse[]): IExploreShowcase[] {
  return rows.map(mapRowToExploreShowcase).filter((s) => s.id && s.title);
}

function normSlide(r: IPromoSlideResponse | Record<string, unknown>): IExploreSlide {
  return {
    id: String((r as IPromoSlideResponse).slide_id ?? (r as Record<string, unknown>).id ?? ''),
    title: String((r as IPromoSlideResponse).title ?? (r as Record<string, unknown>).title ?? ''),
    subtitle: String((r as Record<string, unknown>).subtitle ?? ''),
    code: String((r as Record<string, unknown>).code ?? ''),
    image: String((r as IPromoSlideResponse).image_url ?? (r as Record<string, unknown>).image ?? ''),
    linkTo: String((r as IPromoSlideResponse).link_to ?? (r as Record<string, unknown>).linkTo ?? ''),
  };
}

export async function fetchExplorePageData(): Promise<IExplorePageData> {
  // Phase 2 — above fold (PD+MT, PM parallel กับ phase 3)
  // Phase 3 — below fold (PM, ID, promo-slides)
  // รวมเป็น 4 calls parallel เพื่อให้ simple ก่อน
  const [pdRes, mtRes, pmRes, idRes, slidesRes] = await Promise.allSettled([
    showcasesExploreApi.listByTypes(['PD'], 15),
    showcasesExploreApi.listByTypes(['MT'], 15),
    showcasesExploreApi.listByTypes(['PM'], 15),
    showcasesExploreApi.listByTypes(['ID'], 15),
    promoSlidesApi.list(5),
  ]);

  const pdData = pdRes.status === 'fulfilled' ? pdRes.value : {};
  const pdShowcases = mapShowcaseList(Array.isArray(pdData?.PD) ? pdData.PD! : []);

  const mtData = mtRes.status === 'fulfilled' ? mtRes.value : {};
  const mtShowcases = mapShowcaseList(Array.isArray(mtData?.MT) ? mtData.MT! : []);

  const pmData = pmRes.status === 'fulfilled' ? pmRes.value : {};
  const pmShowcases = mapShowcaseList(Array.isArray(pmData?.PM) ? pmData.PM! : []);

  const idData = idRes.status === 'fulfilled' ? idRes.value : {};
  const idShowcases = mapShowcaseList(Array.isArray(idData?.ID) ? idData.ID! : []);

  let promoSlides: IExploreSlide[] = [];
  if (slidesRes.status === 'fulfilled') {
    const arr = Array.isArray(slidesRes.value) ? slidesRes.value : [];
    promoSlides = arr.map(normSlide).filter((s) => s.id && s.title);
  }

  return { pdShowcases, pmShowcases, idShowcases, mtShowcases, promoSlides, promoCodes: [] };
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
