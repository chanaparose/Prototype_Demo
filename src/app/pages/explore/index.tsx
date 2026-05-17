import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useExploreData } from '@/hooks/useExploreData';
import { useManualApiPageGate } from '@/hooks/useManualApiPageGate';
import { ManualApiDevGate } from '@/components/shared/ManualApiDevGate';
import { useData } from '@/stores/useDataStore';
import { useAuth } from '@/stores/useAuthStore';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import { ExploreMobile } from '@/pages/explore/Explore.mobile';
import { ExploreDesktop } from '@/pages/explore/Explore.desktop';

export function Explore() {
  const isDesktop = useIsDesktop(768);
  const { showGate, pageApisReady, setPageApisReady } = useManualApiPageGate();
  const data = useData();
  const { isAuthenticated } = useAuth();
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
    materialShowcases,
    promoSlides,
    exploreCategoriesMerged,
    exploreCategoriesLoading,
    exploreCategoriesError,
    reloadExploreCategories,
    isLoading,
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
    return <ManualApiDevGate pageLabel='Explore' onLoad={() => setPageApisReady(true)} />;
  }

  const guestLoading = !isAuthenticated && isLoading;
  const connectBanner = guestLoading ? (
    <div className='mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3'>
      <span
        className='mt-0.5 inline-block h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin'
        aria-hidden
      />
      <div>
        <p className='text-sm font-semibold text-amber-700'>Guest View กำลังเชื่อมต่อเซิร์ฟเวอร์</p>
        <p className='text-xs text-amber-700/80'>
          รอสักครู่ก่อน คุณสามารถดูแท็บต่าง ๆ เช่น แนะนำโรงงานได้ทันทีเมื่อโหลดเสร็จ
        </p>
      </div>
    </div>
  ) : null;

  if (isDesktop) {
    return (
      <>
        {connectBanner}
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
          exploreMatrials={materialShowcases as any}
          explorePromoCodes={[]}
          promoSlides={promoSlides as any}
        />
      </>
    );
  }

  return (
    <>
      {connectBanner}
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
        exploreMatrials={materialShowcases as any}
        explorePromoCodes={[]}
        promoSlides={promoSlides as any}
      />
    </>
  );
}
