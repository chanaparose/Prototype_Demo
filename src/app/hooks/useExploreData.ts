import React from 'react';
import { useData } from '../contexts/DataContext';
import { frontendApi, promoSlidesApi } from '../services/api';
import { useExploreCategoriesFromApi } from './useExploreCategoriesFromApi';

type UseExploreDataOptions = { enablePageApis?: boolean };

export function useExploreData(options?: UseExploreDataOptions) {
  const enablePageApis = options?.enablePageApis !== false;
  const data = useData();
  const {
    merged: exploreCategoriesMerged,
    loading: exploreCategoriesLoading,
    error: exploreCategoriesError,
    reload: reloadExploreCategories,
  } = useExploreCategoriesFromApi({ enabled: enablePageApis });
  const [searchText, setSearchText] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Explore-specific data from dedicated endpoints
  const [exploreProducts, setExploreProducts] = React.useState<unknown[]>([]);
  const [explorePromotions, setExplorePromotions] = React.useState<unknown[]>([]);
  const [explorePromoCodes, setExplorePromoCodes] = React.useState<unknown[]>([]);
  const [promoSlides, setPromoSlides] = React.useState<unknown[]>([]);

  React.useEffect(() => {
    if (!enablePageApis) {
      setExploreProducts([]);
      setExplorePromotions([]);
      setExplorePromoCodes([]);
      setPromoSlides([]);
      return;
    }

    let cancelled = false;

    async function fetchExploreData() {
      try {
        // Try the aggregated explore endpoint first
        const exploreData = await frontendApi.getExplore();
        if (cancelled) return;
        setExploreProducts(exploreData.products ?? []);
        setExplorePromotions(exploreData.promotions ?? []);
        setExplorePromoCodes(exploreData.promo_codes ?? []);
      } catch {
        // Fallback: fetch individual endpoints
        try {
          const [products, promotions, promoCodes] = await Promise.allSettled([
            frontendApi.getProducts(),
            frontendApi.getPromotions(),
            frontendApi.getPromoCodes(),
          ]);
          if (cancelled) return;
          if (products.status === 'fulfilled') setExploreProducts(products.value);
          if (promotions.status === 'fulfilled') setExplorePromotions(promotions.value);
          if (promoCodes.status === 'fulfilled') setExplorePromoCodes(promoCodes.value);
        } catch {
          // silently fail — data will remain empty
        }
      }

      // Fetch promo slides separately
      try {
        const slides = await promoSlidesApi.list();
        if (!cancelled) setPromoSlides(slides);
      } catch {
        // fallback: keep empty
      }
    }

    fetchExploreData();
    return () => { cancelled = true; };
  }, [enablePageApis]);

  const activeRFQs = React.useMemo(
    () => data.rfqs.filter((r) => r.status !== 'completed'),
    [data.rfqs],
  );

  const recentOrders = React.useMemo(
    () => data.orders.filter((o) => o.status !== 'completed').slice(0, 2),
    [data.orders],
  );

  return {
    // state
    searchText,
    setSearchText,
    copiedId,
    setCopiedId,

    // derived data
    activeRFQs,
    recentOrders,

    // raw data from DataContext
    currentUser: data.currentUser,
    factories: data.factories,
    rfqs: data.rfqs,
    orders: data.orders,
    categories: data.categories,
    ideaArticles: data.ideaArticles,
    factoryShowcases: data.factoryShowcases,

    // explore-specific data from API
    exploreProducts,
    explorePromotions,
    explorePromoCodes,
    promoSlides,

    exploreCategoriesMerged,
    exploreCategoriesLoading,
    exploreCategoriesError,
    reloadExploreCategories,

    // loading state
    isLoading: data.isLoading,
  };
}
