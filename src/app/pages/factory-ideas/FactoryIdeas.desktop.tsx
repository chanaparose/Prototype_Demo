import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  BadgeCheck,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  SearchX,
  Star,
} from 'lucide-react';
import { FactoryIdeasCategoryDropdown } from '@/components/features/factory-ideas/FactoryIdeasCategoryDropdown';
import { isFromFactoryIdeasHub } from '@/components/features/factory-ideas/factoryIdeasHubNav';
import { FactoryIdeasPageHeader, FactoryIdeasHeaderBackdrop } from '@/components/features/factory-ideas/FactoryIdeasPageHeader';
import { FactoryIdeasTypeTabs } from '@/components/features/factory-ideas/FactoryIdeasTypeTabs';
import { IdeaArticleCard } from '@/components/features/factory-ideas/IdeaArticleCard';
import { useFactoryIdeasPageState } from '@/pages/factory-ideas/useFactoryIdeasPageState';
import {
  factoryIdeasContentTypeBadge as contentTypeBadge,
  factoryIdeasContentTypeLabel as contentTypeLabel,
  factoryIdeasSearchPlaceholder,
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
            className='group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:border-brand-purple/20'
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
    hubName,
    visibleTabIds,
  } = useFactoryIdeasPageState({ layout: 'desktop' });
  const visibleTypes = CONTENT_TYPES.filter((type) => visibleTabIds.has(type.id));

  return (
    <div className='hidden min-h-[calc(100vh-4rem)] bg-[var(--brand-page)] lg:block'>
      <div className='sticky top-0 z-10'>
        <div className='relative overflow-hidden border-b border-gray-100/80'>
          <FactoryIdeasHeaderBackdrop />
          <div className='relative z-10 px-8 py-4 2xl:px-10'>
            <FactoryIdeasPageHeader
              title={hubName ? `แนะนำโรงงาน · ${hubName}` : 'แนะนำโรงงาน'}
              count={`${totalCount} รายการ`}
              hubScope={hubScope}
              showBack={fromHub}
            />

            <div className='mt-3 flex w-full items-center gap-2'>
            <FactoryIdeasTypeTabs
              tabs={visibleTypes}
              activeType={selectedType}
              onTypeChange={setSelectedType}
              className='shrink-0'
            />

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
              searchPlaceholder={factoryIdeasSearchPlaceholder(selectedType)}
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
      </div>

      <div className={`px-8 py-6 transition-opacity duration-200 2xl:px-10 ${showcasesFetching ? 'opacity-50 pointer-events-none' : ''}`}>
        <TabSwipeContent activeKey={selectedType} tabOrder={factoryIdeasTabOrder}>
        {showcasesLoading || factoriesLoading ? (
          <div className='flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white'>
            <Loader2 className='h-8 w-8 animate-spin text-[var(--brand-mauve)]' />
            <p className='text-sm text-gray-500'>กำลังโหลดจากเซิร์ฟเวอร์…</p>
          </div>
        ) : totalCount === 0 && isListFiltered ? (
          <div className='flex h-64 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white'>
            <SearchX size={36} className='mb-3 text-gray-400' />
            <p className='text-[14px] font-medium text-[var(--brand-navy)]'>
              ไม่พบรายการที่ตรงกับเงื่อนไข
            </p>
            <p className='text-[12px] text-gray-400 mt-1'>ลองเปลี่ยนคีย์เวิร์ด ขั้นต่ำการผลิต หรือหมวดหมู่</p>
          </div>
        ) : totalCount === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white'>
            <SearchX size={36} className='mb-3 text-gray-400' />
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
                  className='group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:border-brand-purple/20'
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
                className='group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition-all hover:border-brand-purple/20'
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
