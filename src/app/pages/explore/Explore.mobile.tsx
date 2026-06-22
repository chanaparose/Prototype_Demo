import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, ChevronRight, Leaf, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExplorePromoCarousel } from '@/components/features/explore/ExplorePromoCarousel';
import { ExploreHubPreview } from '@/components/features/explore/ExploreHubPreview';
import { ExploreFactoryShowcase } from '@/components/features/explore/ExploreFactoryShowcase';
import { ExploreFooter } from '@/components/features/explore/ExploreFooter';
import { HowToOrderSection } from '@/components/features/explore/HowToOrderSection';
import { useExploreHubFilteredContent } from '@/components/features/explore/useExploreHubFilteredContent';
import { useExploreHubSelection } from '@/components/features/explore/useExploreHubSelection';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import { ExploreFactoryRegisterCta } from '@/components/features/explore/ExploreFactoryRegisterCta';
import type { IExploreShowcase, IExploreSlide } from '@/domain/explore/types/explore.model';
import { useFavorites } from '@/hooks/useFavorites';
import {
  ProductCardSkeleton,
  FactoryCarouselCardSkeleton,
} from '@/components/skeletons/PageSkeletons';
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
    isHubScoped,
    hasHubFactories,
    factoriesLoading,
    showcaseTitle,
    factoryTitle,
    factorySubtitle,
    seeMoreShowcaseHref,
    seeMoreFactoryHref,
  } = useExploreHubFilteredContent({
    activeScope,
    exploreProducts,
    exploreMatrials,
    factories,
    selectedHub,
    categoryIds,
  });

  const productShowcases = activeScope === 'PD' ? scopedShowcases : [];
  const materialShowcases = activeScope === 'MT' ? scopedShowcases : [];

  const hasProductShowcases = productShowcases.length > 0;
  // const hasPromoShowcases = promoShowcases.length > 0;
  const hasMaterialShowcases = materialShowcases.length > 0;

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
        <div data-tour='products' className='mb-5'>
          <div className='mt-7 flex items-center justify-between px-4 mb-2.5'>
            <h3 className='text-[14px] font-bold text-brand-navy-ink flex items-center gap-1.5'>
              <ShoppingBag size={15} className='text-brand-orange' /> {showcaseTitle}
            </h3>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate(seeMoreShowcaseHref)}
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
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
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
                          ขั้นต่ำ {item.minOrder ?? 0} {resolveUnitLabel(item.unitId, item.moqUnit)}
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
                <p className='text-sm font-medium text-gray-600'>
                  {isHubScoped
                    ? `ยังไม่มีสินค้าแนะนำในหมวด ${selectedHub?.name ?? ''}`
                    : 'ยังไม่มีสินค้าแนะนำในขณะนี้'}
                </p>
                <p className='mt-1 text-xs text-gray-400'>
                  {isHubScoped
                    ? 'ลองดูสินค้าทั้งหมดในหมวดนี้ได้จากปุ่มด้านล่าง'
                    : 'ดูไอเดียสินค้าและโรงงานได้จากปุ่มด้านล่าง'}
                </p>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => navigate(seeMoreShowcaseHref)}
                  className='mt-3 w-full rounded-full border border-brand-magenta/40 bg-white py-2 text-sm font-medium text-brand-magenta hover:bg-brand-panel-hover transition-colors'
                >
                  {isHubScoped ? `ดูสินค้าใน ${selectedHub?.name ?? 'หมวดนี้'}` : 'ดูสินค้าแนะนำ'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeScope === 'MT' ? (
        <div className='mb-5'>
          <div className='mt-7 flex items-center justify-between px-4 mb-2.5'>
            <h3 className='text-[14px] font-bold text-brand-navy-ink flex items-center gap-1.5'>
              <Leaf size={15} className='text-status-success' /> {showcaseTitle}
            </h3>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate(seeMoreShowcaseHref)}
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
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
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
                          ขั้นต่ำ {item.minOrder ?? 0} {resolveUnitLabel(item.unitId, item.moqUnit)}
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
                <p className='text-sm font-medium text-gray-600'>
                  {isHubScoped
                    ? `ยังไม่มีวัตถุดิบแนะนำในหมวด ${selectedHub?.name ?? ''}`
                    : 'ยังไม่มีวัตถุดิบแนะนำในขณะนี้'}
                </p>
                <p className='mt-1 text-xs text-gray-400'>
                  {isHubScoped
                    ? 'ลองดูวัตถุดิบทั้งหมดในหมวดนี้ได้จากปุ่มด้านล่าง'
                    : 'จะมีวัตถุดิบเพิ่มเร็วๆนี้'}
                </p>
                {isHubScoped ? (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => navigate(seeMoreShowcaseHref)}
                    className='mt-3 w-full rounded-full border border-emerald-300 bg-white py-2 text-sm font-medium text-status-success hover:bg-emerald-50 transition-colors'
                  >
                    {`ดูวัตถุดิบใน ${selectedHub?.name ?? 'หมวดนี้'}`}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <HowToOrderSection className='mx-4 mt-7' variant='mobile' />

      <div className='mt-7'>
        {isLoading || factoriesLoading ? (
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
        ) : hasHubFactories ? (
          <ExploreFactoryShowcase
            factories={scopedFactories}
            title={factoryTitle}
            subtitle={factorySubtitle}
            onFactoryClick={(id) => navigate(`/factories/${id}`)}
            onSeeAll={() => navigate(seeMoreFactoryHref)}
            variant='mobile'
          />
        ) : isHubScoped ? (
          <section className='mx-4 mb-5 mt-7'>
            <div className='mb-2 px-1'>
              <h3 className='text-[14px] font-bold text-brand-navy-ink'>{factoryTitle}</h3>
              <p className='mt-0.5 text-[11px] text-gray-500'>{factorySubtitle}</p>
            </div>
            <div className='rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-4 py-5 text-center'>
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
                className='mt-3 w-full rounded-full border border-brand-purple/30 bg-white py-2 text-sm font-medium text-brand-purple hover:bg-brand-panel-hover transition-colors'
              >
                ดูโรงงานใน {selectedHub?.name ?? 'หมวดนี้'}
              </Button>
            </div>
          </section>
        ) : null}
      </div>

      <ExploreFactoryRegisterCta onRegister={() => navigate('/register?tab=ft')} />

      <ExploreFooter />
    </div>
  );
}
