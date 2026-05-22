import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  SlidersHorizontal,
  Copy,
  Gift,
  ChevronRight,
  MapPin,
  Star,
  Plus,
  Sparkles,
  Tag,
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
};

/* ═══ Style Constants ═══ */
const FILTER_BUTTON_CLASS = cn(
  'px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100',
  'flex items-center gap-1.5 text-xs font-medium shrink-0',
  'text-brand-magenta hover:border-brand-magenta/30 transition-colors'
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

const OVERLAY_GRADIENT = {
  background:
    'linear-gradient(to top right, rgba(0, 60, 100, 0.2), rgba(3, 153, 190, 0.1), transparent)',
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
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-purple'
);

/* ═══ Helper Functions ═══ */
function getFactoryMeta(
  factoryId: string | number | undefined,
  factories: FactoryItem[] | undefined
) {
  const f = (factories ?? []).find((x) => String(x.id) === String(factoryId ?? ''));
  return {
    location: (f?.location ?? '').trim() || '—',
  };
}

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
  explorePromotions,
  exploreMatrials,
  promoSlides,
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
      })),
    [exploreProducts],
  );

  const promoShowcases = useMemo(() => (explorePromotions ?? []).slice(0, 4), [explorePromotions]);

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
      <div className='px-4 md:px-6 lg:px-8 py-3 lg:py-4 space-y-6 pb-0 w-full mx-auto'>
        <section className='relative rounded-2xl overflow-hidden h-[180px] shadow-lg'>
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

        <div data-tour='search' className='flex gap-2.5'>
          <div className='flex-1 flex items-center gap-2.5 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100'>
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
            className={FILTER_BUTTON_CLASS}
          >
            <SlidersHorizontal size={14} />
            ตัวกรอง
          </Button>
        </div>

        {/* ═══ 3. โค้ดส่วนลดพิเศษ (Promo Codes) — แสดงเฉพาะเมื่อมีจาก API ═══ */}
        {/*
          Disabled promo-code cards. Keep this block commented out; commented code is not rendered or used.
          {desktopPromoSlides.length > 0 && (
          <section>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-base font-bold text-brand-navy-ink flex items-center gap-1.5'>
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
          />
        </div>

        <div data-tour='products'>
          <ExploreProductCarouselSection
            title='สินค้าแนะนำ'
            items={productShowcases}
            bannerImg={'assets/tryly_vertical_banner_v5_oval_final.png'}
            bannerText='คุ้มค่า ถูกใจสัตว์เลี้ยง'
            onItemClick={(id) => navigate(`/product-detail?showcase_id=${encodeURIComponent(id)}`)}
            getFactoryMeta={(factoryId) => getFactoryMeta(factoryId, factories)}
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
          getFactoryMeta={(factoryId) => getFactoryMeta(factoryId, factories)}
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

        <section>
          <div className='mt-[30px] flex items-center justify-between mb-3'>
            <h2 className='text-base font-bold text-brand-navy-ink flex items-center gap-1.5'>
              <Tag className='text-brand-orange-vivid' size={16} />
              โปรโมชันแนะนำ
            </h2>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/factory-ideas?type=promotion')}
              className='text-brand-orange text-xs font-medium hover:text-brand-orange-vivid flex items-center transition-colors'
            >
              ดูเพิ่มเติม <ChevronRight size={14} />
            </Button>
          </div>

          <div className='flex flex-col lg:flex-row gap-3'>
            <div className='hidden lg:block lg:w-[40%] rounded-xl overflow-hidden relative min-h-[180px] flex-shrink-0 group cursor-pointer shadow-md'>
              <ImageWithFallback
                src='assets/tryly_service_banner_375x215.png'
                alt='แบนเนอร์บริการ'
                className='absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105'
              />
              <div
                className='absolute inset-0 z-[1] flex flex-col justify-end p-5 pointer-events-none'
                style={OVERLAY_GRADIENT}
              ></div>
            </div>

            <div className='w-full lg:w-[60%] flex gap-3 overflow-x-auto snap-x hide-scrollbar pb-2'>
              {promoShowcases.map((item) => {
                const meta = getFactoryMeta(item.factoryId, factories);
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/factory-ideas/promotions/${item.id}`)}
                    className='min-w-[180px] bg-white border border-gray-100 rounded-lg overflow-hidden snap-start shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer'
                  >
                    <div className='aspect-[4/3] relative overflow-hidden bg-gray-100'>
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                      />
                      <div className='absolute top-1 left-1 bg-brand-orange px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-wide'>
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
                      <h3 className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                        {item.title}
                      </h3>
                      <div className='flex items-center gap-0.5 mt-0.5'>
                        <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                        <span className='text-gray-500 text-[10px] truncate'>
                          {meta.location}
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
                          <span className='text-gray-400 text-[8px] shrink-0'>
                            ขั้นต่ำ {item.minOrder ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className='relative -mx-8 px-8 py-5 rounded-xl overflow-hidden bg-neutral-cool-surface'>
          <div
            aria-hidden
            className='absolute inset-0 rounded-xl pointer-events-none'
            style={{ opacity: 0.2 }}
          >
            <div
              className='absolute inset-0 rounded-xl'
              style={SHIMMER_GRADIENT}
            />
          </div>
          <div className='relative z-[1] flex items-center justify-between mb-3'>
            <h2 className='text-base font-bold text-brand-navy-ink'>บทความ Idea</h2>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/factory-ideas?type=idea')}
              className='text-brand-magenta text-xs font-medium hover:underline flex items-center'
            >
              ดูทั้งหมด <ChevronRight size={14} />
            </Button>
          </div>

          <div className='relative z-[1]'>
            {ideaArticlesList.length === 0 ? (
              <div className='rounded-xl border border-dashed border-gray-200 bg-white px-6 py-6 text-center text-xs text-gray-500'>
                ยังไม่มีบทความในขณะนี้
              </div>
            ) : (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
                {ideaArticlesList.slice(0, 4).map((article) => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/idea-detail?showcase_id=${article.id}`)}
                    className='relative bg-white rounded-xl border border-gray-100 p-3 pr-10 hover:shadow-md transition-shadow cursor-pointer group min-h-[100px]'
                  >
                    <ShowcaseHeartButton
                      showcaseId={article.id}
                      isLiked={isLiked(article.id)}
                      onToggle={toggleFavorite}
                      className='absolute top-2 right-2 z-[1]'
                    />
                    <div className='flex items-center gap-2 mb-1.5'>
                      <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[10px] font-bold text-brand-magenta uppercase tracking-wide'>
                        {article.tag || 'Idea'}
                      </span>
                      <span className='text-[10px] text-gray-400 truncate'>
                        {article.factoryName}
                      </span>
                    </div>
                    <h3 className='font-bold text-[13px] text-brand-navy-ink mb-1 line-clamp-2 leading-snug group-hover:text-brand-magenta transition-colors'>
                      {article.title}
                    </h3>
                    <p className='text-[12px] text-gray-500 line-clamp-2'>{article.excerpt}</p>
                    <div className='mt-2 pt-1.5 border-t border-gray-100'>
                      <span className='text-[10px] text-gray-400'>แตะเพื่ออ่านต่อ</span>
                    </div>
                  </div>
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

        <div
          className='z-10 flex justify-end items-center w-full xl:relative xl:mt-0 max-xl:absolute max-xl:w-auto max-xl:left-auto max-xl:right-4 max-xl:bottom-4 md:max-xl:right-8 md:max-xl:bottom-5'
        >
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/register/factory')}
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

      <div className='lg:px-8'>
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
