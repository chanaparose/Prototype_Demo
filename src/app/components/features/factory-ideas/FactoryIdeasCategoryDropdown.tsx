import type { RefObject } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '../../ui/button';
import { factoryIdeasTheme as COLORS } from './factoryIdeasTheme';

type CategoryRow = { id: string; name: string };
type SubCategoryRow = { id: string; name: string; sortOrder: number };

type FactoryIdeasCategoryDropdownProps = {
  variant: 'desktop' | 'mobile';
  categoryMenuRef: RefObject<HTMLDivElement>;
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
};

export function FactoryIdeasCategoryDropdown({
  variant,
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
}: FactoryIdeasCategoryDropdownProps) {
  if (variant === 'mobile') {
    return (
      <div ref={categoryMenuRef} className="relative flex-1 min-w-[min(100%,10rem)] z-30">
        <Button
          variant="unstyled"
          type="button"
          onClick={() => setCategoryMenuOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg border text-[12px] transition-all"
          style={{
            borderColor: effectiveCategoryId !== 'all' ? COLORS.purple : '#E5E7EB',
            backgroundColor: effectiveCategoryId !== 'all' ? COLORS.lightPurpleBg : COLORS.gray,
            color: effectiveCategoryId !== 'all' ? COLORS.purple : '#6B7280',
            fontWeight: effectiveCategoryId !== 'all' ? 600 : 400,
          }}
        >
          <span className="truncate">{categoryMenuTriggerLabel}</span>
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform duration-200 ${categoryMenuOpen ? 'rotate-180' : ''}`}
          />
        </Button>
        {categoryMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 max-h-[50vh] overflow-y-auto z-40">
            {categoryMenuStep === 'categories' ? (
              categoryFilters.map((cat) => {
                const selected = categoryOptionSelected(effectiveCategoryId, cat.id);
                const isAll = cat.id === 'all';
                return (
                  <Button
                    variant="unstyled"
                    key={isAll ? 'all' : `cat-${cat.id}`}
                    type="button"
                    onClick={() => {
                      if (isAll) {
                        applyCategory('all');
                        setSelectedSubCategoryId(null);
                        closeCategoryMenu();
                      } else if (isMaterialTab) {
                        applyCategory(cat.id);
                        setSelectedSubCategoryId(null);
                        closeCategoryMenu();
                      } else {
                        applyCategory(cat.id);
                        setMenuHighlightCategoryId(cat.id);
                        setCategoryMenuStep?.('subs');
                      }
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left text-[12px] transition-colors active:bg-gray-50"
                    style={{
                      color: selected ? COLORS.purple : '#374151',
                      fontWeight: selected ? 600 : 400,
                      backgroundColor: selected ? COLORS.lightPurpleBg : 'transparent',
                    }}
                  >
                    <span className="truncate">{cat.name}</span>
                    {!isAll && <ChevronRight size={16} className="shrink-0 text-gray-400" aria-hidden />}
                  </Button>
                );
              })
            ) : (
              <>
                <Button
                  variant="unstyled"
                  type="button"
                  onClick={() => setCategoryMenuStep?.('categories')}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-[12px] font-medium active:bg-gray-50"
                  style={{ color: COLORS.purple }}
                >
                  <ChevronLeft size={18} className="shrink-0" aria-hidden />
                  หมวดหมู่
                </Button>
                <div className="mx-3 border-t border-gray-100" />
                {panelSubsLoading ? (
                  <div className="px-4 py-6 flex items-center justify-center gap-2 text-[12px] text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    กำลังโหลดหมวดย่อย...
                  </div>
                ) : panelSubs.length === 0 ? (
                  <p className="px-4 py-4 text-center text-[12px] text-gray-500">ไม่มีหมวดย่อยในหมวดนี้</p>
                ) : (
                  <>
                    <Button
                      variant="unstyled"
                      type="button"
                      onClick={() => {
                        if (menuHighlightCategoryId) pickSubCategory(null, menuHighlightCategoryId);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[12px] transition-colors active:bg-gray-50"
                      style={{
                        color: !selectedSubCategoryId ? COLORS.purple : '#374151',
                        fontWeight: !selectedSubCategoryId ? 600 : 400,
                        backgroundColor: !selectedSubCategoryId ? COLORS.lightPurpleBg : 'transparent',
                      }}
                    >
                      ทุกหมวดย่อย
                    </Button>
                    {panelSubs.map((s) => {
                      const selected = selectedSubCategoryId === s.id;
                      return (
                        <Button
                          variant="unstyled"
                          key={s.id}
                          type="button"
                          onClick={() => {
                            if (menuHighlightCategoryId) pickSubCategory(s.id, menuHighlightCategoryId);
                          }}
                          className="w-full px-4 py-2.5 text-left text-[12px] transition-colors active:bg-gray-50"
                          style={{
                            color: selected ? COLORS.purple : '#374151',
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
    <div ref={categoryMenuRef} className="relative shrink-0 z-20">
      <Button
        variant="unstyled"
        type="button"
        onClick={() => setCategoryMenuOpen((o) => !o)}
        className="flex items-center gap-2 max-w-[min(100vw-8rem,22rem)] px-4 py-2.5 rounded-xl border text-[13px] transition-all"
        style={{
          borderColor: effectiveCategoryId !== 'all' || selectedSubCategoryId ? COLORS.purple : '#E5E7EB',
          backgroundColor: effectiveCategoryId !== 'all' || selectedSubCategoryId ? COLORS.lightPurpleBg : COLORS.gray,
          color: effectiveCategoryId !== 'all' || selectedSubCategoryId ? COLORS.purple : '#4B5563',
          fontWeight: effectiveCategoryId !== 'all' || selectedSubCategoryId ? 600 : 400,
        }}
      >
        <span className="truncate min-w-0 text-left">{categoryMenuTriggerLabel}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ${categoryMenuOpen ? 'rotate-180' : ''}`}
        />
      </Button>
      {categoryMenuOpen ? (
        <div className="absolute top-full mt-1.5 left-0 flex rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden max-w-[calc(100vw-4rem)]">
          <div className={`max-h-[min(75vh,22rem)] overflow-y-auto py-1 shrink-0 ${isMaterialTab ? 'w-56 sm:w-64' : 'w-44 sm:w-52 border-r border-gray-100'}`}>
            {categoryFilters.map((cat) => {
              const selected = categoryOptionSelected(effectiveCategoryId, cat.id);
              const rowHi = cat.id === 'all' ? menuHighlightCategoryId == null : menuHighlightCategoryId === cat.id;
              return (
                <Button
                  variant="unstyled"
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setMenuHighlightCategoryId(cat.id === 'all' ? null : cat.id)}
                  onClick={() => {
                    if (cat.id === 'all') {
                      applyCategory('all');
                      setSelectedSubCategoryId(null);
                      closeCategoryMenu();
                    } else if (isMaterialTab) {
                      applyCategory(cat.id);
                      setSelectedSubCategoryId(null);
                      closeCategoryMenu();
                    } else {
                      applyCategory(cat.id);
                      setMenuHighlightCategoryId(cat.id);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-1 px-3 py-2.5 text-left text-[13px] transition-colors"
                  style={{
                    color: selected ? COLORS.purple : '#374151',
                    fontWeight: selected ? 600 : 500,
                    backgroundColor: rowHi ? COLORS.lightPurpleBg : 'transparent',
                  }}
                >
                  <span className="truncate">{cat.name}</span>
                  {cat.id !== 'all' ? <ChevronRight size={14} className="shrink-0 opacity-40" aria-hidden /> : null}
                </Button>
              );
            })}
          </div>
          {!isMaterialTab && (
            <div className="w-44 sm:w-52 max-h-[min(75vh,22rem)] overflow-y-auto py-1 shrink-0">
              {!menuHighlightCategoryId ? (
                <p className="px-3 py-4 text-[11px] text-gray-400 leading-relaxed">เลือกหมวดทางซ้ายเพื่อดูหมวดย่อย</p>
              ) : panelSubsLoading ? (
                <div className="flex items-center gap-2 px-3 py-4 text-xs text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: COLORS.purple }} />
                  กำลังโหลดหมวดย่อย…
                </div>
              ) : panelSubs.length === 0 ? (
                <p className="px-3 py-4 text-[11px] text-gray-400">ไม่มีหมวดย่อยในหมวดนี้</p>
              ) : (
                <>
                  <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => pickSubCategory(null, menuHighlightCategoryId)}
                    className="w-full px-3 py-2.5 text-left text-[13px]"
                    style={{
                      color: !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId ? COLORS.purple : '#374151',
                      fontWeight: !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId ? 600 : 400,
                      backgroundColor: !selectedSubCategoryId && effectiveCategoryId === menuHighlightCategoryId ? COLORS.lightPurpleBg : 'transparent',
                    }}
                  >
                    ทุกหมวดย่อย
                  </Button>
                  {panelSubs.map((s) => {
                    const active = selectedSubCategoryId === s.id && effectiveCategoryId === menuHighlightCategoryId;
                    return (
                      <Button
                        variant="unstyled"
                        key={s.id}
                        type="button"
                        onClick={() => pickSubCategory(s.id, menuHighlightCategoryId)}
                        className="w-full px-3 py-2.5 text-left text-[13px] transition-colors"
                        style={{
                          color: active ? COLORS.purple : '#374151',
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
          )}
        </div>
      ) : null}
    </div>
  );
}
