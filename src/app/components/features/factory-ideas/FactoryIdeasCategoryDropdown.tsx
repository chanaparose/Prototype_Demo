import type { RefObject } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@lib/utils';
import {
  factoryIdeasFilterButtonClass,
  factoryIdeasFilterButtonSizeClass,
  factoryIdeasTheme as COLORS,
} from '@/components/features/factory-ideas/factoryIdeasTheme';

type CategoryRow = { id: string; name: string };
type SubCategoryRow = { id: string; name: string; sortOrder: number };

type FactoryIdeasCategoryDropdownProps = {
  variant: 'desktop' | 'mobile';
  triggerVariant?: 'bar' | 'chip' | 'filter';
  categoryMenuRef: RefObject<HTMLDivElement | null>;
  categoryMenuOpen: boolean;
  setCategoryMenuOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  categoryMenuStep?: 'categories' | 'subs';
  setCategoryMenuStep?: (value: 'categories' | 'subs') => void;
  categoryFilters: CategoryRow[];
  effectiveCategoryId: string;
  selectedSubCategoryId: string | null;
  setSelectedSubCategoryId: (value: string | null) => void;
  isMaterialTab: boolean;
  categoryMenuTriggerLabel: string;
  menuHighlightCategoryId: string | null;
  setMenuHighlightCategoryId: (value: string | null) => void;
  panelSubs: SubCategoryRow[];
  panelSubsLoading: boolean;
  applyCategory: (categoryId: string) => void;
  closeCategoryMenu: () => void;
  pickSubCategory: (subId: string | null, categoryIdForApply: string) => void;
  categoryOptionSelected: (effectiveCategoryId: string, optionId: string) => boolean;
  /** IDs of categories that have ≥1 sub-category */
  categoriesWithSubs?: ReadonlySet<string>;
  className?: string;
};

export function FactoryIdeasCategoryDropdown({
  variant,
  triggerVariant = 'bar',
  categoryMenuRef,
  categoryMenuOpen,
  setCategoryMenuOpen,
  categoryMenuStep = 'categories',
  setCategoryMenuStep,
  categoryFilters,
  effectiveCategoryId,
  selectedSubCategoryId,
  setSelectedSubCategoryId,
  isMaterialTab,
  categoryMenuTriggerLabel,
  menuHighlightCategoryId,
  setMenuHighlightCategoryId,
  panelSubs,
  panelSubsLoading,
  applyCategory,
  closeCategoryMenu,
  pickSubCategory,
  categoryOptionSelected,
  categoriesWithSubs,
  className,
}: FactoryIdeasCategoryDropdownProps) {
  const hasSubs = (catId: string) => categoriesWithSubs?.has(catId) ?? !isMaterialTab;
  const categoryActive = effectiveCategoryId !== 'all';
  const chipLabel =
    categoryActive && categoryMenuTriggerLabel
      ? categoryMenuTriggerLabel
      : 'หมวดหมู่';

  if (variant === 'mobile') {
    const isChip = triggerVariant === 'chip';
    const isFilter = triggerVariant === 'filter';
    return (
      <div
        ref={categoryMenuRef}
        className={cn(
          'relative z-30',
          isChip || isFilter ? 'min-w-0' : 'min-w-[min(100%,10rem)] flex-1',
          className,
        )}
      >
        <Button
          variant='unstyled'
          type='button'
          onClick={() => setCategoryMenuOpen((o) => !o)}
          className={cn(
            isFilter
              ? `inline-flex w-full items-center justify-between gap-1.5 rounded-lg border transition-colors ${factoryIdeasFilterButtonSizeClass} ${factoryIdeasFilterButtonClass(categoryActive)}`
              : isChip
                ? `inline-flex h-8 w-full items-center justify-between gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${
                    categoryActive
                      ? 'border-brand-purple/30 bg-brand-lavender-chip/70 text-brand-violet-deep'
                      : 'border-gray-200/90 bg-white/80 text-slate-600'
                  }`
                : 'flex w-full items-center justify-between gap-1.5 rounded-lg border px-3 py-2 text-[12px] transition-all',
          )}
          style={
            isChip || isFilter
              ? undefined
              : {
                  borderColor: categoryActive ? COLORS.purple : 'var(--neutral-border)',
                  backgroundColor: categoryActive ? COLORS.lightPurpleBg : COLORS.gray,
                  color: categoryActive ? COLORS.purple : 'var(--neutral-subtle)',
                  fontWeight: categoryActive ? 600 : 400,
                }
          }
        >
          <span className='truncate'>
            {isChip || isFilter ? chipLabel : categoryMenuTriggerLabel}
          </span>
          <ChevronDown
            size={isFilter ? 13 : isChip ? 12 : 14}
            strokeWidth={2.25}
            className={cn(
              'shrink-0 transition-transform duration-200',
              categoryMenuOpen && 'rotate-180',
              (isChip || isFilter) && (categoryActive ? 'text-brand-purple' : 'text-slate-400'),
              isChip && !categoryActive && 'opacity-60',
            )}
          />
        </Button>
        {categoryMenuOpen && (
          <div
            className={
              isChip || isFilter
                ? 'absolute top-full left-0 z-50 mt-1.5 max-h-[50vh] w-max min-w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl'
                : 'absolute top-full left-0 right-0 z-40 mt-1 max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl'
            }
          >
            {categoryMenuStep === 'categories' ? (
              categoryFilters.map((cat) => {
                const selected = categoryOptionSelected(effectiveCategoryId, cat.id);
                const isAll = cat.id === 'all';
                return (
                  <Button
                    variant='unstyled'
                    key={isAll ? 'all' : `cat-${cat.id}`}
                    type='button'
                    onClick={() => {
                      if (isAll) {
                        applyCategory('all');
                        setSelectedSubCategoryId(null);
                        closeCategoryMenu();
                      } else if (!hasSubs(cat.id)) {
                        // No sub-categories (e.g. MT scope) → apply immediately
                        applyCategory(cat.id);
                        setSelectedSubCategoryId(null);
                        closeCategoryMenu();
                      } else {
                        // Has sub-categories → navigate to subs panel.
                        // Don't call applyCategory here — the URL change it triggers
                        // can cause a re-render that resets categoryMenuStep back to
                        // 'categories' before the subs panel renders.
                        // The category will be applied later inside pickSubCategory().
                        setMenuHighlightCategoryId(cat.id);
                        setCategoryMenuStep?.('subs');
                      }
                    }}
                    className='w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left text-[12px] transition-colors active:bg-gray-50'
                    style={{
                      color: selected ? COLORS.purple : 'var(--neutral-text)',
                      fontWeight: selected ? 600 : 400,
                      backgroundColor: selected ? COLORS.lightPurpleBg : 'transparent',
                    }}
                  >
                    <span className='truncate'>{cat.name}</span>
                    {!isAll && hasSubs(cat.id) && (
                      <ChevronRight size={16} className='shrink-0 text-gray-400' aria-hidden />
                    )}
                  </Button>
                );
              })
            ) : (
              <>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => setCategoryMenuStep?.('categories')}
                  className='w-full px-4 py-2.5 flex items-center gap-2 text-left text-[12px] font-medium active:bg-gray-50'
                  style={{ color: COLORS.purple }}
                >
                  <ChevronLeft size={18} className='shrink-0' aria-hidden />
                  หมวดหมู่
                </Button>
                <div className='mx-3 border-t border-gray-100' />
                {panelSubsLoading ? (
                  <div className='px-4 py-6 flex items-center justify-center gap-2 text-[12px] text-gray-500'>
                    <Loader2 className='w-4 h-4 animate-spin shrink-0' />
                    กำลังโหลดหมวดย่อย...
                  </div>
                ) : panelSubs.length === 0 ? (
                  <p className='px-4 py-4 text-center text-[12px] text-gray-500'>
                    ไม่มีหมวดย่อยในหมวดนี้
                  </p>
                ) : (
                  <>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => {
                        if (menuHighlightCategoryId) pickSubCategory(null, menuHighlightCategoryId);
                      }}
                      className='w-full px-4 py-2.5 text-left text-[12px] transition-colors active:bg-gray-50'
                      style={{
                        color: !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId ? COLORS.purple : 'var(--neutral-text)',
                        fontWeight: !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId ? 600 : 400,
                        backgroundColor: !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId
                          ? COLORS.lightPurpleBg
                          : 'transparent',
                      }}
                    >
                      ทุกหมวดย่อย
                    </Button>
                    {panelSubs.map((s) => {
                      const selected = selectedSubCategoryId === s.id && effectiveCategoryId === menuHighlightCategoryId;
                      return (
                        <Button
                          variant='unstyled'
                          key={s.id}
                          type='button'
                          onClick={() => {
                            if (menuHighlightCategoryId)
                              pickSubCategory(s.id, menuHighlightCategoryId);
                          }}
                          className='w-full px-4 py-2.5 text-left text-[12px] transition-colors active:bg-gray-50'
                          style={{
                            color: selected ? COLORS.purple : 'var(--neutral-text)',
                            fontWeight: selected ? 600 : 400,
                            backgroundColor: selected ? COLORS.lightPurpleBg : 'transparent',
                          }}
                        >
                          {s.name}
                        </Button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={categoryMenuRef} className='relative shrink-0 z-20'>
      <Button
        variant='unstyled'
        type='button'
        onClick={() => setCategoryMenuOpen((o) => !o)}
        className='flex h-9 w-44 shrink-0 items-center justify-between gap-1.5 rounded-lg border px-3 text-xs transition-all'
        style={{
          borderColor:
            effectiveCategoryId !== 'all' || selectedSubCategoryId
              ? COLORS.purple
              : 'var(--neutral-border)',
          backgroundColor:
            effectiveCategoryId !== 'all' || selectedSubCategoryId
              ? COLORS.lightPurpleBg
              : COLORS.gray,
          color: effectiveCategoryId !== 'all' || selectedSubCategoryId ? COLORS.purple : '#4B5563',
          fontWeight: effectiveCategoryId !== 'all' || selectedSubCategoryId ? 600 : 400,
        }}
      >
        <span className='truncate min-w-0 text-left'>{categoryMenuTriggerLabel}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ${categoryMenuOpen ? 'rotate-180' : ''}`}
        />
      </Button>
      {categoryMenuOpen ? (
        <div className='absolute top-full mt-1.5 left-0 flex rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden max-w-[calc(100vw-4rem)]'>
          <div
            className={`max-h-[min(75vh,22rem)] overflow-y-auto py-1 shrink-0 ${menuHighlightCategoryId && hasSubs(menuHighlightCategoryId) ? 'w-44 sm:w-52 border-r border-gray-100' : 'w-56 sm:w-64'}`}
          >
            {categoryFilters.map((cat) => {
              const selected = categoryOptionSelected(effectiveCategoryId, cat.id);
              const rowHi =
                cat.id === 'all'
                  ? menuHighlightCategoryId == null
                  : menuHighlightCategoryId === cat.id;
              return (
                <Button
                  variant='unstyled'
                  key={cat.id}
                  type='button'
                  onMouseEnter={() => setMenuHighlightCategoryId(cat.id === 'all' ? null : cat.id)}
                  onClick={() => {
                    if (cat.id === 'all') {
                      applyCategory('all');
                      setSelectedSubCategoryId(null);
                      closeCategoryMenu();
                    } else if (!hasSubs(cat.id)) {
                      applyCategory(cat.id);
                      setSelectedSubCategoryId(null);
                      closeCategoryMenu();
                    } else {
                      applyCategory(cat.id);
                      setMenuHighlightCategoryId(cat.id);
                    }
                  }}
                  className='w-full flex items-center justify-between gap-1 px-3 py-2.5 text-left text-[13px] transition-colors'
                  style={{
                    color: selected ? COLORS.purple : 'var(--neutral-text)',
                    fontWeight: selected ? 600 : 500,
                    backgroundColor: rowHi ? COLORS.lightPurpleBg : 'transparent',
                  }}
                >
                  <span className='truncate'>{cat.name}</span>
                  {cat.id !== 'all' && hasSubs(cat.id) ? (
                    <ChevronRight size={14} className='shrink-0 opacity-40' aria-hidden />
                  ) : null}
                </Button>
              );
            })}
          </div>
          {menuHighlightCategoryId && hasSubs(menuHighlightCategoryId) ? (
            <div className='w-44 sm:w-52 max-h-[min(75vh,22rem)] overflow-y-auto py-1 shrink-0'>
              {!menuHighlightCategoryId ? (
                <p className='px-3 py-4 text-[11px] text-gray-400 leading-relaxed'>
                  เลือกหมวดทางซ้ายเพื่อดูหมวดย่อย
                </p>
              ) : panelSubsLoading ? (
                <div className='flex items-center gap-2 px-3 py-4 text-xs text-gray-500'>
                  <Loader2
                    className='w-4 h-4 animate-spin shrink-0'
                    style={{ color: COLORS.purple }}
                  />
                  กำลังโหลดหมวดย่อย…
                </div>
              ) : panelSubs.length === 0 ? (
                <p className='px-3 py-4 text-[11px] text-gray-400'>ไม่มีหมวดย่อยในหมวดนี้</p>
              ) : (
                <>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => pickSubCategory(null, menuHighlightCategoryId)}
                    className='w-full px-3 py-2.5 text-left text-[13px]'
                    style={{
                      color:
                        !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId
                          ? COLORS.purple
                          : 'var(--neutral-text)',
                      fontWeight:
                        !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId
                          ? 600
                          : 400,
                      backgroundColor:
                        !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId
                          ? COLORS.lightPurpleBg
                          : 'transparent',
                    }}
                  >
                    ทุกหมวดย่อย
                  </Button>
                  {panelSubs.map((s) => {
                    const active =
                      selectedSubCategoryId === s.id &&
                      effectiveCategoryId === menuHighlightCategoryId;
                    return (
                      <Button
                        variant='unstyled'
                        key={s.id}
                        type='button'
                        onClick={() => pickSubCategory(s.id, menuHighlightCategoryId)}
                        className='w-full px-3 py-2.5 text-left text-[13px] transition-colors'
                        style={{
                          color: active ? COLORS.purple : 'var(--neutral-text)',
                          fontWeight: active ? 600 : 400,
                          backgroundColor: active ? COLORS.lightPurpleBg : 'transparent',
                        }}
                      >
                        {s.name}
                      </Button>
                    );
                  })}
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
