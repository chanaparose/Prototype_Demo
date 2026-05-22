import React from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  SlidersHorizontal,
  Plus,
  ShoppingBag,
  ChevronRight,
  Tag,
  Leaf,
  MapPin,
  Star,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExplorePromoCarousel } from '@/components/features/explore/ExplorePromoCarousel';
import { ExploreCategories } from '@/components/features/explore/ExploreCategories';
import { ExploreFactoryShowcase } from '@/components/features/explore/ExploreFactoryShowcase';
import { ExploreIdeaArticles } from '@/components/features/explore/ExploreIdeaArticles';
import { ExploreFooter } from '@/components/features/explore/ExploreFooter';
import { HowToOrderSection } from '@/components/features/explore/HowToOrderSection';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import type { CategoryItem } from '@/components/features/explore/ExploreCategories';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import type { IdeaArticleItem } from '@/components/features/explore/ExploreIdeaArticles';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import type { IExploreShowcase, IExploreSlide } from '@/domain/explore/types/explore.model';
import { useFavorites } from '@/hooks/useFavorites';

type ExploreMobileProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  categories: CategoryItem[];
  exploreCategoriesMerged: CategoryItem[];
  exploreCategoriesLoading: boolean;
  exploreCategoriesError: string | null;
  reloadExploreCategories: () => void;
  factories: FactoryItem[];
  ideaArticles: IdeaArticleItem[];
  factoryShowcases: IExploreShowcase[];
  exploreProducts: IExploreShowcase[];
  explorePromotions: IExploreShowcase[];
  exploreMatrials?: IExploreShowcase[];
  explorePromoCodes: IExploreSlide[];
  promoSlides: IExploreSlide[];
};

export function ExploreMobile({
  searchText,
  setSearchText,
  categories,
  exploreCategoriesMerged,
  exploreCategoriesLoading,
  exploreCategoriesError,
  reloadExploreCategories,
  factories,
  ideaArticles,
  exploreProducts,
  explorePromotions,
  exploreMatrials,
  explorePromoCodes,
  promoSlides,
}: ExploreMobileProps) {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();

  const productShowcases = (exploreProducts ?? []).slice(0, 8);
  const promoShowcases = (explorePromotions ?? []).slice(0, 4);
  const materialShowcases = (exploreMatrials ?? []).slice(0, 8);

  const hasProductShowcases = productShowcases.length > 0;
  const hasPromoShowcases = promoShowcases.length > 0;
  const hasMaterialShowcases = materialShowcases.length > 0;

  return (
    <div className='md:hidden pt-3 pb-2 space-y-3'>
      <div className='mx-4 relative rounded-2xl overflow-hidden h-[115px] shadow-md'>
        <ImageWithFallback
          src='/assets/tryly-banner-final.png'
          alt='Tryly banner'
          className='block h-full w-full object-cover object-[center_calc(50%)]'
        />
      </div>

      <div data-tour='search' className='px-4 flex gap-2'>
        <div className='flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100'>
          <Search size={16} className='text-gray-400 shrink-0' />
          <Input
            type='text'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='ค้นหาโรงงาน ประเภทงาน หรือ วัสดุ...'
            className='flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400'
          />
        </div>
        <Button
          variant='unstyled'
          type='button'
          className='w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0 hover:border-brand-magenta/30 transition-colors'
        >
          <SlidersHorizontal size={16} className='text-brand-magenta' />
        </Button>
      </div>

      <ExplorePromoCarousel promoSlides={promoSlides} promoCodes={explorePromoCodes} />

      <div data-tour='categories' className='mt-[20px]'>
        <ExploreCategories
          categories={categories}
          mergedFromApi={exploreCategoriesMerged}
          apiLoading={exploreCategoriesLoading}
          apiError={exploreCategoriesError}
          onRetryCategoriesApi={reloadExploreCategories}
        />
      </div>

      <div data-tour='products' className='mb-3'>
        <div className='mt-[25px] flex items-center justify-between px-4 mb-2'>
          <h3 className='text-base font-bold text-brand-navy-ink flex items-center gap-1.5'>
            <ShoppingBag size={15} className='text-brand-orange' /> สินค้าแนะนำ
          </h3>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/factory-ideas?type=product')}
            className='text-brand-magenta text-xs font-medium flex items-center gap-0.5'
          >
            ดูเพิ่มเติม <ChevronRight size={13} />
          </Button>
        </div>

        {hasProductShowcases ? (
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
                  <div className='absolute top-1 left-1 bg-brand-sky px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-wide'>
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
                      {(
                        (factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))
                          ?.location ?? ''
                      ).trim() || '—'}
                    </span>
                  </div>
                  <div className='mt-auto pt-1 border-t border-gray-50'>
                    <div className='flex items-center justify-between min-w-0'>
                      <div className='flex items-center gap-0.5 min-w-0'>
                        <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                        <span className='text-gray-700 text-[10px] font-semibold'>
                          {Number(
                            (factories ?? []).find(
                              (f) => String(f.id) === String(item.factoryId ?? ''),
                            )?.rating ?? 0,
                          )}
                        </span>
                        <span className='text-gray-400 text-[9px] truncate'>
                          (
                          {Number(
                            (factories ?? []).find(
                              (f) => String(f.id) === String(item.factoryId ?? ''),
                            )?.reviews ?? 0,
                          )}
                          )
                        </span>
                      </div>
                      <span className='text-gray-400 text-[8px] shrink-0'>
                        ขั้นต่ำ {item.minOrder ?? 0}
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

      <div className='mb-3'>
        <div className='mt-[20px] flex items-center justify-between px-4 mb-2'>
          <h3 className='text-base font-bold text-brand-navy-ink flex items-center gap-1.5'>
            <Leaf size={15} className='text-status-success' /> วัตถุดิบแนะนำ
          </h3>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/factory-ideas?type=material')}
            className='text-status-success text-xs font-medium flex items-center gap-0.5'
          >
            ดูเพิ่มเติม <ChevronRight size={13} />
          </Button>
        </div>

        {hasMaterialShowcases ? (
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
                      {(
                        (factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))
                          ?.location ?? ''
                      ).trim() || '—'}
                    </span>
                  </div>
                  <div className='mt-auto pt-1 border-t border-gray-50'>
                    <div className='flex items-center justify-between min-w-0'>
                      <div className='flex items-center gap-0.5 min-w-0'>
                        <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                        <span className='text-gray-700 text-[10px] font-semibold'>
                          {Number(
                            (factories ?? []).find(
                              (f) => String(f.id) === String(item.factoryId ?? ''),
                            )?.rating ?? 0,
                          )}
                        </span>
                        <span className='text-gray-400 text-[9px] truncate'>
                          (
                          {Number(
                            (factories ?? []).find(
                              (f) => String(f.id) === String(item.factoryId ?? ''),
                            )?.reviews ?? 0,
                          )}
                          )
                        </span>
                      </div>
                      <span className='text-gray-400 text-[8px] shrink-0'>
                        ขั้นต่ำ {item.minOrder ?? 0}
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
              <p className='mt-1 text-xs text-gray-400'>ดูข้อมูลวัตถุดิบได้จากปุ่มด้านล่าง</p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate('/factory-ideas?type=material')}
                className='mt-3 w-full rounded-full border border-status-success/40 bg-white py-2 text-sm font-medium text-status-success hover:bg-emerald-50 transition-colors'
              >
                ดูวัตถุดิบแนะนำ
              </Button>
            </div>
          </div>
        )}
      </div>

      <HowToOrderSection className='mx-4' />

      <div className='mt-[20px]'>
        <ExploreFactoryShowcase
          factories={(factories ?? []).slice(0, 8)}
          onFactoryClick={(id) => navigate(`/factories/${id}`)}
          onSeeAll={() => navigate('/factory-ideas?type=factory')}
          variant='mobile'
        />
      </div>

      <div className='mt-[20px]'>
        <ExploreIdeaArticles
          articles={(ideaArticles ?? []).slice(0, 3)}
          isLiked={isLiked}
          onToggleFavorite={toggleFavorite}
          onSeeAll={() => navigate('/factory-ideas?type=idea')}
          onArticleClick={(id) => navigate(`/idea-detail?showcase_id=${id}`)}
        />
      </div>

      <div className='mb-3'>
        <div className='mt-[20px] flex items-center justify-between px-4 mb-2'>
          <h3 className='text-base font-bold text-brand-navy-ink flex items-center gap-1.5'>
            <Tag size={15} className='text-brand-orange-vivid' /> โปรโมชันแนะนำ
          </h3>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/factory-ideas?type=promotion')}
            className='text-brand-orange text-xs font-medium hover:text-brand-orange-vivid flex items-center gap-0.5 transition-colors'
          >
            ดูเพิ่มเติม <ChevronRight size={13} />
          </Button>
        </div>
        <div className='px-3 space-y-2'>
          {hasPromoShowcases ? (
            <div
              className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {promoShowcases.map((item) => (
                <div
                  key={item.id}
                  role='button'
                  tabIndex={0}
                  onClick={() => navigate(`/factory-ideas/promotions/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/factory-ideas/promotions/${item.id}`);
                    }
                  }}
                  className='flex-shrink-0 w-[155px] bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer'
                >
                  <div className='aspect-[4/3] relative overflow-hidden bg-gray-100'>
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                    />
                    <div className='absolute top-1.5 left-1.5 bg-brand-orange px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide'>
                      โปรโมชัน
                    </div>
                    <ShowcaseHeartButton
                      showcaseId={item.id}
                      isLiked={isLiked(item.id)}
                      onToggle={toggleFavorite}
                      className='absolute top-1 right-1'
                    />
                  </div>
                  <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                    <h4 className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                      {item.title}
                    </h4>
                    <div className='flex items-center gap-0.5 mt-0.5'>
                      <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                      <span className='text-gray-500 text-[10px] truncate'>
                        {(
                          (factories ?? []).find(
                            (f) => String(f.id) === String(item.factoryId ?? ''),
                          )?.location ?? ''
                        ).trim() || '—'}
                      </span>
                    </div>
                    <div className='mt-auto pt-1 border-t border-gray-50'>
                      <div className='flex items-center justify-between min-w-0'>
                        <div className='flex items-center gap-0.5 min-w-0'>
                          <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                          <span className='text-gray-700 text-[10px] font-semibold'>
                            {Number(
                              (factories ?? []).find(
                                (f) => String(f.id) === String(item.factoryId ?? ''),
                              )?.rating ?? 0,
                            )}
                          </span>
                          <span className='text-gray-400 text-[9px] truncate'>
                            (
                            {Number(
                              (factories ?? []).find(
                                (f) => String(f.id) === String(item.factoryId ?? ''),
                              )?.reviews ?? 0,
                            )}
                            )
                          </span>
                        </div>
                        <span className='text-gray-400 text-[8px] shrink-0'>
                          ขั้นต่ำ {item.minOrder ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='rounded-xl border border-dashed border-brand-orange/25 bg-gradient-to-br from-orange-50/50 to-white px-4 py-5 text-center'>
              <p className='text-sm font-medium text-gray-600'>ยังไม่มีโปรโมชันแนะนำในขณะนี้</p>
              <p className='mt-1 text-xs text-gray-400'>ดูไอเดียโปรโมชันได้จากปุ่มด้านล่าง</p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate('/factory-ideas?type=promotion')}
                className='mt-3 w-full rounded-full border border-brand-orange/40 bg-white py-2 text-sm font-medium text-brand-orange-vivid hover:bg-orange-50/80 transition-colors'
              >
                ดูไอเดียโปรโมชัน
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className='mx-auto w-[78%] max-w-xs relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-brand-purple/30 mt-8'>
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
            onClick={() => navigate('/register/factory')}
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

      <ExploreFooter />

      <Button
        variant='unstyled'
        data-tour='fab'
        type='button'
        onClick={() => navigate('/create-rfq')}
        className='fixed bottom-6 right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30'
        style={{ background: 'var(--brand-purple)', boxShadow: '0 6px 20px rgba(162,56,255,0.40)' }}
      >
        <Plus size={20} className='text-white' />
      </Button>
    </div>
  );
}
