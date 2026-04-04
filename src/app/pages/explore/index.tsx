import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useExploreData } from '../../hooks/useExploreData';
import { useManualApiPageGate } from '../../hooks/useManualApiPageGate';
import { ManualApiDevGate } from '../../components/shared/ManualApiDevGate';
import { ExploreMobile } from './Explore.mobile';
import { ExploreDesktop } from './Explore.desktop';

export function Explore() {
  const isDesktop = useIsDesktop();
  const { showGate, pageApisReady, setPageApisReady } = useManualApiPageGate();
  const {
    searchText,
    setSearchText,
    copiedId,
    setCopiedId,
    factories,
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

