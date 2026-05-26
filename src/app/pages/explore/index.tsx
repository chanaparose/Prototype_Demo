import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useExploreData } from '@/hooks/useExploreData';
import { useManualApiPageGate } from '@/hooks/useManualApiPageGate';
import { ManualApiDevGate } from '@/components/shared/ManualApiDevGate';
import { useAuth } from '@/stores/useAuthStore';
import { ExploreMobile } from '@/pages/explore/Explore.mobile';
import { ExploreDesktop } from '@/pages/explore/Explore.desktop';

export function Explore() {
  const isDesktop = useIsDesktop(768);
  const { showGate, pageApisReady, setPageApisReady } = useManualApiPageGate();
  const { isAuthenticated } = useAuth();
  const {
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
  } = useExploreData({ enablePageApis: pageApisReady });

  if (showGate) {
    return <ManualApiDevGate pageLabel='Explore' onLoad={() => setPageApisReady(true)} />;
  }

  const guestConnecting = !isAuthenticated && isLoading;

  if (isDesktop) {
    return (
      <ExploreDesktop
          searchText={searchText}
          setSearchText={setSearchText}
          copiedId={copiedId}
          setCopiedId={setCopiedId}
          categories={exploreBootstrapCategories}
          exploreCategoriesMerged={exploreCategoriesMerged}
          exploreCategoriesLoading={exploreCategoriesLoading}
          exploreCategoriesError={exploreCategoriesError}
          reloadExploreCategories={reloadExploreCategories}
          factories={exploreFactories}
          activeRFQs={[]}
          recentOrders={[]}
          ideaArticles={ideaArticles}
          factoryShowcases={showcases}
          exploreProducts={productShowcases}
          explorePromotions={promotionShowcases}
          exploreMatrials={materialShowcases}
          explorePromoCodes={[]}
          promoSlides={promoSlides}
          guestConnecting={guestConnecting}
        />
    );
  }

  return (
    <ExploreMobile
        searchText={searchText}
        setSearchText={setSearchText}
        categories={exploreBootstrapCategories}
        exploreCategoriesMerged={exploreCategoriesMerged}
        exploreCategoriesLoading={exploreCategoriesLoading}
        exploreCategoriesError={exploreCategoriesError}
        reloadExploreCategories={reloadExploreCategories}
        factories={exploreFactories}
        ideaArticles={ideaArticles}
        factoryShowcases={showcases}
        exploreProducts={productShowcases}
        explorePromotions={promotionShowcases}
        exploreMatrials={materialShowcases}
        explorePromoCodes={[]}
        promoSlides={promoSlides}
        isLoading={isLoading}
        guestConnecting={guestConnecting}
      />
  );
}
