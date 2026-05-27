import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  BadgeCheck,
  Sparkles,
  LayoutGrid,
  List,
  MapPin,
  Star,
} from 'lucide-react';
import {
  ShowcaseGridCardSkeleton,
  ShowcaseListItemSkeleton,
  IdeaListItemSkeleton,
  FactoryGridCardSkeleton,
} from '@/components/skeletons/PageSkeletons';
import { FactoryIdeasCategoryDropdown } from '@/components/features/factory-ideas/FactoryIdeasCategoryDropdown';
import { useFactoryIdeasPageState } from '@/pages/factory-ideas/useFactoryIdeasPageState';
import {
  factoryIdeasContentTypeBadge as contentTypeBadge,
  factoryIdeasContentTypeLabel as contentTypeLabel,
  type FactoryIdeasContentType,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import { MobileSearchField } from '@/components/shared/MobileSearchField';
import { TabSwipeContent } from '@/components/layout/TabSwipeContent';
import {
  factoryIdeasTabOrder,
  factoryIdeasFactoryScopeOrder,
} from '@/components/features/factory-ideas/factoryIdeasTheme';

const MOBILE_TABS: { id: FactoryIdeasContentType; label: string }[] = [
  { id: 'all',      label: 'ทั้งหมด' },
  { id: 'product',  label: 'สินค้า'  },
  { id: 'material', label: 'วัตถุดิบ' },
  { id: 'idea',     label: 'ไอเดีย'  },
  { id: 'factory',  label: 'โรงงาน'  },
];

export function FactoryIdeasMobile() {
  const navigate = useNavigate();
  const {
    data,
    isLiked,
    toggleFavorite,
    searchText,
    setSearchText,
    selectedType,
    setSelectedType,
    viewMode,
    setViewMode,
    categoryMenuOpen,
    setCategoryMenuOpen,
    categoryMenuStep,
    setCategoryMenuStep,
    categoryMenuRef,
    menuHighlightCategoryId,
    setMenuHighlightCategoryId,
    panelSubs,
    panelSubsLoading,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
    categoryFilters,
    effectiveCategoryId,
    applyCategory,
    isFactoryTab,
    isMaterialTab,
    isMtCategoryScope,
    factoryScope,
    setFactoryScope,
    showcasesLoading,
    showcasesFetching,
    factoriesLoading,
    visibleItems,
    visibleIdeaItems,
    visibleMaterialItems,
    visibleFactories,
    totalCount,
    categoryMenuTriggerLabel,
    closeCategoryMenu,
    pickSubCategory,
    categoryOptionSelected,
    getDetailPath,
  } = useFactoryIdeasPageState({ layout: 'mobile', initialType: 'all' });

  return (
    <div className='min-h-screen bg-[var(--brand-page)] pb-24'>
      <div className='bg-white px-4 pt-4 pb-3 border-b border-gray-100'>
        <div className='mb-2.5'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
            Discover
          </p>
          <h1 className='text-lg font-bold leading-tight text-[var(--brand-navy)]'>แนะนำโรงงาน</h1>
        </div>

        <div className='relative mb-2.5 overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--brand-navy-deep)_0%,#4A267D_100%)] px-3 py-2.5 text-white shadow-md'>
          <div className='pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[var(--brand-orange-hot)] opacity-35 blur-xl mix-blend-screen' />
          <div className='pointer-events-none absolute right-0 top-0 h-16 w-16 translate-x-5 skew-x-[-15deg] rounded-full bg-[var(--brand-purple)] opacity-50' />
          <div className='pointer-events-none absolute -bottom-2 -left-2 h-14 w-14 rounded-full bg-[var(--brand-purple)] opacity-25 blur-lg mix-blend-screen' />
          <div className='relative z-10 flex items-center gap-2.5'>
            <div className='flex shrink-0 items-center justify-center rounded-full border border-[rgba(162,56,255,0.50)] bg-[rgba(162,56,255,0.30)] p-1.5'>
              <Sparkles size={16} className='text-white' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='mb-0.5 text-[11px] font-medium leading-snug text-[#EBD3FF]'>
                พื้นที่โปรโมตจากโรงงานพาร์ทเนอร์
              </p>
              <h2 className='text-[13px] font-bold leading-snug line-clamp-2'>
                ค้นหาไอเดียสินค้าใหม่ พร้อมโรงงานที่ทำได้จริงในที่เดียว
              </h2>
            </div>
            <span className='self-center rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums text-[#EBD3FF]'>
              {totalCount} รายการ
            </span>
          </div>
        </div>

        <MobileSearchField
          value={searchText}
          onChange={setSearchText}
          placeholder='ค้นหาไอเดีย สินค้า หรือชื่อโรงงาน…'
        />
      </div>

      <div className='bg-white sticky top-14 z-20 border-b border-gray-200'>
        {/* ── Lezhin-style tab bar ── */}
        <div className='flex overflow-x-auto scrollbar-hide'>
          {MOBILE_TABS.map((tab) => {
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                data-tour={`tab-${tab.id}`}
                onClick={() => setSelectedType(tab.id)}
                className='relative flex-1 min-w-0 shrink-0 py-3 px-2 text-center'
              >
                <span
                  className={`text-[14px] leading-none whitespace-nowrap ${
                    active
                      ? 'font-bold text-[var(--brand-navy)]'
                      : 'font-medium text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
                {active && (
                  <span
                    className='absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full'
                    style={{ background: 'var(--brand-purple)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Factory type pills (factory tab only) ── */}
        {isFactoryTab && (
          <div className='flex items-center gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide'>
            {(
              [
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'PD',  label: 'โรงงานผลิต' },
                { value: 'MT',  label: 'โรงงานวัตถุดิบ' },
              ] as const
            ).map((opt) => {
              const active = factoryScope === opt.value;
              return (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => setFactoryScope(opt.value)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all ${
                    active
                      ? 'border-[var(--brand-purple)] bg-[var(--brand-purple)] text-white shadow-[0_2px_8px_rgba(162,56,255,0.28)]'
                      : 'border-gray-200 bg-white text-gray-500 active:scale-95'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        <div className='flex flex-wrap items-center gap-2 px-4 pb-3 mt-3'>
          <FactoryIdeasCategoryDropdown
            variant='mobile'
            categoryMenuRef={categoryMenuRef}
            categoryMenuOpen={categoryMenuOpen}
            setCategoryMenuOpen={setCategoryMenuOpen}
            categoryMenuStep={categoryMenuStep}
            setCategoryMenuStep={setCategoryMenuStep}
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
          />
 
          <div className='flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-200 bg-[var(--neutral-warm-surface)] p-0.5'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-[var(--neutral-white)] text-[var(--brand-mauve)] shadow-sm'
                  : 'text-[var(--neutral-placeholder)]'
              }`}
              aria-label='มุมมองตาราง'
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-[var(--neutral-white)] text-[var(--brand-mauve)] shadow-sm'
                  : 'text-[var(--neutral-placeholder)]'
              }`}
              aria-label='มุมมองรายการ'
            >
              <List size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className={`px-4 pt-4 transition-opacity duration-200 ${showcasesFetching ? 'opacity-50 pointer-events-none' : ''}`}>
        <TabSwipeContent activeKey={selectedType} tabOrder={factoryIdeasTabOrder}>
        {showcasesLoading || factoriesLoading ? (
          isFactoryTab ? (
            <div className='grid grid-cols-2 gap-2'>
              {[...Array(6)].map((_, i) => <FactoryGridCardSkeleton key={i} />)}
            </div>
          ) : selectedType === 'idea' ? (
            <div className='grid grid-cols-1 gap-2'>
              {[...Array(4)].map((_, i) => <IdeaListItemSkeleton key={i} />)}
            </div>
          ) : viewMode === 'list' ? (
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => <ShowcaseListItemSkeleton key={i} />)}
            </div>
          ) : (
            <div className='grid grid-cols-2 gap-2'>
              {[...Array(6)].map((_, i) => <ShowcaseGridCardSkeleton key={i} />)}
            </div>
          )
        ) : totalCount === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm'>
            <p className='text-3xl mb-2'>🔍</p>
            <p className='text-sm font-medium text-[var(--brand-navy)]'>
              ไม่พบรายการที่ตรงกับเงื่อนไข
            </p>
            <p className='text-xs text-gray-400 mt-1'>ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>
        ) : isFactoryTab ? (
          <TabSwipeContent activeKey={factoryScope} tabOrder={factoryIdeasFactoryScopeOrder}>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
            {visibleFactories.map((factory) => (
              <article
                key={factory.id}
                className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]'
                onClick={() => navigate(`/factories/${factory.id}`)}
              >
                <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
                  <ImageWithFallback
                    src={factory.image}
                    alt={factory.name}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  />
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
                      <div className='flex items-center gap-0.5 shrink-0'>
                        <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                        <span className='text-gray-700 text-[10px] font-semibold'>
                          {factory.rating}
                        </span>
                        <span className='text-gray-400 text-[9px]'>({factory.reviews})</span>
                      </div>
                      <span className='text-gray-400 text-[8px] shrink-0'>
                        ขั้นต่ำ {factory.minOrder}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          </TabSwipeContent>
        ) : selectedType === 'idea' ? (
          <div className='grid grid-cols-1 gap-2'>
            {visibleIdeaItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              return (
                <article
                  key={item.id}
                  className='relative bg-white rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer p-3 pr-10'
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <ShowcaseHeartButton
                    showcaseId={item.id}
                    isLiked={isLiked(item.id)}
                    onToggle={toggleFavorite}
                    className='absolute top-2 right-2 z-[1]'
                  />
                  <div className='flex items-center gap-2 mb-1.5'>
                    <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[10px] font-bold text-brand-magenta uppercase tracking-wide'>
                      ไอเดีย
                    </span>
                    <span className='text-[10px] text-gray-400 truncate'>{item.factoryName}</span>
                  </div>
                  <h3 className='font-bold text-[13px] text-brand-navy-ink mb-1 line-clamp-2 leading-snug'>
                    {item.title}
                  </h3>
                  <p className='text-[12px] text-gray-500 line-clamp-2'>{item.excerpt || ' '}</p>
                  <div className='mt-2 pt-1.5 border-t border-gray-100'>
                    <span className='text-[10px] text-gray-400'>แตะเพื่ออ่านต่อ</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : viewMode === 'grid' ? (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]'
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                    />
                    <span
                      className='absolute left-1 top-1 z-[1] rounded-full bg-[var(--factory-idea-badge)] px-1.5 py-0.5 text-[8px] font-bold text-white'
                      style={{ '--factory-idea-badge': badgeColor } as React.CSSProperties}
                    >
                      {contentTypeLabel[item.contentType]}
                    </span>
                    <ShowcaseHeartButton
                      showcaseId={item.id}
                      isLiked={isLiked(item.id)}
                      onToggle={toggleFavorite}
                      className='absolute top-1 right-1 z-[1]'
                    />
                  </div>

                  <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                    <h3 className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                      {item.title}
                    </h3>

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
                        <span className='text-gray-400 text-[8px] shrink-0'>
                          ขั้นต่ำ {item.minOrder}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className='space-y-3'>
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className='h-[130px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform cursor-pointer'
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className='flex h-full p-3 gap-3'>
                    <div className='relative w-[100px] shrink-0 rounded-xl overflow-hidden bg-gray-100'>
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className='w-full h-full object-cover'
                      />
                      <span
                        className='absolute left-1.5 top-1.5 z-[1] rounded-full bg-[var(--factory-idea-badge)] px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm'
                        style={{ '--factory-idea-badge': badgeColor } as React.CSSProperties}
                      >
                        {contentTypeLabel[item.contentType]}
                      </span>
                      <ShowcaseHeartButton
                        showcaseId={item.id}
                        isLiked={isLiked(item.id)}
                        onToggle={toggleFavorite}
                        className='absolute top-1 right-1 z-[1]'
                      />
                    </div>

                    <div className='flex flex-col flex-1 min-w-0 justify-between'>
                      <div className='min-w-0'>
                        {item.category && (
                          <p className='text-[9px] text-gray-400 truncate mb-0.5'>
                            {item.category}
                          </p>
                        )}
                        <h3 className='line-clamp-2 min-w-0 text-[12px] font-bold leading-snug text-[var(--brand-navy)]'>
                          {item.title}
                        </h3>
                        <p className='text-[10px] leading-[15px] text-gray-500 line-clamp-2 mt-1'>
                          {item.excerpt || ' '}
                        </p>
                      </div>

                      <div className='flex items-center justify-between gap-2 mt-auto pt-1.5 border-t border-gray-50 min-w-0'>
                        <Button
                          variant='unstyled'
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/factories/${item.factoryId}`);
                          }}
                          className='flex min-w-0 items-center gap-1 text-left text-[10px] font-semibold text-[var(--brand-navy)] active:opacity-80'
                        >
                          <span className='truncate'>{item.factoryName}</span>
                          {factory?.verified && (
                            <BadgeCheck className='h-3 w-3 shrink-0 text-[var(--brand-mauve)]' />
                          )}
                        </Button>
                        <span className='text-[9px] text-gray-400 shrink-0'>
                          ขั้นต่ำ{' '}
                          <span className='font-semibold tabular-nums text-[var(--brand-navy)]'>
                            {item.minOrder}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </TabSwipeContent>
      </div>
    </div>
  );
}
