import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { ExploreFooter } from '@/components/features/explore/ExploreFooter';
import { HowToOrderSection } from '@/components/features/explore/HowToOrderSection';
import { ExploreFactoryShowcase } from '@/components/features/explore/ExploreFactoryShowcase';
import { ExploreHubPreview } from '@/components/features/explore/ExploreHubPreview';
import { ExploreProductCarouselSection } from '@/components/features/explore/ExploreProductCarouselSection';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import { Image } from '@/components/ui/image';
import type { IExploreShowcase } from '@/domain/explore/types/explore.model';
import { useFavorites } from '@/hooks/useFavorites';
import { resolveUnitLabel } from '@/domain/master/mappers/mapMasterUnits';
import { ProductCardSkeleton, FactoryCarouselCardSkeleton } from '@/components/skeletons/PageSkeletons';

type ExploreDesktopProps = {
  factories: FactoryItem[];
  exploreProducts: IExploreShowcase[];
  exploreMatrials?: IExploreShowcase[];
  isLoading?: boolean;
};

const REGISTER_BUTTON_CLASS = cn(
  'group relative shrink-0 inline-flex items-center gap-1.5 xl:gap-2',
  'max-xl:px-4 max-xl:py-2 xl:px-7 xl:py-2.5 rounded-xl',
  'text-white font-bold text-xs xl:text-sm whitespace-nowrap',
  'bg-gradient-to-r from-brand-purple via-brand-purple-hover to-brand-violet-deep',
  'shadow-lg shadow-brand-purple/40 ring-1 ring-white/20',
  'transition-all duration-200 ease-out',
  'hover:shadow-xl hover:shadow-brand-purple/60 hover:-translate-y-0.5 hover:brightness-110',
  'active:translate-y-0 active:scale-[0.97]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-purple',
);

export function ExploreDesktop({
  factories,
  exploreProducts,
  exploreMatrials,
  isLoading = false,
}: Readonly<ExploreDesktopProps>) {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const [activeScope, setActiveScope] = useState<HubScope>('PD');
  const recommendedFactories = useMemo(() => (factories ?? []).slice(0, 6), [factories]);

  const productShowcases = useMemo(
    () =>
      (exploreProducts ?? []).slice(0, 6).map((s) => ({
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
    [exploreProducts],
  );

  const materialShowcases = useMemo(
    () =>
      (exploreMatrials ?? []).slice(0, 6).map((s) => ({
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
    [exploreMatrials],
  );

  return (
    <div className='hidden md:block min-h-screen'>
      <div className='px-4 md:px-6 lg:px-8 2xl:px-10 py-3 lg:py-4 space-y-6 pb-0 w-full mx-auto'>
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

        <ExploreHubPreview activeScope={activeScope} onScopeChange={setActiveScope} />

        {activeScope === 'PD' ? (
          <div data-tour='products'>
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
                title='สินค้าแนะนำ'
                items={productShowcases}
                bannerImg='assets/tryly_vertical_banner_v5_oval_final.png'
                bannerText='คุ้มค่า ถูกใจสัตว์เลี้ยง'
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
            <div>
              <div className='h-5 w-32 bg-gray-200 rounded animate-pulse mb-3' />
              <div className='flex gap-3 overflow-x-hidden'>
                {[...Array(5)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <ExploreProductCarouselSection
              title='วัตถุดิบแนะนำ'
              theme='material'
              seeMoreHref='/factory-ideas?type=material'
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

        <div>
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
          ) : (
            <ExploreFactoryShowcase
              factories={recommendedFactories}
              onFactoryClick={(id) => navigate(`/factories/${id}`)}
              onSeeAll={() => navigate('/factory-ideas?type=factory')}
              variant='desktop'
            />
          )}
        </div>

        <section className='rounded-xl overflow-hidden border border-brand-purple/30 shadow-sm relative py-5 px-4 md:px-8'>
          <Image
            src='assets/tryly_banner_v9.png'
            alt=''
            className='hidden xl:block absolute inset-0 w-full h-full object-cover pointer-events-none'
          />
          <div className='hidden xl:block absolute inset-0 bg-gradient-to-l from-white/55 via-white/10 to-transparent pointer-events-none' />

          <Image
            src='assets/tryly_tablet_banner.png'
            alt=''
            className='xl:hidden relative z-0 w-full h-auto object-contain object-center pointer-events-none select-none'
          />

          <div className='z-10 flex justify-end items-center w-full xl:relative xl:mt-0 max-xl:absolute max-xl:w-auto max-xl:left-auto max-xl:right-4 max-xl:bottom-4 md:max-xl:right-8 md:max-xl:bottom-5'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/register?tab=ft')}
              className={REGISTER_BUTTON_CLASS}
            >
              <Sparkles
                size={14}
                className='text-white/90 group-hover:rotate-12 transition-transform duration-200'
              />
              <span>สมัครเลย</span>
              <ChevronRight
                size={14}
                className='text-white/90 group-hover:translate-x-1 transition-transform duration-200'
              />
              <span
                aria-hidden
                className='pointer-events-none absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors'
              />
            </Button>
          </div>
        </section>
      </div>

      <div className='lg:px-8 2xl:px-10'>
        <ExploreFooter />
      </div>
    </div>
  );
}
