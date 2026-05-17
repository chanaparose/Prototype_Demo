import { useMemo, useState } from 'react';
import { useData } from '@/stores/useDataStore';
import {
  exploreShowcaseToArticle,
  type IExploreShowcase,
} from '@/domain/explore/mappers/mapExploreShowcase';
import { useExplorePageDataQuery } from '@/domain/explore/queries/useExplorePageDataQuery';
import { useExploreCategoriesFromApi } from '@/hooks/useExploreCategoriesFromApi';
import {
  mergeCategoryLists,
  type ExploreCategoryItem,
} from '@/utils/exploreCategoriesFromApi';

type UseExploreDataOptions = { enablePageApis?: boolean };

export type { IExploreShowcase };

export function useExploreData(options?: UseExploreDataOptions) {
  const { categories, isLoading: dataLoading } = useData();
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

  const bootstrapCategories = useMemo<ExploreCategoryItem[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: null,
      })),
    [categories],
  );

  const exploreCategoriesMerged = useMemo(
    () => mergeCategoryLists(exploreCategoriesFromApi, bootstrapCategories),
    [exploreCategoriesFromApi, bootstrapCategories],
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
    categories,
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
