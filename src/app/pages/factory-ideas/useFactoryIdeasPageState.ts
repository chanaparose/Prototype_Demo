import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useData } from '@/stores/useDataStore';
import { useFavorites } from '@/hooks/useFavorites';
import { useFactoryIdeasCategorySelection } from '@/hooks/useFactoryIdeasCategoryFromUrl';
import { showcaseQueryTypeFromTab, useShowcases } from '@/hooks/useShowcases';
import {
  useFactoryIdeasCategoriesQuery,
  useFactoryIdeasFactoryListQuery,
  useFactoryIdeasSubCategoriesQuery,
} from '@/domain/factory/queries/useFactoryIdeasQueries';
import {
  factoryIdeasCategoryOptionSelected,
  showcaseMatchesSelectedCategoryId,
} from '@/utils/exploreToFactoryIdeasCategory';
import {
  getFactoryIdeaDetailPath,
  type FactoryIdeasContentType,
} from '@/components/features/factory-ideas/factoryIdeasTheme';

type UseFactoryIdeasPageStateOptions = {
  layout: 'desktop' | 'mobile';
};

export function useFactoryIdeasPageState({ layout }: UseFactoryIdeasPageStateOptions) {
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<FactoryIdeasContentType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuStep, setCategoryMenuStep] = useState<'categories' | 'subs'>('categories');
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const skipSubResetOnNextCategoryChangeRef = useRef(false);
  const [menuHighlightCategoryId, setMenuHighlightCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);

  const data = useData();
  const favorites = useFavorites();
  const isFactoryTab = selectedType === 'factory';
  const isMaterialTab = selectedType === 'material';

  const categoriesQ = useFactoryIdeasCategoriesQuery(isMaterialTab);
  const apiCategoriesAll = categoriesQ.data ?? [];

  const loadFactories = selectedType === 'all' || selectedType === 'factory';
  const factoriesQ = useFactoryIdeasFactoryListQuery(loadFactories);
  const factoryList = factoriesQ.data ?? [];
  const factoriesLoading = factoriesQ.isLoading;

  const showcaseApiType = isFactoryTab ? undefined : showcaseQueryTypeFromTab(selectedType);
  const { showcases: pageShowcases, loading: showcasesLoading } = useShowcases({
    type: showcaseApiType,
  });
  const { effectiveCategoryId, applyCategory } = useFactoryIdeasCategorySelection(
    data.categories,
    apiCategoriesAll,
  );

  const selectedCategoryIdForSubs = effectiveCategoryId !== 'all' ? effectiveCategoryId : null;

  const panelSubsEnabled =
    !isMaterialTab &&
    categoryMenuOpen &&
    Boolean(menuHighlightCategoryId) &&
    menuHighlightCategoryId !== 'all';

  const panelSubsQ = useFactoryIdeasSubCategoriesQuery(menuHighlightCategoryId, {
    enabled: panelSubsEnabled,
  });
  const panelSubs = panelSubsEnabled ? (panelSubsQ.data ?? []) : [];
  const panelSubsLoading = panelSubsQ.isLoading;

  const subCategoriesQ = useFactoryIdeasSubCategoriesQuery(selectedCategoryIdForSubs, {
    enabled: !isMaterialTab && Boolean(selectedCategoryIdForSubs),
  });
  const subCategories =
    !isMaterialTab && selectedCategoryIdForSubs ? (subCategoriesQ.data ?? []) : [];
  const subCategoriesLoading = subCategoriesQ.isLoading;

  useEffect(() => {
    const t = searchParams.get('type');
    if (
      t === 'product' ||
      t === 'promotion' ||
      t === 'idea' ||
      t === 'material' ||
      t === 'factory'
    ) {
      setSelectedType(t);
    }
  }, [searchParams]);

  const categoryFilters = useMemo(() => {
    if (isMaterialTab) {
      const rest = [...apiCategoriesAll].sort((a, b) => a.name.localeCompare(b.name, 'th'));
      return [{ id: 'all', name: 'ทุกหมวดหมู่' }, ...rest];
    }
    const byId = new Map<string, string>();
    for (const c of apiCategoriesAll) byId.set(String(c.id), c.name);
    for (const c of data.categories) {
      const id = String(c.id);
      if (!byId.has(id)) byId.set(id, c.name);
    }
    const rest = [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'));
    return [{ id: 'all', name: 'ทุกหมวดหมู่' }, ...rest];
  }, [apiCategoriesAll, data.categories, isMaterialTab]);

  const prevIsMaterialTabRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevIsMaterialTabRef.current === null) {
      prevIsMaterialTabRef.current = isMaterialTab;
      return;
    }
    if (prevIsMaterialTabRef.current === isMaterialTab) return;
    prevIsMaterialTabRef.current = isMaterialTab;
    applyCategory('all');
    setSelectedSubCategoryId(null);
  }, [isMaterialTab]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (isMaterialTab) {
      setSelectedSubCategoryId(null);
      return;
    }

    if (skipSubResetOnNextCategoryChangeRef.current) {
      skipSubResetOnNextCategoryChangeRef.current = false;
    } else {
      setSelectedSubCategoryId(null);
    }
  }, [selectedCategoryIdForSubs, isMaterialTab]);

  const categoryMenuTriggerLabel = useMemo(() => {
    if (effectiveCategoryId === 'all') return 'ทุกหมวดหมู่';
    const catName = categoryFilters.find((c) => c.id === effectiveCategoryId)?.name ?? 'หมวด';
    if (isMaterialTab) return catName;
    if (!selectedSubCategoryId) return `${catName} › ทุกหมวดย่อย`;
    const subName = subCategories.find((s) => s.id === selectedSubCategoryId)?.name;
    return subName ? `${catName} › ${subName}` : `${catName} › หมวดย่อย`;
  }, [effectiveCategoryId, selectedSubCategoryId, categoryFilters, subCategories, isMaterialTab]);

  const categoryRowsForMatching = useMemo(
    () => data.categories.map((c) => ({ id: String(c.id), name: c.name })),
    [data.categories],
  );

  const filterShowcases = (mode: 'default' | 'idea' | 'material') => {
    const q = searchText.trim().toLowerCase();
    return pageShowcases
      .filter((item) => {
        const hideIdeaFromAll =
          mode === 'default' && selectedType === 'all' && item.contentType === 'idea';
        const byType =
          mode === 'idea'
            ? item.contentType === 'idea'
            : mode === 'material'
              ? item.contentType === 'material'
              : selectedType === 'all' || item.contentType === selectedType;
        const byCategory = showcaseMatchesSelectedCategoryId(
          item.category,
          effectiveCategoryId,
          apiCategoriesAll,
          categoryRowsForMatching,
          item.categoryId,
        );
        const bySubCategory = !(
          selectedSubCategoryId &&
          item.sub_category_id != null &&
          String(item.sub_category_id) !== selectedSubCategoryId
        );
        if (!q) return !hideIdeaFromAll && byType && byCategory && bySubCategory;
        const haystack = [
          item.title,
          item.excerpt,
          item.factoryName,
          item.category,
          ...(item.tags ?? []),
        ]
          .join(' ')
          .toLowerCase();
        return !hideIdeaFromAll && byType && byCategory && bySubCategory && haystack.includes(q);
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  };

  const visibleItems = useMemo(
    () => (isFactoryTab ? [] : filterShowcases('default')),
    [
      searchText,
      selectedType,
      effectiveCategoryId,
      selectedSubCategoryId,
      pageShowcases,
      apiCategoriesAll,
      categoryRowsForMatching,
      isFactoryTab,
    ],
  );
  const visibleIdeaItems = useMemo(
    () => filterShowcases('idea'),
    [
      searchText,
      effectiveCategoryId,
      selectedSubCategoryId,
      pageShowcases,
      apiCategoriesAll,
      categoryRowsForMatching,
    ],
  );
  const visibleMaterialItems = useMemo(
    () => filterShowcases('material'),
    [
      searchText,
      effectiveCategoryId,
      selectedSubCategoryId,
      pageShowcases,
      apiCategoriesAll,
      categoryRowsForMatching,
    ],
  );

  const visibleFactories = useMemo(() => {
    if (selectedType !== 'all' && selectedType !== 'factory') return [];
    const q = searchText.trim().toLowerCase();
    return factoryList.filter((f) => {
      if (!q) return true;
      const haystack = [f.name, f.location, f.specialization, ...(f.tags ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [searchText, selectedType, factoryList]);

  const totalCount = isFactoryTab
    ? visibleFactories.length
    : selectedType === 'idea'
      ? visibleIdeaItems.length
      : selectedType === 'material'
        ? visibleMaterialItems.length
        : visibleItems.length +
          (selectedType === 'all' ? visibleFactories.length + visibleIdeaItems.length : 0);

  const closeCategoryMenu = () => {
    setCategoryMenuOpen(false);
    if (layout === 'mobile') setCategoryMenuStep('categories');
  };

  const pickSubCategory = (subId: string | null, categoryIdForApply: string) => {
    if (
      layout === 'desktop' &&
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
    categoryOptionSelected: factoryIdeasCategoryOptionSelected,
    getDetailPath: getFactoryIdeaDetailPath,
  };
}
