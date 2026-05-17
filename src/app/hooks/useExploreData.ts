import React from 'react';
import { useExploreCategoriesFromApi } from '@/hooks/useExploreCategoriesFromApi';
import {
  EMPTY_EXPLORE_PAGE_DATA,
  exploreShowcaseToArticle,
  type ExploreShowcase,
} from '@/domain/explore/mappers/mapExploreShowcase';
import { useExplorePageDataQuery } from '@/domain/explore/queries/useExplorePageDataQuery';

type UseExploreDataOptions = { enablePageApis?: boolean };

export type { ExploreShowcase };

export function useExploreData(options?: UseExploreDataOptions) {
  const enablePageApis = options?.enablePageApis !== false;
  const {
    merged: exploreCategoriesMerged,
    loading: exploreCategoriesLoading,
    error: exploreCategoriesError,
    reload: reloadExploreCategories,
  } = useExploreCategoriesFromApi({ enabled: enablePageApis });

  const [searchText, setSearchText] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const exploreQ = useExplorePageDataQuery(enablePageApis);
  const exploreData = exploreQ.data ?? EMPTY_EXPLORE_PAGE_DATA;
  const isLoading = exploreQ.isLoading;

  const { pdShowcases, pmShowcases, idShowcases, mtShowcases, promoSlides, promoCodes } =
    exploreData;

  const productShowcases = React.useMemo(() => pdShowcases, [pdShowcases]);
  const promotionShowcases = React.useMemo(() => pmShowcases, [pmShowcases]);
  const materialShowcases = React.useMemo(() => mtShowcases, [mtShowcases]);

  const ideaArticles = React.useMemo(
    () => idShowcases.map(exploreShowcaseToArticle),
    [idShowcases],
  );

  const showcases = React.useMemo(() => {
    const byId = new Map<string, ExploreShowcase>();
    for (const s of [...pdShowcases, ...pmShowcases, ...idShowcases, ...mtShowcases]) {
      if (!byId.has(s.id)) byId.set(s.id, s);
    }
    return [...byId.values()];
  }, [pdShowcases, pmShowcases, idShowcases, mtShowcases]);

  const allPromoSlides = React.useMemo(() => {
    const merged = [...promoSlides, ...promoCodes];
    const seen = new Set<string>();
    return merged.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [promoSlides, promoCodes]);

  return {
    searchText,
    setSearchText,
    copiedId,
    setCopiedId,

    ideaArticles,
    productShowcases,
    promotionShowcases,
    materialShowcases,
    showcases,
    promoSlides: allPromoSlides,

    categories: exploreCategoriesMerged,
    exploreCategoriesMerged,
    exploreCategoriesLoading,
    exploreCategoriesError,
    reloadExploreCategories,

    isLoading,
    refetchExplore: exploreQ.refetch,
  };
}
