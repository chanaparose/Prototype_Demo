import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useExploreData } from '../../hooks/useExploreData';
import { useManualApiPageGate } from '../../hooks/useManualApiPageGate';
import { ManualApiDevGate } from '../../components/shared/ManualApiDevGate';
import { useData } from '../../contexts/DataContext';
import type { FactoryItem } from '../../components/features/explore/ExploreFactoryGrid';
import { ExploreMobile } from './Explore.mobile';
import { ExploreDesktop } from './Explore.desktop';

export function Explore() {
  const isDesktop = useIsDesktop();
  const { showGate, pageApisReady, setPageApisReady } = useManualApiPageGate();
  const data = useData();
  const {
    searchText,
    setSearchText,
    copiedId,
    setCopiedId,
    categories,
    ideaArticles,
    showcases,
    productShowcases,
    promotionShowcases,
    promoSlides,
    exploreCategoriesMerged,
    exploreCategoriesLoading,
    exploreCategoriesError,
    reloadExploreCategories,
  } = useExploreData({ enablePageApis: pageApisReady });

  /** การ์ดโรงงาน — จาก GET /frontend/bootstrap (DataContext) เท่านั้น */
  const factories = React.useMemo<FactoryItem[]>(
    () =>
      data.factories.map((f) => ({
        id: f.id,
        name: f.name,
        image: f.image,
        location: f.location,
        rating: f.rating,
        reviews: f.reviews,
        minOrder: f.minOrder,
        verified: f.verified,
      })),
    [data.factories],
  );

  if (showGate) {
    return <ManualApiDevGate pageLabel="Explore" onLoad={() => setPageApisReady(true)} />;
  }

  if (isDesktop) {
    return (
      <ExploreDesktop
        searchText={searchText}
        setSearchText={setSearchText}
        copiedId={copiedId}
        setCopiedId={setCopiedId}
        categories={categories as any}
        exploreCategoriesMerged={exploreCategoriesMerged as any}
        exploreCategoriesLoading={exploreCategoriesLoading}
        exploreCategoriesError={exploreCategoriesError}
        reloadExploreCategories={reloadExploreCategories}
        factories={factories as any}
        activeRFQs={[]}
        recentOrders={[]}
        ideaArticles={ideaArticles as any}
        factoryShowcases={showcases as any}
        exploreProducts={productShowcases as any}
        explorePromotions={promotionShowcases as any}
        explorePromoCodes={[]}
        promoSlides={promoSlides as any}
      />
    );
  }

  return (
    <ExploreMobile
      searchText={searchText}
      setSearchText={setSearchText}
      categories={categories as any}
      exploreCategoriesMerged={exploreCategoriesMerged as any}
      exploreCategoriesLoading={exploreCategoriesLoading}
      exploreCategoriesError={exploreCategoriesError}
      reloadExploreCategories={reloadExploreCategories}
      factories={factories as any}
      ideaArticles={ideaArticles as any}
      factoryShowcases={showcases as any}
      exploreProducts={productShowcases as any}
      explorePromotions={promotionShowcases as any}
      explorePromoCodes={[]}
      promoSlides={promoSlides as any}
    />
  );
}

