import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useData } from '@/stores';
import type { Factory } from '@/stores';
import { factoriesApi, masterApi } from '@/services/api';
import { useFavorites } from '@/hooks/useFavorites';
import { useFactoryIdeasCategorySelection } from '@/hooks/useFactoryIdeasCategoryFromUrl';
import { showcaseQueryTypeFromTab, useShowcases } from '@/hooks/useShowcases';
import { fetchExploreCategoriesMerged } from '@/utils/exploreCategoriesFromApi';
import {
  factoryIdeasCategoryOptionSelected,
  parseMasterProductCategories,
  showcaseMatchesSelectedCategoryId,
} from '@/utils/exploreToFactoryIdeasCategory';
import { logFactoryIdeasCategory } from '@/utils/debugFactoryIdeasCategory';
import {
  getCachedSubCategoriesSync,
  loadSubCategories,
  prefetchSubCategoriesFor,
} from '@/utils/subCategoriesCache';
import {
  getFactoryIdeaDetailPath,
  normalizeFactoryIdeaFactory,
  type FactoryIdeasContentType,
} from '@/components/features/factory-ideas/factoryIdeasTheme';

type CategoryRow = { id: string; name: string };
type SubCategoryRow = { id: string; name: string; sortOrder: number };

type UseFactoryIdeasPageStateOptions = {
  layout: 'desktop' | 'mobile';
};

export function useFactoryIdeasPageState({ layout }: UseFactoryIdeasPageStateOptions) {
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<FactoryIdeasContentType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [apiCategoriesAll, setApiCategoriesAll] = useState<CategoryRow[]>([]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuStep, setCategoryMenuStep] = useState<'categories' | 'subs'>('categories');
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const skipSubResetOnNextCategoryChangeRef = useRef(false);
  const [menuHighlightCategoryId, setMenuHighlightCategoryId] = useState<string | null>(null);
  const [panelSubs, setPanelSubs] = useState<SubCategoryRow[]>([]);
  const [panelSubsLoading, setPanelSubsLoading] = useState(false);
  const [subCategories, setSubCategories] = useState<SubCategoryRow[]>([]);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [factoryList, setFactoryList] = useState<Factory[]>([]);
  const [factoriesLoading, setFactoriesLoading] = useState(false);

  const data = useData();
  const favorites = useFavorites();
  const isFactoryTab = selectedType === 'factory';
  const isMaterialTab = selectedType === 'material';
  const showcaseApiType = isFactoryTab ? undefined : showcaseQueryTypeFromTab(selectedType);
  const { showcases: pageShowcases, loading: showcasesLoading } = useShowcases({
    type: showcaseApiType,
  });
  const { effectiveCategoryId, applyCategory } = useFactoryIdeasCategorySelection(
    data.categories,
    apiCategoriesAll,
  );

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

  useEffect(() => {
    if (selectedType !== 'all' && selectedType !== 'factory') return;
    let cancelled = false;
    setFactoriesLoading(true);
    factoriesApi
      .list()
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        setFactoryList(arr.map(normalizeFactoryIdeaFactory).filter((f) => f.id && f.name));
      })
      .catch(() => {
        if (!cancelled) setFactoryList([]);
      })
      .finally(() => {
        if (!cancelled) setFactoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isMaterialTab) {
          const raw = (await masterApi.lbiCategories('MT')) as unknown as Record<string, unknown>;
          if (cancelled) return;
          const arr = (Array.isArray(raw.categories) ? raw.categories : []) as Record<
            string,
            unknown
          >[];
          const rows = arr
            .map((c) => ({ id: String(c.category_id ?? c.id ?? ''), name: String(c.name ?? '') }))
            .filter((r) => r.id && r.name);
          setApiCategoriesAll(rows);
          return;
        }

        const res = await fetchExploreCategoriesMerged();
        if (cancelled) return;
        let rows = res.merged.map((c) => ({ id: String(c.id), name: c.name }));
        let categorySource: 'exploreMerged' | 'masterProductCategories' | 'empty' = 'exploreMerged';
        if (rows.length === 0) {
          categorySource = 'empty';
          try {
            const rawPD = await masterApi.productCategories();
            if (!cancelled) {
              rows = parseMasterProductCategories(rawPD);
              categorySource = rows.length > 0 ? 'masterProductCategories' : 'empty';
            }
          } catch {
            /* keep [] */
          }
        }
        if (!cancelled) {
          setApiCategoriesAll(rows);
          prefetchSubCategoriesFor(rows.map((r) => r.id));
          logFactoryIdeasCategory('categoryMenu.apiCategoriesAll', {
            source: categorySource,
            exploreMergedCount: res.merged.length,
            rowCount: rows.length,
            rows,
          });
        }
      } catch {
        if (!cancelled) setApiCategoriesAll([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMaterialTab]);

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

  useEffect(() => {
    logFactoryIdeasCategory('categoryMenu.categoryFilters', {
      count: categoryFilters.length,
      items: categoryFilters,
      dataContextCategoriesCount: data.categories.length,
      apiCategoriesAllCount: apiCategoriesAll.length,
    });
  }, [categoryFilters, data.categories.length, apiCategoriesAll.length]);

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
    setSubCategories([]);
  }, [isMaterialTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!categoryMenuOpen) return;
    setMenuHighlightCategoryId(effectiveCategoryId !== 'all' ? effectiveCategoryId : null);
  }, [categoryMenuOpen, effectiveCategoryId]);

  useEffect(() => {
    if (categoryMenuOpen && layout === 'mobile') setCategoryMenuStep('categories');
  }, [categoryMenuOpen, layout]);

  useEffect(() => {
    if (
      isMaterialTab ||
      !categoryMenuOpen ||
      !menuHighlightCategoryId ||
      menuHighlightCategoryId === 'all'
    ) {
      setPanelSubs([]);
      setPanelSubsLoading(false);
      return;
    }

    const cached = getCachedSubCategoriesSync(menuHighlightCategoryId);
    if (cached) {
      logFactoryIdeasCategory('panelSubs.cacheHit', { menuHighlightCategoryId, panelSubs: cached });
      setPanelSubs(cached);
      setPanelSubsLoading(false);
      return;
    }

    let cancelled = false;
    setPanelSubsLoading(true);
    logFactoryIdeasCategory('panelSubs.request', {
      endpoint: `GET sub-categories (category_id=${menuHighlightCategoryId})`,
      menuHighlightCategoryId,
    });
    loadSubCategories(menuHighlightCategoryId)
      .then((mapped) => {
        if (cancelled) return;
        logFactoryIdeasCategory('panelSubs.apiResponse', {
          menuHighlightCategoryId,
          mappedLength: mapped.length,
          mapped,
        });
        setPanelSubs(mapped);
      })
      .finally(() => {
        if (!cancelled) setPanelSubsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryMenuOpen, menuHighlightCategoryId, isMaterialTab]);

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

  const selectedCategoryIdForSubs = effectiveCategoryId !== 'all' ? effectiveCategoryId : null;
  useEffect(() => {
    if (isMaterialTab) {
      setSelectedSubCategoryId(null);
      setSubCategories([]);
      return;
    }

    if (skipSubResetOnNextCategoryChangeRef.current) {
      skipSubResetOnNextCategoryChangeRef.current = false;
    } else {
      setSelectedSubCategoryId(null);
    }
    setSubCategories([]);

    if (!selectedCategoryIdForSubs) return;
    const cached = getCachedSubCategoriesSync(selectedCategoryIdForSubs);
    if (cached) {
      setSubCategories(cached);
      return;
    }

    let cancelled = false;
    setSubCategoriesLoading(true);
    loadSubCategories(selectedCategoryIdForSubs)
      .then((mapped) => {
        if (!cancelled) setSubCategories(mapped);
      })
      .finally(() => {
        if (!cancelled) setSubCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
