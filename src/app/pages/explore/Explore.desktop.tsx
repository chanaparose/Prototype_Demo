import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ExploreFooter } from '@/components/features/explore/ExploreFooter';
import { HowToOrderSection } from '@/components/features/explore/HowToOrderSection';
import { ExploreFactoryShowcase } from '@/components/features/explore/ExploreFactoryShowcase';
import { ExploreScopeTabs } from '@/components/features/explore/ExploreScopeTabs';
import { ExploreHubShowcaseSections } from '@/components/features/explore/ExploreHubShowcaseSections';
import { ExploreCategoryChipsSection } from '@/components/features/explore/ExploreCategoryChipsSection';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { flattenHubCategories } from '@/components/features/explore/exploreCategoryUtils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import { ExploreFactoryRegisterCta } from '@/components/features/explore/ExploreFactoryRegisterCta';
import { useFavorites } from '@/hooks/useFavorites';
import { FactoryCarouselCardSkeleton } from '@/components/skeletons/PageSkeletons';

type ExploreDesktopProps = {
  factories: FactoryItem[];
  isLoading?: boolean;
};

export function ExploreDesktop({
  factories,
  isLoading = false,
}: Readonly<ExploreDesktopProps>) {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const [activeScope, setActiveScope] = useState<HubScope>('PD');
  const hubsQ = useLbiHubsQuery();

  const hubs = useMemo(
    () => (hubsQ.data ?? []).filter((hub) => hub.scope === activeScope),
    [activeScope, hubsQ.data],
  );

  const categories = useMemo(
    () => flattenHubCategories(hubs, activeScope),
    [hubs, activeScope],
  );

  const factoryPreview = useMemo(() => factories.slice(0, 6), [factories]);

  return (
    <div className='hidden md:block min-h-screen'>
      <div className='px-4 md:px-6 lg:px-8 2xl:px-10 py-4 lg:py-5 space-y-8 pb-0 w-full mx-auto'>
        <section className='relative rounded-2xl overflow-hidden h-[180px] 2xl:h-[220px] shadow-lg'>
          <ImageWithFallback
            src='assets/tryly_banner_slim.png'
            alt='Tryly banner'
            className='block xl:hidden h-full w-full object-cover object-[center_45%]'
          />
          <ImageWithFallback
            src='assets/tryly_banner_desktop_final_v4.png'
            alt='Tryly banner'
            className='hidden xl:block h-full w-full object-cover object-[center_53%]'
          />
        </section>

        <ExploreScopeTabs activeScope={activeScope} onScopeChange={setActiveScope} />

        <ExploreHubShowcaseSections
          activeScope={activeScope}
          hubs={hubs}
          hubsLoading={hubsQ.isLoading}
          isLiked={isLiked}
          onToggleFavorite={toggleFavorite}
          variant='desktop'
        />

        <ExploreCategoryChipsSection
          activeScope={activeScope}
          categories={categories}
          isLoading={hubsQ.isLoading}
        />

        <HowToOrderSection className='mx-0' variant='desktop' />

        <div className='pt-1'>
          {isLoading ? (
            <section>
              <div className='flex items-end justify-between mb-3 px-1'>
                <div>
                  <div className='h-5 w-28 bg-gray-200 rounded animate-pulse mb-1' />
                  <div className='h-3 w-52 bg-gray-100 rounded animate-pulse' />
                </div>
              </div>
              <div className='flex gap-3 overflow-x-hidden pb-2'>
                {[...Array(3)].map((_, i) => (
                  <FactoryCarouselCardSkeleton key={i} variant='desktop' />
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
              variant='desktop'
            />
          ) : null}
        </div>

        <ExploreFactoryRegisterCta
          variant='desktop'
          onRegister={() => navigate('/register?tab=ft')}
        />
      </div>

      <div className='lg:px-8 2xl:px-10'>
        <ExploreFooter />
      </div>
    </div>
  );
}
