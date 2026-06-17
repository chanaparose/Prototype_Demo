import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, ChevronRight, Leaf, MapPin, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExplorePromoCarousel } from '@/components/features/explore/ExplorePromoCarousel';
import { ExploreHubPreview } from '@/components/features/explore/ExploreHubPreview';
import { ExploreFactoryShowcase } from '@/components/features/explore/ExploreFactoryShowcase';
import { ExploreFooter } from '@/components/features/explore/ExploreFooter';
import { HowToOrderSection } from '@/components/features/explore/HowToOrderSection';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import { Image } from '@/components/ui/image';
import type { IExploreShowcase, IExploreSlide } from '@/domain/explore/types/explore.model';
import { useFavorites } from '@/hooks/useFavorites';
import { ProductCardSkeleton, FactoryCarouselCardSkeleton } from '@/components/skeletons/PageSkeletons';
import { resolveUnitLabel } from '@/domain/master/mappers/mapMasterUnits';

type ExploreMobileProps = {
  factories: FactoryItem[];
  exploreProducts: IExploreShowcase[];
  exploreMatrials?: IExploreShowcase[];
  explorePromoCodes: IExploreSlide[];
  promoSlides: IExploreSlide[];
  isLoading?: boolean;
};

export function ExploreMobile({
  factories,
  exploreProducts,
  exploreMatrials,
  explorePromoCodes,
  promoSlides,
  isLoading = false,
}: ExploreMobileProps) {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const [activeScope, setActiveScope] = useState<HubScope>('PD');

  const productShowcases = (exploreProducts ?? []).slice(0, 8);
  // const promoShowcases = (explorePromotions ?? []).slice(0, 4);
  const materialShowcases = (exploreMatrials ?? []).slice(0, 8);

  const hasProductShowcases = productShowcases.length > 0;
  // const hasPromoShowcases = promoShowcases.length > 0;
  const hasMaterialShowcases = materialShowcases.length > 0;

  return (
    <div className='md:hidden pt-4 space-y-3'>
      <div className='mx-4 relative rounded-2xl overflow-hidden h-[115px] shadow-md'>
        <ImageWithFallback
          src='/assets/tryly-banner-final.png'
          alt='Tryly banner'
          className='block h-full w-full object-cover object-[center_calc(50%)]'
        />
      </div>

       

      <ExplorePromoCarousel promoSlides={promoSlides} promoCodes={explorePromoCodes} />

      <ExploreHubPreview
        className='mt-[20px]'
        activeScope={activeScope}
        onScopeChange={setActiveScope}
      />

      {activeScope === 'PD' ? (
      <div data-tour='products' className='mb-3'>
        <div className='mt-[20px] flex items-center justify-between px-4 mb-2'>
          <h3 className='text-[14px] font-bold text-brand-navy-ink flex items-center gap-1.5'>
            <ShoppingBag size={15} className='text-brand-orange' /> สินค้าแนะนำ
          </h3>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/factory-ideas?type=product')}
            className='text-brand-orange text-[12px] font-medium flex items-center gap-0.5'
          >
            ดูเพิ่มเติม <ChevronRight size={13} />
          </Button>
        </div>

        {isLoading ? (
          <div
            className='flex gap-2 overflow-x-auto pb-2 pl-3'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            <div className='flex-shrink-0 w-3' aria-hidden />
          </div>
        ) : hasProductShowcases ? (
          <div
            className='flex gap-2 overflow-x-auto pb-2 pl-3'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {productShowcases.map((item) => (
              <div
                key={item.id}
                role='button'
                tabIndex={0}
                onClick={() =>
                  navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`);
                  }
                }}
                className='flex-shrink-0 w-[155px] bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col'
              >
                <div className='aspect-[4/3] relative overflow-hidden bg-gray-100'>
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  />
                  <div className='absolute top-1 left-2 bg-brand-orange px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-wide'>
                    สินค้า
                  </div>
                  <ShowcaseHeartButton
                    showcaseId={item.id}
                    isLiked={isLiked(item.id)}
                    onToggle={toggleFavorite}
                    className='absolute top-1 right-1'
                  />
                </div>
                <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                  <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                    {item.title}
                  </p>
                  <div className='flex items-center gap-0.5 mt-0.5'>
                    <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                    <span className='text-gray-500 text-[10px] truncate'>
                      {(item.location ?? '').trim() || '—'}
                    </span>
                  </div>
                  <div className='mt-auto pt-1 border-t border-gray-50'>
                    <div className='flex items-center justify-between min-w-0'>
                      <div className='flex items-center gap-0.5 min-w-0'>
                        <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                        <span className='text-gray-700 text-[10px] font-semibold'>
                          {item.factoryRating ?? 0}
                        </span>
                      </div>
                      <span className='text-gray-400 text-[9px] shrink-0'>
                        ขั้นต่ำ {item.minOrder ?? 0}{' '}
                        {resolveUnitLabel(item.unitId, item.moqUnit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className='flex-shrink-0 w-3' aria-hidden />
          </div>
        ) : (
          <div className='px-4'>
            <div className='rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-4 py-5 text-center'>
              <p className='text-sm font-medium text-gray-600'>ยังไม่มีสินค้าแนะนำในขณะนี้</p>
              <p className='mt-1 text-xs text-gray-400'>
                ดูไอเดียสินค้าและโรงงานได้จากปุ่มด้านล่าง
              </p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate('/factory-ideas?type=product')}
                className='mt-3 w-full rounded-full border border-brand-magenta/40 bg-white py-2 text-sm font-medium text-brand-magenta hover:bg-brand-panel-hover transition-colors'
              >
                ดูสินค้าแนะนำ
              </Button>
            </div>
          </div>
        )}
      </div>
      ) : null}

      {activeScope === 'MT' ? (
      <div className='mb-3'>
        <div className='mt-[20px] flex items-center justify-between px-4 mb-2'>
          <h3 className='text-[14px] font-bold text-brand-navy-ink flex items-center gap-1.5'>
            <Leaf size={15} className='text-status-success' /> วัตถุดิบแนะนำ
          </h3>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/factory-ideas?type=material')}
            className='text-status-success text-[12px] font-medium flex items-center gap-0.5'
          >
            ดูเพิ่มเติม <ChevronRight size={13} />
          </Button>
        </div>

        {isLoading ? (
          <div
            className='flex gap-2 overflow-x-auto pb-2 pl-3'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            <div className='flex-shrink-0 w-3' aria-hidden />
          </div>
        ) : hasMaterialShowcases ? (
          <div
            className='flex gap-2 overflow-x-auto pb-2 pl-3'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {materialShowcases.map((item) => (
              <div
                key={item.id}
                role='button'
                tabIndex={0}
                onClick={() =>
                  navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`);
                  }
                }}
                className='flex-shrink-0 w-[155px] bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col'
              >
                <div className='aspect-[4/3] relative overflow-hidden bg-gray-50'>
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  />
                  <div className='absolute top-1.5 left-1.5 bg-status-success px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide'>
                    วัตถุดิบ
                  </div>
                  <ShowcaseHeartButton
                    showcaseId={item.id}
                    isLiked={isLiked(item.id)}
                    onToggle={toggleFavorite}
                    className='absolute top-1 right-1'
                  />
                </div>
                <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                  <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                    {item.title}
                  </p>
                  <div className='flex items-center gap-0.5 mt-0.5'>
                    <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                    <span className='text-gray-500 text-[10px] truncate'>
                      {(item.location ?? '').trim() || '—'}
                    </span>
                  </div>
                  <div className='mt-auto pt-1 border-t border-gray-50'>
                    <div className='flex items-center justify-between min-w-0'>
                      <div className='flex items-center gap-0.5 min-w-0'>
                        <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                        <span className='text-gray-700 text-[10px] font-semibold'>
                          {item.factoryRating ?? 0}
                        </span>
                      </div>
                      <span className='text-gray-400 text-[9px] shrink-0'>
                        ขั้นต่ำ {item.minOrder ?? 0}{' '}
                        {resolveUnitLabel(item.unitId, item.moqUnit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className='flex-shrink-0 w-3' aria-hidden />
          </div>
        ) : (
          <div className='px-4'>
            <div className='rounded-xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white px-4 py-5 text-center'>
              <p className='text-sm font-medium text-gray-600'>ยังไม่มีวัตถุดิบแนะนำในขณะนี้</p>
              <p className='mt-1 text-xs text-gray-400'>จะมีวัตถุดิบเพิ่มเร็วๆนี้</p>
              
            </div>
          </div>
        )}
      </div>
      ) : null}

      <HowToOrderSection className='mx-4 mt-5' variant='mobile' />

      <div className='mt-[20px]'>
        {isLoading ? (
          <section className='mx-4 mb-3 mt-3'>
            <div className='flex items-end justify-between mb-3 px-1'>
              <div>
                <div className='h-5 w-28 bg-gray-200 rounded animate-pulse mb-1' />
                <div className='h-3 w-44 bg-gray-100 rounded animate-pulse' />
              </div>
            </div>
            <div className='flex gap-3 overflow-x-hidden pb-2'>
              {[...Array(2)].map((_, i) => <FactoryCarouselCardSkeleton key={i} variant='mobile' />)}
            </div>
          </section>
        ) : (
          <ExploreFactoryShowcase
            factories={(factories ?? []).slice(0, 8)}
            onFactoryClick={(id) => navigate(`/factories/${id}`)}
            onSeeAll={() => navigate('/factory-ideas?type=factory')}
            variant='mobile'
          />
        )}
      </div>

      <div className='px-4 mt-5'><div className='relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-brand-purple/30'>
        <Image
          src='assets/IMG_7664.jpg'
          alt=''
          className='absolute inset-0 w-full h-full object-cover'
        />

        <div className='absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-300/80 via-slate-200/30 to-transparent pointer-events-none' />

        <div className='absolute inset-x-0 bottom-0 z-10 p-3.5'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/register?tab=ft')}
            className='group relative w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white whitespace-nowrap
                       bg-gradient-to-r from-brand-purple via-brand-purple-hover to-brand-violet-deep
                       shadow-lg shadow-brand-purple/40
                       ring-1 ring-white/20
                       transition-all duration-200 ease-out
                       hover:shadow-xl hover:shadow-brand-purple/60 hover:brightness-110
                       active:scale-[0.97]'
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
          </Button>
        </div>
      </div>
      </div>

      <ExploreFooter />
    </div>
  );
}
