import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Search,
  BadgeCheck,
  Sparkles,
  LayoutGrid,
  List,
  X,
  Loader2,
  MapPin,
  Star,
} from 'lucide-react';
import { FactoryIdeasCategoryDropdown } from '@/components/features/factory-ideas/FactoryIdeasCategoryDropdown';
import { useFactoryIdeasPageState } from '@/pages/factory-ideas/useFactoryIdeasPageState';
import {
  factoryIdeasContentTypeBadge as contentTypeBadge,
  factoryIdeasContentTypeLabel as contentTypeLabel,
  factoryIdeasContentTypes as CONTENT_TYPES,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import { Input } from '@/components/ui/input';

export function FactoryIdeasDesktop() {
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
    showcasesLoading,
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
  } = useFactoryIdeasPageState({ layout: 'desktop' });

  return (
    <div className='hidden min-h-[calc(100vh-4rem)] bg-[var(--brand-page)] lg:block'>
      <div className='bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10'>
        <div className='px-8 py-4 space-y-4'>
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

          <div className='flex items-center gap-3 flex-wrap'>
            <div className='flex items-center gap-1 rounded-xl bg-[rgba(46,34,82,0.07)] p-1'>
              {CONTENT_TYPES.map((type) => (
                <Button
                  variant='unstyled'
                  key={type.id}
                  type='button'
                  data-tour={`tab-${type.id}`}
                  onClick={() => setSelectedType(type.id)}
                  className={`rounded-lg px-4 py-2 text-[13px] transition-all ${
                    selectedType === type.id
                      ? 'bg-[var(--brand-orange-deep)] font-bold text-[var(--neutral-white)] shadow-[0_2px_8px_rgba(227,136,68,0.35)]'
                      : 'font-medium text-[var(--brand-navy)] hover:opacity-80'
                  }`}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            <div className='w-px h-6 bg-gray-200' />

            <FactoryIdeasCategoryDropdown
              variant='desktop'
              categoryMenuRef={categoryMenuRef}
              categoryMenuOpen={categoryMenuOpen}
              setCategoryMenuOpen={setCategoryMenuOpen}
              categoryFilters={categoryFilters}
              effectiveCategoryId={effectiveCategoryId}
              selectedSubCategoryId={selectedSubCategoryId}
              setSelectedSubCategoryId={setSelectedSubCategoryId}
              isMaterialTab={isMaterialTab}
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

            <div className='flex w-64 items-center gap-2 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-warm-surface)] px-3.5 py-2.5 transition-all'>
              <Search size={14} className='text-gray-400 shrink-0' />
              <Input
                type='text'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='ค้นหาไอเดีย, สินค้า, โรงงาน…'
                className='flex-1 bg-transparent text-[13px] text-[var(--brand-navy)] outline-none placeholder-gray-400'
              />
              {searchText && (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => setSearchText('')}
                  aria-label='ล้างข้อความค้นหา'
                  className='text-gray-400 hover:text-gray-600'
                >
                  <X size={12} />
                </Button>
              )}
            </div>

            <div className='flex-1' />

            <div className='flex items-center gap-1 rounded-xl border border-gray-200 bg-[var(--neutral-warm-surface)] p-1'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[var(--neutral-white)] text-[var(--brand-mauve)] shadow-sm'
                    : 'text-[var(--neutral-placeholder)]'
                }`}
              >
                <LayoutGrid size={15} />
              </Button>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-[var(--neutral-white)] text-[var(--brand-mauve)] shadow-sm'
                    : 'text-[var(--neutral-placeholder)]'
                }`}
              >
                <List size={15} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className='px-8 py-6'>
        {showcasesLoading || factoriesLoading ? (
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm gap-2'>
            <Loader2 className='h-8 w-8 animate-spin text-[var(--brand-mauve)]' />
            <p className='text-sm text-gray-500'>กำลังโหลดจากเซิร์ฟเวอร์…</p>
          </div>
        ) : totalCount === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm'>
            <p className='text-4xl mb-3'>🔍</p>
            <p className='text-[14px] font-medium text-[var(--brand-navy)]'>
              ไม่พบรายการที่ตรงกับเงื่อนไข
            </p>
            <p className='text-[12px] text-gray-400 mt-1'>ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>
        ) : isFactoryTab ? (
          <div className='grid grid-cols-4 gap-3'>
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
                        ขั้นต่ำ {factory.minOrder}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : selectedType === 'idea' ? (
          <div className='grid grid-cols-2 gap-4'>
            {visibleIdeaItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              return (
                <article
                  key={item.id}
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                  className='relative bg-white rounded-xl border border-gray-100 p-3 pr-10 hover:shadow-md transition-shadow cursor-pointer group min-h-[100px]'
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
                  <h3 className='font-bold text-[13px] text-brand-navy-ink mb-1 line-clamp-2 leading-snug group-hover:text-brand-magenta transition-colors'>
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
          <div className='grid grid-cols-5 gap-2'>
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col'
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
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
                    <div>
                      <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                        {item.title}
                      </p>
                      <div className='flex items-center gap-0.5 mt-0.5'>
                        <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                        <span className='text-gray-500 text-[10px] truncate'>
                          {(factory?.provinceName ?? factory?.location ?? '').trim() || '—'}
                        </span>
                    </div>
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
          <div className='space-y-2'>
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
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
                            </span>
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
        )}

        {selectedType === 'all' && visibleMaterialItems.length > 0 && (
          <div className='mt-8'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='flex items-center gap-2 text-base font-bold text-[var(--brand-navy)]'>
                <Sparkles className='h-5 w-5 text-[var(--brand-teal-light)]' />
                วัตถุดิบแนะนำ
              </h3>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setSelectedType('material')}
                className='text-[13px] font-medium text-[var(--brand-mauve)] transition-opacity hover:opacity-80'
              >
                ดูทั้งหมด ({visibleMaterialItems.length})
              </Button>
            </div>
            <div className='grid grid-cols-5 gap-2'>
              {visibleMaterialItems.slice(0, 5).map((item) => {
                const factory = data.factories.find((f) => f.id === item.factoryId);
                return (
                  <article
                    key={`mt-top-${item.id}`}
                    className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col'
                    onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                  >
                    <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                      <span className='absolute left-1 top-1 z-[1] rounded-full bg-[var(--brand-teal-light)] px-1.5 py-0.5 text-[8px] font-bold text-white'>
                        วัตถุดิบ
                      </span>
                      <ShowcaseHeartButton
                        showcaseId={item.id}
                        isLiked={isLiked(item.id)}
                        onToggle={toggleFavorite}
                        className='absolute top-1 right-1 z-[1]'
                      />
                    </div>
                    <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                      <div>
                        <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                          {item.title}
                        </p>
                        <div className='flex items-center gap-0.5 mt-0.5'>
                          <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                          <span className='text-gray-500 text-[10px] truncate'>
                            {(factory?.provinceName ?? factory?.location ?? '').trim() || '—'}
                          </span>
                        </div>
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
          </div>
        )}

        {selectedType === 'all' && visibleFactories.length > 0 && (
          <div className='mt-8'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='flex items-center gap-2 text-base font-bold text-[var(--brand-navy)]'>
                <MapPin className='h-5 w-5 text-[var(--brand-teal)]' />
                โรงงานแนะนำ
              </h3>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setSelectedType('factory')}
                className='text-[13px] font-medium text-[var(--brand-mauve)] transition-opacity hover:opacity-80'
              >
                ดูทั้งหมด ({visibleFactories.length})
              </Button>
            </div>
            <div className='grid grid-cols-5 gap-2'>
              {visibleFactories.slice(0, 5).map((factory) => (
                <div
                  key={`fac-${factory.id}`}
                  onClick={() => navigate(`/factories/${factory.id}`)}
                  className='bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col'
                >
                  <div className='aspect-[4/3] relative overflow-hidden bg-gray-100'>
                    <ImageWithFallback
                      src={factory.image}
                      alt={factory.name}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                    />
                    {factory.verified === true && (
                      <div className='absolute top-1 left-1 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5'>
                        <BadgeCheck className='w-2.5 h-2.5 text-brand-purple' />
                        <span className='text-[8px] font-medium text-[var(--brand-purple)]'>
                          ยืนยัน
                    </span>
                      </div>
                    )}
                  </div>
                  <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                    <div>
                      <h3 className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                      {factory.name}
                    </h3>
                      <div className='flex items-center gap-0.5 mt-0.5'>
                        <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                        <span className='text-gray-500 text-[10px] truncate'>
                          {(factory.provinceName ?? factory.location).trim() || '—'}
                        </span>
                    </div>
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
                          ขั้นต่ำ {factory.minOrder}
                        </span>
                  </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedType === 'all' && visibleIdeaItems.length > 0 && (
          <div className='mt-8'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='flex items-center gap-2 text-base font-bold text-[var(--brand-navy)]'>
                <Sparkles className='h-5 w-5 text-[var(--brand-mauve)]' />
                บทความ Idea
              </h3>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setSelectedType('idea')}
                className='text-[13px] font-medium text-[var(--brand-mauve)] transition-opacity hover:opacity-80'
              >
                ดูทั้งหมด ({visibleIdeaItems.length})
              </Button>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              {visibleIdeaItems.slice(0, 6).map((item) => {
                const factory = data.factories.find((f) => f.id === item.factoryId);
                return (
                  <article
                    key={`idea-${item.id}`}
                    onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                    className='relative bg-white rounded-xl border border-gray-100 p-3 pr-10 hover:shadow-md transition-shadow cursor-pointer group min-h-[100px]'
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
                    <h3 className='font-bold text-[13px] text-brand-navy-ink mb-1 line-clamp-2 leading-snug group-hover:text-brand-magenta transition-colors'>
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
          </div>
        )}
      </div>
    </div>
  );
}
