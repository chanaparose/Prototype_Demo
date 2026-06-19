import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExploreFooter } from '@/components/features/explore/ExploreFooter';
import { HowToOrderSection } from '@/components/features/explore/HowToOrderSection';
import { ExploreFactoryShowcase } from '@/components/features/explore/ExploreFactoryShowcase';
import { ExploreHubPreview } from '@/components/features/explore/ExploreHubPreview';
import { ExploreProductCarouselSection } from '@/components/features/explore/ExploreProductCarouselSection';
import { useExploreHubFilteredContent } from '@/components/features/explore/useExploreHubFilteredContent';
import { useExploreHubSelection } from '@/components/features/explore/useExploreHubSelection';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import { ExploreFactoryRegisterCta } from '@/components/features/explore/ExploreFactoryRegisterCta';
import type { IExploreShowcase } from '@/domain/explore/types/explore.model';
import { useFavorites } from '@/hooks/useFavorites';
import { resolveUnitLabel } from '@/domain/master/mappers/mapMasterUnits';
import {
  ProductCardSkeleton,
  FactoryCarouselCardSkeleton,
} from '@/components/skeletons/PageSkeletons';

type ExploreDesktopProps = {
  factories: FactoryItem[];
  exploreProducts: IExploreShowcase[];
  exploreMatrials?: IExploreShowcase[];
  isLoading?: boolean;
};

export function ExploreDesktop({
  factories,
  exploreProducts,
  exploreMatrials,
  isLoading = false,
}: Readonly<ExploreDesktopProps>) {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const [activeScope, setActiveScope] = useState<HubScope>('PD');
  const {
    hubs,
    selectedHub,
    selectedHubId,
    setSelectedHubId,
    categoryIds,
    isLoading: hubsLoading,
  } = useExploreHubSelection(activeScope);

  const {
    showcases: scopedShowcases,
    factories: scopedFactories,
    showcaseTitle,
    factoryTitle,
    factorySubtitle,
    isHubScoped,
    hasHubFactories,
    factoriesLoading,
    seeMoreShowcaseHref,
    seeMoreFactoryHref,
  } = useExploreHubFilteredContent({
    activeScope,
    exploreProducts,
    exploreMatrials,
    factories,
    selectedHub,
    categoryIds,
    showcaseLimit: 6,
    factoryLimit: 6,
  });

  const productShowcases = useMemo(
    () =>
      (activeScope === 'PD' ? scopedShowcases : []).map((s) => ({
        id: s.id,
        title: s.title,
        price: `MOQ ${s.minOrder}`,
        img: s.image,
        category: s.category,
        subCategoryName: s.subCategoryName,
        factoryId: s.factoryId,
        factoryName: s.factoryName,
        minOrder: s.minOrder,
        minOrderUnit: resolveUnitLabel(s.unitId, s.moqUnit),
        factoryRating: s.factoryRating,
        location: s.location,
      })),
    [activeScope, scopedShowcases],
  );

  const materialShowcases = useMemo(
    () =>
      (activeScope === 'MT' ? scopedShowcases : []).map((s) => ({
        id: s.id,
        title: s.title,
        price: `MOQ ${s.minOrder}`,
        img: s.image,
        category: s.category,
        subCategoryName: s.subCategoryName,
        factoryId: s.factoryId,
        factoryName: s.factoryName,
        minOrder: s.minOrder,
        minOrderUnit: resolveUnitLabel(s.unitId, s.moqUnit),
        factoryRating: s.factoryRating,
        location: s.location,
      })),
    [activeScope, scopedShowcases],
  );

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

        <div className='flex flex-wrap items-center justify-end gap-2'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/create-rfq')}
            className='rounded-xl border border-brand-orange/30 bg-white px-4 py-2 text-xs font-semibold text-brand-orange shadow-sm hover:bg-orange-50 transition-colors'
          >
            สร้าง RFQ
          </Button>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate(`/factory-ideas-hub?scope=${activeScope}`)}
            className='rounded-xl border border-brand-purple/25 bg-white px-4 py-2 text-xs font-semibold text-brand-purple shadow-sm hover:bg-[var(--brand-lavender-chip)] transition-colors'
          >
            ดูหมวดทั้งหมด
          </Button>
        </div>

        <ExploreHubPreview
          activeScope={activeScope}
          onScopeChange={setActiveScope}
          hubs={hubs}
          selectedHub={selectedHub}
          selectedHubId={selectedHubId}
          onSelectedHubChange={setSelectedHubId}
          isLoading={hubsLoading}
        />

        {activeScope === 'PD' ? (
          <div data-tour='products' className='pt-1'>
            {isLoading ? (
              <div className='mt-[30px]'>
                <div className='h-5 w-32 bg-gray-200 rounded animate-pulse mb-3' />
                <div className='flex gap-3 overflow-x-hidden'>
                  {[...Array(5)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : (
              <ExploreProductCarouselSection
                title={showcaseTitle}
                items={productShowcases}
                bannerImg='assets/tryly_vertical_banner_v5_oval_final.png'
                bannerText='คุ้มค่า ถูกใจสัตว์เลี้ยง'
                seeMoreHref={seeMoreShowcaseHref}
                onItemClick={(id) =>
                  navigate(`/product-detail?showcase_id=${encodeURIComponent(id)}`)
                }
                isLiked={isLiked}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </div>
        ) : null}

        {activeScope === 'MT' ? (
          isLoading ? (
            <div className='pt-1'>
              <div className='h-5 w-32 bg-gray-200 rounded animate-pulse mb-3' />
              <div className='flex gap-3 overflow-x-hidden'>
                {[...Array(5)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <ExploreProductCarouselSection
              title={showcaseTitle}
              theme='material'
              seeMoreHref={seeMoreShowcaseHref}
              items={materialShowcases}
              bannerImg='assets/tryly_vertical_banner_raw_material_v5_oval_final.png'
              bannerText='วัตถุดิบคุณภาพสูง'
              onItemClick={(id) =>
                navigate(`/product-detail?showcase_id=${encodeURIComponent(id)}`)
              }
              isLiked={isLiked}
              onToggleFavorite={toggleFavorite}
            />
          )
        ) : null}

        <HowToOrderSection className='mx-0' variant='desktop' />

        <div className='pt-1'>
          {isLoading || factoriesLoading ? (
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
          ) : hasHubFactories ? (
            <ExploreFactoryShowcase
              factories={scopedFactories}
              title={factoryTitle}
              subtitle={factorySubtitle}
              onFactoryClick={(id) => navigate(`/factories/${id}`)}
              onSeeAll={() => navigate(seeMoreFactoryHref)}
              variant='desktop'
            />
          ) : isHubScoped ? (
            <section>
              <div className='mb-3 px-1'>
                <h3 className='text-[15px] font-bold text-brand-navy-ink'>{factoryTitle}</h3>
                <p className='mt-0.5 text-xs text-gray-500'>{factorySubtitle}</p>
              </div>
              <div className='rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-6 py-8 text-center'>
                <p className='text-sm font-medium text-gray-600'>
                  ยังไม่มีโรงงานแนะนำในหมวด {selectedHub?.name ?? ''}
                </p>
                <p className='mt-1 text-xs text-gray-400'>
                  ลองดูโรงงานทั้งหมดในหมวดนี้ได้จากปุ่มด้านล่าง
                </p>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => navigate(seeMoreFactoryHref)}
                  className='mt-4 inline-flex items-center gap-1 rounded-full border border-brand-purple/30 bg-white px-5 py-2 text-sm font-medium text-brand-purple hover:bg-brand-panel-hover transition-colors'
                >
                  ดูโรงงานใน {selectedHub?.name ?? 'หมวดนี้'}
                  <ChevronRight size={14} />
                </Button>
              </div>
            </section>
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
