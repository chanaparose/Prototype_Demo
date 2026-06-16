import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  BadgeCheck,
  Sparkles,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  SearchX,
  Star,
  ChevronRight,
} from 'lucide-react';
import { FactoryIdeasCategoryDropdown } from '@/components/features/factory-ideas/FactoryIdeasCategoryDropdown';
import { FactoryIdeasHubBackButton } from '@/components/features/factory-ideas/FactoryIdeasHubBackButton';
import { isFromFactoryIdeasHub } from '@/components/features/factory-ideas/factoryIdeasHubNav';
import { IdeaArticleCard } from '@/components/features/factory-ideas/IdeaArticleCard';
import { useFactoryIdeasPageState } from '@/pages/factory-ideas/useFactoryIdeasPageState';
import {
  factoryIdeasContentTypeBadge as contentTypeBadge,
  factoryIdeasContentTypeLabel as contentTypeLabel,
  factoryIdeasVisibleContentTypes as CONTENT_TYPES,
  factoryIdeasTabOrder,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { TabSwipeContent } from '@/components/layout/TabSwipeContent';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseGridCard } from '@/components/features/factory-ideas/ShowcaseGridCard';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import { FactoryIdeasSearchBar } from '@/components/features/factory-ideas/FactoryIdeasSearchBar';
import { resolveUnitLabel } from '@/domain/master/mappers/mapMasterUnits';
import type { Factory, FactoryShowcase } from '@/stores/types';
import type { FactoryIdeasContentType } from '@/components/features/factory-ideas/factoryIdeasTheme';

type FactoryRow = Factory;

function DesktopShowcaseGrid({
  items,
  isLiked,
  toggleFavorite,
  navigate,
  getDetailPath,
  title,
}: {
  items: FactoryShowcase[];
  isLiked: (id: string | number) => boolean;
  toggleFavorite: (id: string | number) => void;
  navigate: ReturnType<typeof useNavigate>;
  getDetailPath: (contentType: FactoryIdeasContentType, id: string) => string;
  title?: string;
}) {
  return (
    <section>
      {title ? (
        <h3 className='mb-2.5 text-xs font-medium text-gray-500'>{title}</h3>
      ) : null}
      <div className='grid grid-cols-5 2xl:grid-cols-6 gap-2'>
      {items.map((item) => (
          <ShowcaseGridCard
            key={item.id}
            item={item}
            isLiked={isLiked(item.id)}
            onToggleFavorite={toggleFavorite}
            onClick={() => navigate(getDetailPath(item.contentType, item.id))}
          />
        ))}
      </div>
    </section>
  );
}

function DesktopShowcaseList({
  items,
  dataFactories,
  isLiked,
  toggleFavorite,
  navigate,
  getDetailPath,
  title,
}: {
  items: FactoryShowcase[];
  dataFactories: Factory[];
  isLiked: (id: string | number) => boolean;
  toggleFavorite: (id: string | number) => void;
  navigate: ReturnType<typeof useNavigate>;
  getDetailPath: (contentType: FactoryIdeasContentType, id: string) => string;
  title?: string;
}) {
  return (
    <section>
      {title ? (
        <h3 className='mb-2.5 text-xs font-medium text-gray-500'>{title}</h3>
      ) : null}
      <div className='space-y-2'>
      {items.map((item) => {
        const factory = dataFactories.find((f: Factory) => f.id === item.factoryId);
        const badgeColor = contentTypeBadge[item.contentType];
        return (
          <article
            key={item.id}
            className='group bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden'
            onClick={() => navigate(getDetailPath(item.contentType, item.id))}
          >
            <div className='flex items-center gap-4 p-4'>
              <div className='relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0'>
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                />
                <ShowcaseHeartButton
                  showcaseId={item.id}
                  isLiked={isLiked(item.id)}
                  onToggle={toggleFavorite}
                  className='absolute top-1 right-1 z-[1]'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span
                        className='shrink-0 rounded-full bg-[var(--factory-idea-badge)] px-2 py-0.5 text-[9px] font-bold text-white'
                        style={{ '--factory-idea-badge': badgeColor } as React.CSSProperties}
                      >
                        {contentTypeLabel[item.contentType]}
                      </span>
                      <span className='text-[10px] text-gray-400'>{item.category}</span>
                    </div>
                    <h3 className='truncate text-[13px] font-bold text-[var(--brand-navy)]'>
                      {item.title}
                    </h3>
                    <p className='text-[11px] text-gray-500 mt-0.5 line-clamp-2'>
                      {item.excerpt || ' '}
                    </p>
                  </div>
                  <div className='shrink-0 flex items-center gap-4 text-[11px] text-gray-400'>
                    <span>
                      MOQ{' '}
                      <span className='font-semibold text-[var(--brand-navy)]'>
                        {item.minOrder}
                      </span>{' '}
                      {resolveUnitLabel(item.unitId, item.moqUnit)}
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-2 mt-2'>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/factories/${item.factoryId}`);
                    }}
                    className='flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-navy)] transition-colors'
                  >
                    {item.factoryName}
                    {factory?.verified && (
                      <BadgeCheck className='h-3.5 w-3.5 text-[var(--brand-mauve)]' />
                    )}
                  </Button>
                  <span className='text-gray-200'>·</span>
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className='rounded-full bg-[var(--neutral-warm-surface)] px-2 py-0.5 text-[10px] text-[var(--brand-navy)]'
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        );
      })}
      </div>
    </section>
  );
}

function DesktopRecommendedFactoriesRow({
  factories,
  onFactoryClick,
  onSeeAll,
}: {
  factories: FactoryRow[];
  onFactoryClick: (id: string) => void;
  onSeeAll: () => void;
}) {
  if (factories.length === 0) return null;

  return (
    <section className='mb-8'>
      <div className='mb-2.5 flex items-center justify-between'>
        <h3 className='text-xs font-medium text-gray-500'>โรงงานแนะนำ</h3>
        <Button
          variant='unstyled'
          type='button'
          onClick={onSeeAll}
          className='flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-gray-600'
        >
          ดูทั้งหมด <ChevronRight size={13} />
        </Button>
      </div>
      <div
        className='flex gap-2 overflow-x-auto pb-1'
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {factories.slice(0, 12).map((factory, idx) => (
          <article
            key={factory.id}
            className='w-[132px] shrink-0 cursor-pointer'
            onClick={() => onFactoryClick(factory.id)}
          >
            <div className='relative aspect-square overflow-hidden rounded-lg bg-gray-100'>
              <ImageWithFallback
                src={factory.image}
                alt={factory.name}
                className='h-full w-full object-cover transition-transform duration-300 hover:scale-105'
              />
              {idx < 3 ? (
                <span className='absolute left-0 top-0 z-[1] rounded-br-md bg-[var(--brand-orange-deep)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white'>
                  Top
                </span>
              ) : null}
              {factory.verified ? (
                <div className='absolute right-1 top-1 z-[1] flex items-center gap-0.5 rounded-full bg-white/90 px-1 py-0.5 backdrop-blur-sm'>
                  <BadgeCheck className='h-2.5 w-2.5 text-[var(--brand-purple)]' />
                </div>
              ) : null}
              <div className='absolute inset-x-0 bottom-0 bg-black/45 px-1.5 py-1'>
                <p className='flex items-center gap-0.5 truncate text-[9px] text-white'>
                  <Star className='h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400' />
                  <span className='font-semibold'>{factory.rating}</span>
                  <span className='text-white/80'>({factory.reviews})</span>
                </p>
              </div>
            </div>
            <p className='mt-1.5 line-clamp-2 text-[11px] leading-snug text-gray-800'>
              {factory.name}
            </p>
          </article>
        ))}
        <div className='w-1 shrink-0' aria-hidden />
      </div>
    </section>
  );
}

export function FactoryIdeasDesktop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromHub = isFromFactoryIdeasHub(searchParams);
  const {
    data,
    isLiked,
    toggleFavorite,
    searchText,
    setSearchText,
    moqFilter,
    setMoqFilter,
    selectedType,
    setSelectedType,
    viewMode,
    setViewMode,
    categoryMenuOpen,
    setCategoryMenuOpen,
    categoryMenuRef,
    menuHighlightCategoryId,
    setMenuHighlightCategoryId,
    panelSubs,
    panelSubsLoading,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
    categoryFilters,
    categoriesWithSubs,
    effectiveCategoryId,
    applyCategory,
    isFactoryTab,
    isMaterialTab,
    isMtCategoryScope,
    showcasesLoading,
    showcasesFetching,
    factoriesLoading,
    visibleItems,
    visibleIdeaItems,
    visibleFactories,
    totalCount,
    isListFiltered,
    categoryMenuTriggerLabel,
    closeCategoryMenu,
    pickSubCategory,
    categoryOptionSelected,
    getDetailPath,
    hubScope,
  } = useFactoryIdeasPageState({ layout: 'desktop' });

  return (
    <div className='hidden min-h-[calc(100vh-4rem)] bg-[var(--brand-page)] lg:block'>
      <div className='bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10'>
        <div className='px-8 2xl:px-10 py-4 space-y-4'>
          {fromHub ? (
            <FactoryIdeasHubBackButton hubScope={hubScope} label='กลับหมวดหมู่' className='mb-0' />
          ) : null}
          <div className='relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--brand-navy-deep)_0%,#4A267D_100%)] p-5 text-white shadow-md'>
            <div className='absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[var(--brand-orange-hot)] opacity-40 blur-2xl mix-blend-screen' />
            <div className='absolute right-0 top-0 h-28 w-28 translate-x-8 skew-x-[-15deg] rounded-full bg-[var(--brand-purple)] opacity-60' />
            <div className='absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-[var(--brand-purple)] opacity-30 blur-xl mix-blend-screen' />
            <div className='relative z-10 flex items-center gap-4'>
              <div className='shrink-0 rounded-full border border-[rgba(162,56,255,0.50)] bg-[rgba(162,56,255,0.30)] p-2.5'>
                <Sparkles size={20} className='text-white' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='mb-0.5 text-sm font-medium text-[#EBD3FF]'>
                  พื้นที่โปรโมตจากโรงงานพาร์ทเนอร์
                </p>
                <h2 className='text-base font-bold leading-tight'>
                  ค้นหาไอเดียสินค้าใหม่ พร้อมโรงงานที่ทำได้จริงในที่เดียว
                </h2>
              </div>
              <span className='shrink-0 text-sm font-semibold text-[#EBD3FF]'>
                {totalCount} รายการ
              </span>
            </div>
          </div>

          <div className='flex h-9 w-full items-center gap-2'>
            <div className='flex h-9 shrink-0 items-center gap-0.5 rounded-lg bg-[rgba(46,34,82,0.06)] p-0.5'>
              {CONTENT_TYPES.map((type) => (
                <Button
                  variant='unstyled'
                  key={type.id}
                  type='button'
                  data-tour={`tab-${type.id}`}
                  onClick={() => setSelectedType(type.id)}
                  className={`inline-flex h-8 min-w-[4.25rem] items-center justify-center rounded-md px-3 text-xs transition-all ${
                    selectedType === type.id
                      ? 'bg-[var(--brand-orange-deep)] font-semibold text-[var(--neutral-white)] shadow-[0_1px_6px_rgba(227,136,68,0.3)]'
                      : 'font-medium text-[var(--brand-navy)] hover:bg-white/60'
                  }`}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {!isFactoryTab && (
              <>
                <div className='h-5 w-px shrink-0 bg-gray-200' />

                <FactoryIdeasCategoryDropdown
                  variant='desktop'
                  categoryMenuRef={categoryMenuRef}
                  categoryMenuOpen={categoryMenuOpen}
                  setCategoryMenuOpen={setCategoryMenuOpen}
                  categoryFilters={categoryFilters}
                  effectiveCategoryId={effectiveCategoryId}
                  selectedSubCategoryId={selectedSubCategoryId}
                  setSelectedSubCategoryId={setSelectedSubCategoryId}
                  isMaterialTab={isMtCategoryScope}
                  categoryMenuTriggerLabel={categoryMenuTriggerLabel}
                  menuHighlightCategoryId={menuHighlightCategoryId}
                  setMenuHighlightCategoryId={setMenuHighlightCategoryId}
                  panelSubs={panelSubs}
                  panelSubsLoading={panelSubsLoading}
                  applyCategory={applyCategory}
                  closeCategoryMenu={closeCategoryMenu}
                  pickSubCategory={pickSubCategory}
                  categoryOptionSelected={categoryOptionSelected}
                  categoriesWithSubs={categoriesWithSubs}
                />
              </>
            )}

            <FactoryIdeasSearchBar
              className='h-9 min-w-0 flex-1'
              fieldClassName='h-9 min-h-9 py-0 text-xs'
              searchText={searchText}
              onSearchTextChange={setSearchText}
              moqFilter={moqFilter}
              onMoqFilterChange={setMoqFilter}
            />

            <div className='flex h-9 shrink-0 items-center gap-0.5 rounded-lg border border-gray-200 bg-[var(--neutral-warm-surface)] p-0.5'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setViewMode('grid')}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md p-0 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[var(--neutral-white)] text-[var(--brand-mauve)] shadow-sm'
                    : 'text-[var(--neutral-placeholder)] hover:text-gray-500'
                }`}
              >
                <LayoutGrid size={14} />
              </Button>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setViewMode('list')}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md p-0 transition-all ${
                  viewMode === 'list'
                    ? 'bg-[var(--neutral-white)] text-[var(--brand-mauve)] shadow-sm'
                    : 'text-[var(--neutral-placeholder)] hover:text-gray-500'
                }`}
              >
                <List size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`px-8 2xl:px-10 py-6 transition-opacity duration-200 ${showcasesFetching ? 'opacity-50 pointer-events-none' : ''}`}>
        <TabSwipeContent activeKey={selectedType} tabOrder={factoryIdeasTabOrder}>
        {showcasesLoading || factoriesLoading ? (
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm gap-2'>
            <Loader2 className='h-8 w-8 animate-spin text-[var(--brand-mauve)]' />
            <p className='text-sm text-gray-500'>กำลังโหลดจากเซิร์ฟเวอร์…</p>
          </div>
        ) : totalCount === 0 && isListFiltered ? (
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm'>
            <SearchX size={36} className='mb-3 text-gray-400' />
            <p className='text-[14px] font-medium text-[var(--brand-navy)]'>
              ไม่พบรายการที่ตรงกับเงื่อนไข
            </p>
            <p className='text-[12px] text-gray-400 mt-1'>ลองเปลี่ยนคีย์เวิร์ด ขั้นต่ำการผลิต หรือหมวดหมู่</p>
          </div>
        ) : totalCount === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm'>
            <Sparkles size={36} className='mb-3 text-gray-400' />
            <p className='text-[14px] font-medium text-[var(--brand-navy)]'>
              เรากำลังเตรียมรายการแนะนำจากโรงงานพาร์ทเนอร์ให้คุณ
            </p>
            <p className='text-[12px] text-gray-400 mt-1'>กรุณากลับมาดูอีกครั้งในเร็วๆ นี้</p>
          </div>
        ) : isFactoryTab ? (
          viewMode === 'list' ? (
            <div className='space-y-2'>
              {visibleFactories.map((factory) => (
                <article
                  key={factory.id}
                  className='group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md'
                  onClick={() => navigate(`/factories/${factory.id}`)}
                >
                  <div className='flex items-center gap-4 p-4'>
                    <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100'>
                      <ImageWithFallback
                        src={factory.image}
                        alt={factory.name}
                        className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                      />
                      {factory.verified ? (
                        <div className='absolute left-1 top-1 z-[1] flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 backdrop-blur-sm'>
                          <BadgeCheck className='h-2.5 w-2.5 shrink-0 text-[var(--brand-purple)]' />
                          <span className='text-[8px] font-medium text-[var(--brand-purple)]'>
                            ยืนยัน
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h3 className='truncate text-[13px] font-bold text-[var(--brand-navy)]'>
                        {factory.name}
                      </h3>
                      <div className='mt-1 flex items-center gap-1 text-[11px] text-gray-500'>
                        <MapPin className='h-3 w-3 shrink-0 text-gray-400' />
                        <span className='truncate'>
                          {(factory.provinceName ?? factory.location).trim() || '—'}
                        </span>
                      </div>
                      <div className='mt-2 flex items-center justify-between gap-3 text-[11px] text-gray-400'>
                        <span className='inline-flex items-center gap-0.5 font-semibold text-gray-700'>
                          <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
                          {factory.rating}
                          <span className='font-normal text-gray-400'>({factory.reviews})</span>
                        </span>
                        <span>
                          MOQ{' '}
                          <span className='font-semibold text-[var(--brand-navy)]'>
                            {factory.minOrder}
                          </span>{' '}
                          {resolveUnitLabel(undefined, factory.minOrderUnit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
          <div className='grid grid-cols-5 gap-2 2xl:grid-cols-6'>
            {visibleFactories.map((factory) => (
              <article
                key={factory.id}
                className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col'
                onClick={() => navigate(`/factories/${factory.id}`)}
              >
                <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
                  <ImageWithFallback
                    src={factory.image}
                    alt={factory.name}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none' />
                  {factory.verified && (
                    <div className='absolute top-1 left-1 z-[1] flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5'>
                      <BadgeCheck className='h-2.5 w-2.5 shrink-0 text-[var(--brand-purple)]' />
                      <span className='text-[8px] font-medium text-[var(--brand-purple)]'>
                        ยืนยัน
                      </span>
                    </div>
                  )}
                </div>
                <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                  <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                    {factory.name}
                  </p>
                  <div className='flex items-center gap-0.5'>
                    <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                    <span className='text-gray-500 text-[10px] truncate'>
                      {(factory.provinceName ?? factory.location).trim() || '—'}
                    </span>
                  </div>
                  <div className='mt-auto pt-1 border-t border-gray-50'>
                    <div className='flex items-center justify-between min-w-0'>
                      <div className='flex items-center gap-0.5 min-w-0'>
                        <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                        <span className='text-gray-700 text-[10px] font-semibold'>
                          {factory.rating}
                        </span>
                        <span className='text-gray-400 text-[9px] truncate'>
                          ({factory.reviews})
                        </span>
                      </div>
                      <span className='text-gray-400 text-[8px] shrink-0'>
                        ขั้นต่ำ {factory.minOrder}{' '}
                        {resolveUnitLabel(undefined, factory.minOrderUnit)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          )
        ) : selectedType === 'all' ? (
          <div>
            <DesktopRecommendedFactoriesRow
              factories={visibleFactories}
              onFactoryClick={(id) => navigate(`/factories/${id}`)}
              onSeeAll={() => setSelectedType('factory')}
            />
            {visibleItems.length > 0 ? (
              viewMode === 'grid' ? (
                <DesktopShowcaseGrid
                  title='สินค้าและวัตถุดิบ'
                  items={visibleItems}
                  isLiked={isLiked}
                  toggleFavorite={toggleFavorite}
                  navigate={navigate}
                  getDetailPath={getDetailPath}
                />
              ) : (
                <DesktopShowcaseList
                  title='สินค้าและวัตถุดิบ'
                  items={visibleItems}
                  dataFactories={data.factories}
                  isLiked={isLiked}
                  toggleFavorite={toggleFavorite}
                  navigate={navigate}
                  getDetailPath={getDetailPath}
                />
              )
            ) : null}
          </div>
        ) : selectedType === 'idea' ? (
          <div className='grid grid-cols-2 gap-2'>
            {visibleIdeaItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              return (
                <IdeaArticleCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  excerpt={item.excerpt}
                  factoryName={item.factoryName}
                  factoryVerified={factory?.verified}
                  isLiked={isLiked(item.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                />
              );
            })}
          </div>
        ) : viewMode === 'grid' ? (
          <DesktopShowcaseGrid
            items={visibleItems}
            isLiked={isLiked}
            toggleFavorite={toggleFavorite}
            navigate={navigate}
            getDetailPath={getDetailPath}
          />
        ) : (
          <DesktopShowcaseList
            items={visibleItems}
            dataFactories={data.factories}
            isLiked={isLiked}
            toggleFavorite={toggleFavorite}
            navigate={navigate}
            getDetailPath={getDetailPath}
          />
        )}
        </TabSwipeContent>
      </div>
    </div>
  );
}
