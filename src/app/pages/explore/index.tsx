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
    activeRFQs,
    recentOrders,
    factories,
    categories,
    ideaArticles,
    factoryShowcases,
    exploreProducts,
    explorePromotions,
    explorePromoCodes,
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
        activeRFQs={activeRFQs as any}
        recentOrders={recentOrders as any}
        ideaArticles={ideaArticles as any}
        factoryShowcases={factoryShowcases as any}
        exploreProducts={exploreProducts as any}
        explorePromotions={explorePromotions as any}
        explorePromoCodes={explorePromoCodes as any}
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
      factoryShowcases={factoryShowcases as any}
      exploreProducts={exploreProducts as any}
      explorePromotions={explorePromotions as any}
      explorePromoCodes={explorePromoCodes as any}
      promoSlides={promoSlides as any}
    />
  );
}

