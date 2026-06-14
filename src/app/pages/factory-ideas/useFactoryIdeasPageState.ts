import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';

import { useData } from '@/stores/useDataStore';
import { useFavorites } from '@/hooks/useFavorites';
import { useFactoryIdeasCategorySelection } from '@/hooks/useFactoryIdeasCategoryFromUrl';
import {
  useFactoryIdeasCategoriesQuery,
  useFactoryIdeasFactoryListQuery,
  useFactoryIdeasShowcasesPaginatedQuery,
  type ShowcasePaginatedParams,
} from '@/domain/factory/queries/useFactoryIdeasQueries';
import {
  factoryIdeasCategoryOptionSelected,
  showcaseMatchesSelectedCategoryId,
} from '@/utils/exploreToFactoryIdeasCategory';
import {
  getFactoryIdeaDetailPath,
  type FactoryIdeasContentType,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import {
  matchesMaxMoq,
  parseMoqFilterValue,
  type FactoryIdeasMoqFilterValue,
} from '@/components/features/factory-ideas/factoryIdeasMoqFilter';

const PAGE_LIMIT = 80;

type UseFactoryIdeasPageStateOptions = {
  layout: 'desktop' | 'mobile';
  initialType?: FactoryIdeasContentType;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useFactoryIdeasPageState({ layout, initialType }: UseFactoryIdeasPageStateOptions) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [searchText, setSearchText] = useState('');
  const [moqFilter, setMoqFilter] = useState<FactoryIdeasMoqFilterValue>('all');

  const [selectedType, setSelectedType] = useState<FactoryIdeasContentType>(initialType ?? 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuStep, setCategoryMenuStep] = useState<'categories' | 'subs'>('categories');
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const skipSubResetOnNextCategoryChangeRef = useRef(false);
  const [menuHighlightCategoryId, setMenuHighlightCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [factoryScope, setFactoryScope] = useState<'PD' | 'MT' | 'all'>('all');
  const [page, setPage] = useState(1);

  const debouncedSearchText = useDebounce(searchText, 400);
  const maxMoqFilter = parseMoqFilterValue(moqFilter);

  const typeFromUrl = searchParams.get('type');
  useEffect(() => {
    const allowed: FactoryIdeasContentType[] = [
      'all',
      'product',
      'material',
      'idea',
      'factory',
    ];
    if (typeFromUrl && allowed.includes(typeFromUrl as FactoryIdeasContentType)) {
      setSelectedType(typeFromUrl as FactoryIdeasContentType);
    }
  }, [typeFromUrl]);

  useEffect(() => {
    const fromState = (location.state as { searchText?: string } | null)?.searchText?.trim();
    if (!fromState) return;
    setSearchText(fromState);
  }, [location.key, location.state]);

  const data = useData();
  const favorites = useFavorites();
  const isFactoryTab = selectedType === 'factory';
  const isMaterialTab = selectedType === 'material';
  /** MT categories: แท็บวัตถุดิบ หรือแท็บโรงงาน + pill โรงงานวัตถุดิบ */
  const isMtCategoryScope = isMaterialTab || (isFactoryTab && factoryScope === 'MT');

  const categoriesQ = useFactoryIdeasCategoriesQuery();
  const apiCategoriesRaw = categoriesQ.data ?? [];
  // Filter categories by scope client-side
  // PD = สินค้า, MT = วัตถุดิบ, all/idea = ทั้ง PD+MT, factory = ไม่มี dropdown
  const isProductTab = selectedType === 'product';
  const apiCategoriesAll = useMemo(() => {
    if (isMaterialTab) return apiCategoriesRaw.filter((c) => c.scope === 'MT');
    if (isProductTab) return apiCategoriesRaw.filter((c) => c.scope === 'PD');
    // tab ทั้งหมด / ไอเดีย → แสดงทุก scope (PD + MT)
    return apiCategoriesRaw;
  }, [apiCategoriesRaw, isMaterialTab, isProductTab]);

  const loadFactories = selectedType === 'all' || selectedType === 'factory';
  const apiFactoryScope = factoryScope === 'all' ? undefined : factoryScope;
  const factoriesQ = useFactoryIdeasFactoryListQuery(loadFactories, apiFactoryScope);
  const factoryList = factoriesQ.data ?? [];
  const factoriesLoading = factoriesQ.isLoading;

  const { effectiveCategoryId, applyCategory } = useFactoryIdeasCategorySelection(
    data.categories,
    apiCategoriesAll,
  );

  // Sub-categories are now embedded in the categories response — no separate queries
  const panelSubs = useMemo(() => {
    if (!menuHighlightCategoryId || menuHighlightCategoryId === 'all') return [];
    return apiCategoriesAll.find((c) => c.id === menuHighlightCategoryId)?.subCategories ?? [];
  }, [menuHighlightCategoryId, apiCategoriesAll]);

  const subCategories = useMemo(() => {
    if (!effectiveCategoryId || effectiveCategoryId === 'all') return [];
    return apiCategoriesAll.find((c) => c.id === effectiveCategoryId)?.subCategories ?? [];
  }, [effectiveCategoryId, apiCategoriesAll]);

  const panelSubsLoading = false;
  const subCategoriesLoading = false;

  /** Category IDs that have ≥1 sub-category — used to show/hide chevron & subs panel */
  const categoriesWithSubs = useMemo(() => {
    const s = new Set<string>();
    for (const c of apiCategoriesRaw) {
      if (c.subCategories && c.subCategories.length > 0) s.add(c.id);
    }
    return s as ReadonlySet<string>;
  }, [apiCategoriesRaw]);

  // Always fetch all types so switching tabs hits the cache instead of re-fetching
  const showcaseTypes = useMemo((): ('PD' | 'PM' | 'ID' | 'MT')[] => {
    if (isFactoryTab) return [];
    // PM disabled — do not fetch promotion showcases
    return ['PD', 'ID', 'MT'];
  }, [isFactoryTab]);

  // filter params (categoryId, subCategoryId, keyword) ถูกกรองฝั่ง client แล้ว
  // ไม่ส่งไป API เพื่อให้ query key คงที่ → React Query cache hit ทุกครั้งที่เปลี่ยน filter
  const showcaseParams: ShowcasePaginatedParams = {
    types: showcaseTypes,
    page,
    limit: PAGE_LIMIT,
  };

  const showcasesQ = useFactoryIdeasShowcasesPaginatedQuery(showcaseParams, !isFactoryTab);
  const pageShowcases = showcasesQ.data?.items ?? [];
  const totalShowcases = showcasesQ.data?.total ?? 0;
  // Show skeleton only on the very first load (no cached data yet).
  // Subsequent fetches (page change, tab switch) keep stale content visible
  // thanks to placeholderData in the query hook.
  const showcasesLoading = showcasesQ.isLoading && !showcasesQ.isPlaceholderData;
  // Subtle indicator (opacity / progress bar) while background-refetching
  const showcasesFetching = showcasesQ.isFetching && !showcasesLoading;

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedType, effectiveCategoryId, selectedSubCategoryId, debouncedSearchText, moqFilter]);


  const categoryFilters = useMemo(() => {
    // Keep API order as-is (do not resort on frontend)
    const rest = [...apiCategoriesAll];
    return [{ id: 'all', name: 'ทุกหมวดหมู่' }, ...rest];
  }, [apiCategoriesAll]);

  // Reset category filter when switching tabs (category list changes per tab scope)
  const prevSelectedTypeRef = useRef(selectedType);
  useEffect(() => {
    if (prevSelectedTypeRef.current === selectedType) return;
    prevSelectedTypeRef.current = selectedType;
    applyCategory('all');
    setSelectedSubCategoryId(null);
  }, [selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!categoryMenuOpen) return;
    setMenuHighlightCategoryId(effectiveCategoryId !== 'all' ? effectiveCategoryId : null);
  }, [categoryMenuOpen, effectiveCategoryId]);

  useEffect(() => {
    if (categoryMenuOpen && layout === 'mobile') setCategoryMenuStep('categories');
  }, [categoryMenuOpen, layout]);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const el = categoryMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
        if (layout === 'mobile') setCategoryMenuStep('categories');
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [categoryMenuOpen, layout]);

  useEffect(() => {
    if (skipSubResetOnNextCategoryChangeRef.current) {
      skipSubResetOnNextCategoryChangeRef.current = false;
    } else {
      setSelectedSubCategoryId(null);
    }
  }, [effectiveCategoryId]);

  const categoryMenuTriggerLabel = useMemo(() => {
    if (effectiveCategoryId === 'all') return 'ทุกหมวดหมู่';
    const catName = categoryFilters.find((c) => c.id === effectiveCategoryId)?.name ?? 'หมวด';
    if (subCategories.length === 0) return catName;
    if (!selectedSubCategoryId) return `${catName} › ทุกหมวดย่อย`;
    const subName = subCategories.find((s) => s.id === selectedSubCategoryId)?.name;
    return subName ? `${catName} › ${subName}` : `${catName} › หมวดย่อย`;
  }, [effectiveCategoryId, selectedSubCategoryId, categoryFilters, subCategories]);

  // Client-side filter fallback (in case the server doesn't honour category/keyword params)
  const filteredShowcases = useMemo(() => {
    let items = pageShowcases;

    if (effectiveCategoryId && effectiveCategoryId !== 'all') {
      items = items.filter((s) =>
        showcaseMatchesSelectedCategoryId(
          s.category ?? '',
          effectiveCategoryId,
          apiCategoriesAll,
          data.categories,
          s.categoryId,
        ),
      );
    }

    if (selectedSubCategoryId) {
      items = items.filter(
        (s) => s.sub_category_id != null && String(s.sub_category_id) === selectedSubCategoryId,
      );
    }

    if (debouncedSearchText.trim()) {
      const q = debouncedSearchText.trim().toLowerCase();
      items = items.filter((s) => {
        const haystack = [s.title, s.excerpt, s.category, s.factoryName, ...(s.tags ?? [])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (maxMoqFilter != null) {
      items = items.filter(
        (s) => s.contentType === 'idea' || matchesMaxMoq(s.minOrder, maxMoqFilter),
      );
    }

    return items.filter((s) => s.contentType !== 'promotion');
  }, [
    pageShowcases,
    effectiveCategoryId,
    selectedSubCategoryId,
    debouncedSearchText,
    maxMoqFilter,
    apiCategoriesAll,
    data.categories,
  ]);

  const visibleItems = useMemo(() => {
    if (isFactoryTab) return [];
    if (selectedType === 'all')
      return filteredShowcases.filter(
        (s) => s.contentType !== 'idea' && s.contentType !== 'promotion',
      );
    if (selectedType === 'product')
      return filteredShowcases.filter((s) => s.contentType === 'product');
    // if (selectedType === 'promotion') return … // PM tab disabled
    if (selectedType === 'material')
      return filteredShowcases.filter((s) => s.contentType === 'material');
    return filteredShowcases;
  }, [filteredShowcases, selectedType, isFactoryTab]);

  const visibleIdeaItems = useMemo(
    () => filteredShowcases.filter((s) => s.contentType === 'idea'),
    [filteredShowcases],
  );

  const visibleMaterialItems = useMemo(
    () => filteredShowcases.filter((s) => s.contentType === 'material'),
    [filteredShowcases],
  );

  const visibleFactories = useMemo(() => {
    if (selectedType !== 'all' && selectedType !== 'factory') return [];
    const q = searchText.trim().toLowerCase();
    const selectedCategoryName =
      effectiveCategoryId && effectiveCategoryId !== 'all'
        ? apiCategoriesAll.find((c) => c.id === effectiveCategoryId)?.name.toLowerCase() ?? ''
        : '';
    const selectedSubCategoryName =
      selectedSubCategoryId && effectiveCategoryId && effectiveCategoryId !== 'all'
        ? (apiCategoriesAll
            .find((c) => c.id === effectiveCategoryId)
            ?.subCategories.find((s) => s.id === selectedSubCategoryId)
            ?.name.toLowerCase() ?? '')
        : '';

    return factoryList.filter((f) => {
      const haystack = [f.name, f.location, f.specialization, ...(f.tags ?? [])]
        .join(' ')
        .toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (maxMoqFilter != null && !matchesMaxMoq(f.minOrder, maxMoqFilter)) return false;
      if (selectedCategoryName && !haystack.includes(selectedCategoryName)) return false;
      if (selectedSubCategoryName && !haystack.includes(selectedSubCategoryName)) return false;
      return true;
    });
  }, [searchText, selectedType, factoryList, effectiveCategoryId, selectedSubCategoryId, apiCategoriesAll, maxMoqFilter]);

  const totalCount = isFactoryTab
    ? visibleFactories.length
    : selectedType === 'idea'
      ? visibleIdeaItems.length
      : selectedType === 'all'
        ? totalShowcases + visibleFactories.length
        : visibleItems.length;

  const isListFiltered = Boolean(
    debouncedSearchText.trim() ||
      maxMoqFilter != null ||
      (effectiveCategoryId && effectiveCategoryId !== 'all') ||
      selectedSubCategoryId ||
      (isFactoryTab && factoryScope !== 'all'),
  );

  const closeCategoryMenu = () => {
    setCategoryMenuOpen(false);
    if (layout === 'mobile') setCategoryMenuStep('categories');
  };

  const pickSubCategory = (subId: string | null, categoryIdForApply: string) => {
    if (
      categoryIdForApply &&
      categoryIdForApply !== 'all' &&
      categoryIdForApply !== effectiveCategoryId
    ) {
      skipSubResetOnNextCategoryChangeRef.current = true;
    }
    if (categoryIdForApply && categoryIdForApply !== 'all') {
      applyCategory(categoryIdForApply);
    }
    setSelectedSubCategoryId(subId);
    closeCategoryMenu();
  };

  return {
    data,
    ...favorites,
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
    categoryMenuStep,
    setCategoryMenuStep,
    categoryMenuRef,
    menuHighlightCategoryId,
    setMenuHighlightCategoryId,
    panelSubs,
    panelSubsLoading,
    subCategories,
    subCategoriesLoading,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
    categoryFilters,
    categoriesWithSubs,
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
    isListFiltered,
    totalShowcases,
    page,
    setPage,
    pageLimit: PAGE_LIMIT,
    categoryMenuTriggerLabel,
    closeCategoryMenu,
    pickSubCategory,
    categoryOptionSelected: factoryIdeasCategoryOptionSelected,
    getDetailPath: getFactoryIdeaDetailPath,
  };
}
