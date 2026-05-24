import { useMemo, useState } from 'react';
import { exploreShowcaseToArticle } from '@/domain/explore/mappers/mapExploreShowcase';
import type { IExploreCategory, IExploreShowcase } from '@/domain/explore/types/explore.model';
import { useExplorePageDataQuery } from '@/domain/explore/queries/useExplorePageDataQuery';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';

type UseExploreDataOptions = { enablePageApis?: boolean };

export type {
  IExploreCategory,
  IExploreShowcase,
  IExploreArticle,
  IExploreSlide,
} from '@/domain/explore/types/explore.model';

export function useExploreData(options?: UseExploreDataOptions) {
  const enablePageApis = options?.enablePageApis ?? true;

  const [searchText, setSearchText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const exploreQ = useExplorePageDataQuery(enablePageApis);
  const exploreData = exploreQ.data;

  // categories come from the /explore response — no separate API call needed
  const exploreCategoriesMerged = useMemo<IExploreCategory[]>(
    () => exploreData?.categories ?? [],
    [exploreData?.categories],
  );

  // factories are not part of explore anymore (heavy data — load separately if needed)
  const exploreFactories: FactoryItem[] = [];

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

  const isLoading = enablePageApis && exploreQ.isFetching;
  const exploreCategoriesLoading = isLoading;
  const exploreCategoriesError = exploreQ.error ? String(exploreQ.error) : null;
  const reloadExploreCategories = () => {
    void exploreQ.refetch();
  };

  return {
    searchText,
    setSearchText,
    copiedId,
    setCopiedId,
    exploreBootstrapCategories: exploreCategoriesMerged,
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
