import { useMemo, useState } from 'react';
import { useData } from '@/stores/useDataStore';
import {
  mapStoreCategoriesToExplore,
  mapStoreFactoriesToExplore,
} from '@/domain/explore/mappers/mapExploreCategory';
import { exploreShowcaseToArticle } from '@/domain/explore/mappers/mapExploreShowcase';
import type { IExploreCategory, IExploreShowcase } from '@/domain/explore/types/explore.model';
import { useExplorePageDataQuery } from '@/domain/explore/queries/useExplorePageDataQuery';
import { useExploreCategoriesFromApi } from '@/hooks/useExploreCategoriesFromApi';
import { mergeCategoryLists } from '@/utils/exploreCategoriesFromApi';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';

type UseExploreDataOptions = { enablePageApis?: boolean };

export type { IExploreCategory, IExploreShowcase, IExploreArticle, IExploreSlide } from '@/domain/explore/types/explore.model';

export function useExploreData(options?: UseExploreDataOptions) {
  const { categories, factories, isLoading: dataLoading } = useData();
  const enablePageApis = options?.enablePageApis ?? true;

  const [searchText, setSearchText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    merged: exploreCategoriesFromApi,
    loading: exploreCategoriesLoading,
    error: exploreCategoriesError,
    reload: reloadExploreCategories,
  } = useExploreCategoriesFromApi({ enabled: enablePageApis });

  const exploreQ = useExplorePageDataQuery(enablePageApis);
  const exploreData = exploreQ.data;

  const exploreBootstrapCategories = useMemo<IExploreCategory[]>(
    () => mapStoreCategoriesToExplore(categories),
    [categories],
  );

  const exploreFactories = useMemo<FactoryItem[]>(
    () => mapStoreFactoriesToExplore(factories),
    [factories],
  );

  const exploreCategoriesMerged = useMemo(
    () => mergeCategoryLists(exploreCategoriesFromApi, exploreBootstrapCategories),
    [exploreCategoriesFromApi, exploreBootstrapCategories],
  );

  const productShowcases = useMemo<IExploreShowcase[]>(
    () => exploreData?.pdShowcases ?? [],
    [exploreData?.pdShowcases],
  );

  const promotionShowcases = useMemo<IExploreShowcase[]>(
    () => exploreData?.pmShowcases ?? [],
    [exploreData?.pmShowcases],
  );

  const materialShowcases = useMemo<IExploreShowcase[]>(
    () => exploreData?.mtShowcases ?? [],
    [exploreData?.mtShowcases],
  );

  const showcases = useMemo<IExploreShowcase[]>(() => {
    const merged = [...productShowcases, ...promotionShowcases, ...materialShowcases];
    const byId = new Map<string, IExploreShowcase>();
    for (const s of merged) {
      if (!byId.has(s.id)) byId.set(s.id, s);
    }
    return [...byId.values()];
  }, [productShowcases, promotionShowcases, materialShowcases]);

  const ideaArticles = useMemo(
    () => (exploreData?.idShowcases ?? []).map(exploreShowcaseToArticle),
    [exploreData?.idShowcases],
  );

  const promoSlides = exploreData?.promoSlides ?? [];

  const isLoading =
    dataLoading || (enablePageApis && (exploreQ.isFetching || exploreCategoriesLoading));

  return {
    searchText,
    setSearchText,
    copiedId,
    setCopiedId,
    exploreBootstrapCategories,
    exploreFactories,
    ideaArticles,
    showcases,
    productShowcases,
    promotionShowcases,
    materialShowcases,
    promoSlides,
    exploreCategoriesMerged,
    exploreCategoriesLoading,
    exploreCategoriesError,
    reloadExploreCategories,
    isLoading,
  };
}
