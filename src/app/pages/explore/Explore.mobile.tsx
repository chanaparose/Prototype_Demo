import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { ExplorePromoCarousel } from '@/components/features/explore/ExplorePromoCarousel';
import { ExploreScopeTabs } from '@/components/features/explore/ExploreScopeTabs';
import { ExploreHubShowcaseSections } from '@/components/features/explore/ExploreHubShowcaseSections';
import { ExploreCategoryChipsSection } from '@/components/features/explore/ExploreCategoryChipsSection';
import { ExploreFactoryShowcase } from '@/components/features/explore/ExploreFactoryShowcase';
import { ExploreFooter } from '@/components/features/explore/ExploreFooter';
import { HowToOrderSection } from '@/components/features/explore/HowToOrderSection';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { flattenHubCategories } from '@/components/features/explore/exploreCategoryUtils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import { ExploreFactoryRegisterCta } from '@/components/features/explore/ExploreFactoryRegisterCta';
import type { IExploreSlide } from '@/domain/explore/types/explore.model';
import { useFavorites } from '@/hooks/useFavorites';
import { FactoryCarouselCardSkeleton } from '@/components/skeletons/PageSkeletons';

type ExploreMobileProps = {
  factories: FactoryItem[];
  explorePromoCodes: IExploreSlide[];
  promoSlides: IExploreSlide[];
  isLoading?: boolean;
};

export function ExploreMobile({
  factories,
  explorePromoCodes,
  promoSlides,
  isLoading = false,
}: ExploreMobileProps) {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const [activeScope, setActiveScope] = useState<HubScope>('PD');
  const [scopeTabsPinned, setScopeTabsPinned] = useState(false);
  const scopeTabsAnchorRef = useRef<HTMLDivElement>(null);
  const hubsQ = useLbiHubsQuery();

  useEffect(() => {
    let frame = 0;

    const updatePinnedState = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const anchorTop = scopeTabsAnchorRef.current?.getBoundingClientRect().top;
        if (anchorTop == null) return;
        const nextPinned = anchorTop <= 56;
        setScopeTabsPinned((current) => (current === nextPinned ? current : nextPinned));
      });
    };

    updatePinnedState();
    window.addEventListener('scroll', updatePinnedState, { passive: true });
    window.addEventListener('resize', updatePinnedState, { passive: true });
    window.visualViewport?.addEventListener('resize', updatePinnedState, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updatePinnedState);
      window.removeEventListener('resize', updatePinnedState);
      window.visualViewport?.removeEventListener('resize', updatePinnedState);
    };
  }, []);

  const hubs = useMemo(
    () => (hubsQ.data ?? []).filter((hub) => hub.scope === activeScope),
    [activeScope, hubsQ.data],
  );

  const categories = useMemo(
    () => flattenHubCategories(hubs, activeScope),
    [hubs, activeScope],
  );

  const factoryPreview = useMemo(() => factories.slice(0, 8), [factories]);

  return (
    <div className='md:hidden pt-4 space-y-5'>
      <div className='mx-4 relative rounded-2xl overflow-hidden h-[115px] shadow-md'>
        <ImageWithFallback
          src='/assets/tryly-banner-final.png'
          alt='Tryly banner'
          className='block h-full w-full object-cover object-[center_calc(50%)]'
        />
      </div>

      <ExplorePromoCarousel promoSlides={promoSlides} promoCodes={explorePromoCodes} />

      <div className='relative'>
        <div ref={scopeTabsAnchorRef} className='absolute inset-x-0 top-0 h-0' aria-hidden='true' />
        <div className='h-11 bg-white'>
          {!scopeTabsPinned ? (
            <ExploreScopeTabs activeScope={activeScope} onScopeChange={setActiveScope} />
          ) : null}
        </div>
        {scopeTabsPinned
          ? createPortal(
              <div className='fixed inset-x-0 top-14 z-40 h-11 bg-white shadow-[0_1px_0_rgba(148,163,184,0.22)] [backface-visibility:hidden] [transform:translateZ(0)]'>
                <ExploreScopeTabs activeScope={activeScope} onScopeChange={setActiveScope} />
              </div>,
              document.body,
            )
          : null}
      </div>

      <ExploreHubShowcaseSections
        activeScope={activeScope}
        hubs={hubs}
        hubsLoading={hubsQ.isLoading}
        isLiked={isLiked}
        onToggleFavorite={toggleFavorite}
        variant='mobile'
      />

      <ExploreCategoryChipsSection
        activeScope={activeScope}
        categories={categories}
        isLoading={hubsQ.isLoading}
      />

      <HowToOrderSection className='mx-4 mt-7' variant='mobile' />

      <div className='mt-7'>
        {isLoading ? (
          <section className='mx-4 mb-5 mt-7'>
            <div className='flex items-end justify-between mb-3 px-1'>
              <div>
                <div className='h-5 w-28 bg-gray-200 rounded animate-pulse mb-1' />
                <div className='h-3 w-44 bg-gray-100 rounded animate-pulse' />
              </div>
            </div>
            <div className='flex gap-3 overflow-x-hidden pb-2'>
              {[...Array(2)].map((_, i) => (
                <FactoryCarouselCardSkeleton key={i} variant='mobile' />
              ))}
            </div>
          </section>
        ) : factoryPreview.length > 0 ? (
          <ExploreFactoryShowcase
            factories={factoryPreview}
            title='โรงงานแนะนำ'
            subtitle='โรงงานที่ผ่านการยืนยัน พร้อมรับผลิตสินค้าคุณภาพสูง'
            onFactoryClick={(id) => navigate(`/factories/${id}`)}
            onSeeAll={() => navigate('/factory-ideas?type=factory')}
            variant='mobile'
          />
        ) : null}
      </div>

      <ExploreFactoryRegisterCta onRegister={() => navigate('/register?tab=ft')} />

      <ExploreFooter />
    </div>
  );
}
