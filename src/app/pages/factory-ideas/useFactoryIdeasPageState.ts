import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getLbiHubs } from '@/services/api/masterApi';
import type { IHubResponse } from '@/services/api/types/master.types';

import { useData } from '@/stores/useDataStore';
import { useShallow } from 'zustand/react/shallow';
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
  getDefaultFactoryIdeasContentType,
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
  const hubScope = (searchParams.get('hub_scope') as 'PD' | 'MT' | null) ?? undefined;
  const [searchText, setSearchText] = useState('');
  const [moqFilter, setMoqFilter] = useState<FactoryIdeasMoqFilterValue>('all');

  const [selectedType, setSelectedType] = useState<FactoryIdeasContentType>(
    initialType ?? getDefaultFactoryIdeasContentType(hubScope),
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuStep, setCategoryMenuStep] = useState<'categories' | 'subs'>('categories');
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [menuHighlightCategoryId, setMenuHighlightCategoryId] = useState<string | null>(null);
  const [factoryScope, setFactoryScope] = useState<'PD' | 'MT' | 'all'>('all');
  const [page, setPage] = useState(1);

  const debouncedSearchText = useDebounce(searchText, 400);
  const maxMoqFilter = parseMoqFilterValue(moqFilter);

  const typeFromUrl = searchParams.get('type');
  useEffect(() => {
    const allowed: FactoryIdeasContentType[] = ['product', 'material', 'idea', 'factory'];
    if (typeFromUrl === 'all') {
      setSelectedType(getDefaultFactoryIdeasContentType(hubScope));
      return;
    }
    if (typeFromUrl && allowed.includes(typeFromUrl as FactoryIdeasContentType)) {
      setSelectedType(typeFromUrl as FactoryIdeasContentType);
    }
  }, [typeFromUrl, hubScope]);

  useEffect(() => {
    const fromState = (location.state as { searchText?: string } | null)?.searchText?.trim();
    if (!fromState) return;
    setSearchText(fromState);
  }, [location.key, location.state]);

  // `data` is returned from this hook and the FactoryIdeas pages read both
  // categories and factories off it, so both must be in the selected slice.
  const data = useData(
    useShallow((s) => ({ categories: s.categories, factories: s.factories })),
  );
  const favorites = useFavorites();
  const isFactoryTab = selectedType === 'factory';
  const isMaterialTab = selectedType === 'material';
  /** MT categories: แท็บวัตถุดิบ หรือแท็บโรงงาน + pill โรงงานวัตถุดิบ */
  const isMtCategoryScope = isMaterialTab || (isFactoryTab && factoryScope === 'MT');

  // hub_id จากหน้า /factory-ideas-hub (hub_scope อ่านไว้ด้านบนแล้ว)
  const hubId = Number(searchParams.get('hub_id')) || undefined;

  const { data: allHubs = [] } = useQuery({
    queryKey: ['lbi-hubs', 'all'],
    queryFn: async () => {
      const res = await getLbiHubs();
      const raw = res as unknown as { hubs?: IHubResponse[] };
      return raw.hubs ?? [];
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    enabled: !!hubId,
  });
  const hubName = hubId ? (allHubs.find((h) => h.hub_id === hubId)?.name ?? '') : '';

  const categoriesQ = useFactoryIdeasCategoriesQuery();
  const apiCategoriesRaw = categoriesQ.data ?? [];
  const isProductTab = selectedType === 'product';
  // กรอง categories ตาม hub_id (client-side) เมื่อมาจาก hub page; fallback scope เดิม
  const apiCategoriesAll = useMemo(() => {
    if (hubId) return apiCategoriesRaw.filter((c) => c.hubId === hubId);
    if (isMaterialTab) return apiCategoriesRaw.filter((c) => c.scope === 'MT');
    if (isProductTab) return apiCategoriesRaw.filter((c) => c.scope === 'PD');
    return apiCategoriesRaw;
  }, [apiCategoriesRaw, hubId, isMaterialTab, isProductTab]);

  const loadFactories = selectedType === 'factory';
  const apiFactoryScope = factoryScope === 'all' ? undefined : factoryScope;
  const factoriesQ = useFactoryIdeasFactoryListQuery(loadFactories, hubId ? undefined : apiFactoryScope, hubId);
  const factoryList = factoriesQ.data ?? [];

  const {
    effectiveCategoryId,
    applyCategory,
    applyCategoryAndSub,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
  } = useFactoryIdeasCategorySelection(data.categories, apiCategoriesAll);

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

  // เมื่อมี hubScope ให้ดึงเฉพาะ content_type ที่ตรงกับ scope นั้น
  const showcaseTypes = useMemo((): ('PD' | 'PM' | 'ID' | 'MT')[] => {
    if (isFactoryTab) return [];
    if (hubScope === 'MT') return ['MT'];
    if (hubScope === 'PD') return ['PD', 'ID'];
    // ไม่มี hub scope → ดึงทุก type (PM disabled)
    return ['PD', 'ID', 'MT'];
  }, [isFactoryTab, hubScope]);

  // Tabs ที่แสดงใน UI — ซ่อน สินค้า เมื่อ hub เป็น MT, ซ่อน วัตถุดิบ เมื่อ hub เป็น PD
  const visibleTabIds = useMemo((): Set<string> => {
    const ids = new Set(['product', 'material', 'idea', 'factory']);
    if (hubScope === 'MT') ids.delete('product');
    if (hubScope === 'PD') ids.delete('material');
    return ids;
  }, [hubScope]);

  useEffect(() => {
    if (!visibleTabIds.has(selectedType)) {
      setSelectedType(getDefaultFactoryIdeasContentType(hubScope));
    }
  }, [hubScope, selectedType, visibleTabIds]);

  // filter params (categoryId, subCategoryId, keyword) ถูกกรองฝั่ง client แล้ว
  // ไม่ส่งไป API เพื่อให้ query key คงที่ → React Query cache hit ทุกครั้งที่เปลี่ยน filter
  const showcaseParams: ShowcasePaginatedParams = {
    types: showcaseTypes,
    page,
    limit: PAGE_LIMIT,
    hubId,
  };

  const showcasesQ = useFactoryIdeasShowcasesPaginatedQuery(showcaseParams, !isFactoryTab);
  const pageShowcases = showcasesQ.data?.items ?? [];
  const totalShowcases = showcasesQ.data?.total ?? 0;

  // Hub tag switch: force skeleton instead of keeping stale placeholder content.
  const [trackedHubId, setTrackedHubId] = useState(hubId);
  const [hubSwitchPending, setHubSwitchPending] = useState(false);
  if (hubId !== trackedHubId) {
    setTrackedHubId(hubId);
    setHubSwitchPending(true);
  }
  useEffect(() => {
    if (!hubSwitchPending) return;
    const waiting = isFactoryTab ? factoriesQ.isFetching : showcasesQ.isFetching;
    if (!waiting) setHubSwitchPending(false);
  }, [hubSwitchPending, isFactoryTab, factoriesQ.isFetching, showcasesQ.isFetching]);

  // Show skeleton on first load, or while switching hub tags.
  const showcasesLoading =
    hubSwitchPending || (showcasesQ.isLoading && !showcasesQ.isPlaceholderData);
  // Subtle indicator (opacity / progress bar) while background-refetching
  const showcasesFetching = showcasesQ.isFetching && !showcasesLoading;
  const factoriesLoading = factoriesQ.isLoading || (hubSwitchPending && isFactoryTab);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedType, effectiveCategoryId, selectedSubCategoryId, debouncedSearchText, moqFilter, hubId]);


  const categoryFilters = useMemo(() => {
    // Keep API order as-is (do not resort on frontend)
    const rest = [...apiCategoriesAll];
    return [{ id: 'all', name: 'ทุกหมวดหมู่' }, ...rest];
  }, [apiCategoriesAll]);

  // Keep the category filter when switching tabs — only clear it if the selected
  // category isn't valid in the new tab (e.g. non-hub mode where PD/MT scopes differ).
  const prevSelectedTypeRef = useRef(selectedType);
  useEffect(() => {
    if (prevSelectedTypeRef.current === selectedType) return;
    prevSelectedTypeRef.current = selectedType;
    if (effectiveCategoryId && effectiveCategoryId !== 'all') {
      const stillValid = apiCategoriesAll.some((c) => c.id === effectiveCategoryId);
      if (!stillValid) {
        applyCategory('all');
      }
    }
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
    if (selectedType !== 'factory') return [];
    const q = searchText.trim().toLowerCase();
    const selectedCategoryId =
      effectiveCategoryId && effectiveCategoryId !== 'all' ? Number(effectiveCategoryId) : null;

    return factoryList.filter((f) => {
      // กรองตาม category ที่เลือกจาก dropdown — ใช้ category_ids ที่ BE ส่งมา (แม่นยำกว่าชื่อ)
      if (selectedCategoryId != null && Number.isFinite(selectedCategoryId)) {
        const fCatIds = f.categoryIds ?? [];
        if (!fCatIds.includes(selectedCategoryId)) return false;
      }
      const haystack = [f.name, f.location, f.specialization, ...(f.tags ?? [])]
        .join(' ')
        .toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (maxMoqFilter != null && !matchesMaxMoq(f.minOrder, maxMoqFilter)) return false;
      return true;
    });
  }, [searchText, selectedType, factoryList, effectiveCategoryId, maxMoqFilter]);

  const totalCount = isFactoryTab
    ? visibleFactories.length
    : selectedType === 'idea'
      ? visibleIdeaItems.length
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
    if (categoryIdForApply && categoryIdForApply !== 'all') {
      applyCategoryAndSub(categoryIdForApply, subId);
    } else {
      setSelectedSubCategoryId(subId);
    }
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
    hubId,
    hubScope,
    hubName,
    visibleTabIds,
    categoryOptionSelected: factoryIdeasCategoryOptionSelected,
    getDetailPath: getFactoryIdeaDetailPath,
  };
}
