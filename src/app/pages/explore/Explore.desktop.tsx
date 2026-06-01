import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  SlidersHorizontal,
  Copy,
  Gift,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { ExploreFooter } from '@/components/features/explore/ExploreFooter';
import { HowToOrderSection } from '@/components/features/explore/HowToOrderSection';
import { ExploreFactoryShowcase } from '@/components/features/explore/ExploreFactoryShowcase';
import { ExploreDesktopCategories } from '@/components/features/explore/ExploreDesktopCategories';
import { ExploreProductCarouselSection } from '@/components/features/explore/ExploreProductCarouselSection';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import type { CategoryItem } from '@/components/features/explore/ExploreCategories';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import type { IdeaArticleItem } from '@/components/features/explore/ExploreIdeaArticles';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import type { IExploreShowcase, IExploreSlide } from '@/domain/explore/types/explore.model';
import { useFavorites } from '@/hooks/useFavorites';

type ExploreDesktopProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  copiedId: string | null;
  setCopiedId: (v: string | null) => void;
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
  guestConnecting?: boolean;
};

/* ═══ Style Constants ═══ */
const FILTER_BUTTON_CLASS = cn(
  'px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100',
  'flex items-center gap-1.5 text-xs font-medium shrink-0',
  'text-brand-magenta hover:border-brand-magenta/30 transition-colors',
);

const PROMO_GRADIENT = {
  background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-vivid) 100%)',
};

const PROMO_PURPLE_BG = { background: 'var(--brand-purple)' };
const PROMO_LIGHT_BG = { background: '#FAEBD7' };

const PROMO_BADGE_STYLE = { background: 'var(--brand-purple)' };
const PROMO_CODE_WRAPPER = {
  background: 'rgba(255,255,255,0.25)',
  borderColor: 'rgba(255,255,255,0.40)',
};

const PROMO_COPY_BTN = { background: 'var(--brand-navy-deep)' };

const SHIMMER_GRADIENT = {
  background:
    'linear-gradient(90deg, var(--brand-violet) 0%, #A855F7 35%, #EA6C00 65%, #16A34A 100%)',
  animation: 'hiw-shimmer-bar 4s ease-in-out infinite',
};

const FAB_BUTTON_STYLE = {
  background: 'var(--brand-purple)',
  boxShadow: '0 6px 20px rgba(162,56,255,0.40)',
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
  searchText,
  setSearchText,
  copiedId,
  setCopiedId,
  categories,
  exploreCategoriesMerged,
  exploreCategoriesLoading,
  exploreCategoriesError,
  reloadExploreCategories,
  factories,
  ideaArticles,
  exploreProducts,
  explorePromotions: _explorePromotions,
  exploreMatrials,
  promoSlides,
  guestConnecting = false,
}: Readonly<Omit<ExploreDesktopProps, 'activeRFQs' | 'recentOrders'>>) {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const ideaArticlesList = ideaArticles ?? [];
  const recommendedFactories = useMemo(() => (factories ?? []).slice(0, 10), [factories]);

  const productShowcases = useMemo(
    () =>
      (exploreProducts ?? []).slice(0, 8).map((s) => ({
        id: s.id,
        title: s.title,
        price: `MOQ ${s.minOrder}`,
        img: s.image,
        category: s.category,
        subCategoryName: s.subCategoryName,
        factoryId: s.factoryId,
        factoryName: s.factoryName,
        minOrder: s.minOrder,
        factoryRating: s.factoryRating,
        location: s.location,
      })),
    [exploreProducts],
  );

  // const promoShowcases = useMemo(() => (explorePromotions ?? []).slice(0, 4), [explorePromotions]);

  const materialShowcases = useMemo(
    () =>
      (exploreMatrials ?? []).slice(0, 8).map((s) => ({
        id: s.id,
        title: s.title,
        price: `MOQ ${s.minOrder}`,
        img: s.image,
        category: s.category,
        subCategoryName: s.subCategoryName,
        factoryId: s.factoryId,
        factoryName: s.factoryName,
        minOrder: s.minOrder,
        factoryRating: s.factoryRating,
        location: s.location,
      })),
    [exploreMatrials],
  );

  // Promo slides จาก API เท่านั้น — ไม่มี fallback
  const desktopPromoSlides = useMemo(() => {
    const slides = Array.isArray(promoSlides) ? promoSlides : [];
    return slides
      .map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        code: r.code,
      }))
      .filter((s) => s.id && s.title);
  }, [promoSlides]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

         

        {/* ═══ 3. โค้ดส่วนลดพิเศษ (Promo Codes) — แสดงเฉพาะเมื่อมีจาก API ═══ */}
        {/*
          Disabled promo-code cards. Keep this block commented out; commented code is not rendered or used.
          {desktopPromoSlides.length > 0 && (
          <section>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-[14px] font-bold text-brand-navy-ink flex items-center gap-1.5'>
                <Sparkles className='text-brand-orange' size={16} />
                โค้ดส่วนลดพิเศษ
              </h2>
            </div>

            <div className='grid grid-cols-3 gap-3'>
              {desktopPromoSlides.map((promo) => (
                <div
                  key={promo.id}
                  className='h-full rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col'
                >
                  <div
                    className='relative overflow-hidden p-3.5 text-white h-full flex-1 flex flex-col'
                    style={PROMO_GRADIENT}
                  >
                    <div
                      className='absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30'
                      style={PROMO_PURPLE_BG}
                    />
                    <div
                      className='absolute top-0 right-0 w-14 h-14 rounded-full opacity-20 blur-xl'
                      style={PROMO_PURPLE_BG}
                    />

                    <div
                      className='absolute -bottom-3 -left-3 w-12 h-12 rounded-full opacity-20'
                      style={PROMO_LIGHT_BG}
                    />
                    <div className='relative z-10'>
                      <div
                        className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-1.5'
                        style={PROMO_BADGE_STYLE}
                      >
                        <Gift className='w-3 h-3 text-white' />
                        <span className='text-[10px] text-white font-semibold tracking-wide'>
                          โปรโมชั่นพิเศษ
                        </span>
                      </div>
                      <p className='text-sm font-bold mb-1 leading-tight text-white drop-shadow-sm'>
                        {promo.title}
                      </p>
                      <p
                        className='text-[10px] mb-2 leading-snug'
                        style={{ color: 'rgba(255,255,255,0.85)' }}
                      >
                        {promo.subtitle}
                      </p>
                      <div className='flex items-center gap-2'>
                        <div
                          className='flex items-center rounded-lg px-2.5 py-1 border'
                          style={PROMO_CODE_WRAPPER}
                        >
                          <span className='text-sm font-mono tracking-widest font-bold text-white'>
                            {promo.code}
                          </span>
                        </div>
                        <Button
                          variant='unstyled'
                          type='button'
                          onClick={() => handleCopy(promo.code, promo.id)}
                          className='flex items-center gap-1 rounded-lg px-2.5 py-1 transition-colors text-[12px] font-semibold text-white'
                          style={PROMO_COPY_BTN}
                        >
                          <Copy className='w-3 h-3' />
                          {copiedId === promo.id ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}
        */}

        <div data-tour='categories'>
          <ExploreDesktopCategories
            categories={categories}
            mergedFromApi={exploreCategoriesMerged}
            apiLoading={exploreCategoriesLoading}
            apiError={exploreCategoriesError}
            onRetryCategoriesApi={reloadExploreCategories}
            guestConnecting={guestConnecting}
          />
        </div>

        <div data-tour='products'>
          <ExploreProductCarouselSection
            title='สินค้าแนะนำ'
            items={productShowcases}
            bannerImg={'assets/tryly_vertical_banner_v5_oval_final.png'}
            bannerText='คุ้มค่า ถูกใจสัตว์เลี้ยง'
            onItemClick={(id) => navigate(`/product-detail?showcase_id=${encodeURIComponent(id)}`)}
            isLiked={isLiked}
            onToggleFavorite={toggleFavorite}
          />
        </div>

        <ExploreProductCarouselSection
          title='วัตถุดิบแนะนำ'
          theme='material'
          seeMoreHref='/factory-ideas?type=material'
          items={materialShowcases}
          bannerImg={'assets/tryly_vertical_banner_raw_material_v5_oval_final.png'}
          bannerText='วัตถุดิบคุณภาพสูง'
          onItemClick={(id) => navigate(`/product-detail?showcase_id=${encodeURIComponent(id)}`)}
          isLiked={isLiked}
          onToggleFavorite={toggleFavorite}
        />

        <HowToOrderSection className='mx-0' />

        <div className='mt-[40px]'>
          <ExploreFactoryShowcase
            factories={recommendedFactories}
            onFactoryClick={(id) => navigate(`/factories/${id}`)}
            onSeeAll={() => navigate('/factory-ideas?type=factory')}
            variant='desktop'
          />
        </div>

        {/* โปรโมชันแนะนำ (PM) — disabled
        <section>...</section>
        */}

        <section>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='flex items-center gap-2 text-base font-bold text-[var(--brand-navy)]'>
              <Sparkles className='h-5 w-5 text-[var(--brand-mauve)]' />
              บทความ Idea
            </h2>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/factory-ideas?type=idea')}
              className='text-[13px] font-medium text-[var(--brand-mauve)] transition-opacity hover:opacity-80'
            >
              ดูทั้งหมด ({ideaArticlesList.length})
            </Button>
          </div>

          <div>
            {ideaArticlesList.length === 0 ? (
              <div className='rounded-xl border border-dashed border-gray-200 bg-white px-6 py-6 text-center text-xs text-gray-500'>
                ยังไม่มีบทความในขณะนี้
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-4'>
                {ideaArticlesList.slice(0, 4).map((article) => (
                  <article
                    key={article.id}
                    onClick={() => navigate(`/idea-detail?showcase_id=${article.id}`)}
                    className='relative min-h-[100px] cursor-pointer rounded-xl border border-gray-100 bg-white p-3 pr-10 transition-shadow hover:shadow-md group'
                  >
                    <ShowcaseHeartButton
                      showcaseId={article.id}
                      isLiked={isLiked(article.id)}
                      onToggle={toggleFavorite}
                      className='absolute top-2 right-2 z-[1]'
                    />
                    <div className='mb-1.5 flex items-center gap-2'>
                      <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-magenta'>
                        ไอเดีย
                      </span>
                      <span className='truncate text-[10px] text-gray-400'>
                        {article.factoryName}
                      </span>
                    </div>
                    <h3 className='mb-1 line-clamp-2 text-[13px] font-bold leading-snug text-brand-navy-ink transition-colors group-hover:text-brand-magenta'>
                      {article.title}
                    </h3>
                    <p className='text-[12px] text-gray-500 line-clamp-2'>{article.excerpt}</p>
                    <div className='mt-2 border-t border-gray-100 pt-1.5'>
                      <span className='text-[10px] text-gray-400'>แตะเพื่ออ่านต่อ</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className='mt-6 rounded-xl overflow-hidden border border-brand-purple/30 shadow-sm relative py-5 px-4 md:px-8'>
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

      <div className='lg:px-8 2xl:px-10'>
        <ExploreFooter />
      </div>

      <Button
        variant='unstyled'
        data-tour='fab'
        type='button'
        onClick={() => navigate('/create-rfq')}
        className='hidden md:flex xl:hidden fixed bottom-6 right-5 w-12 h-12 rounded-full items-center justify-center shadow-lg transition-transform active:scale-95 z-30'
        style={FAB_BUTTON_STYLE}
      >
        <Plus size={20} className='text-white' />
      </Button>
    </div>
  );
}
