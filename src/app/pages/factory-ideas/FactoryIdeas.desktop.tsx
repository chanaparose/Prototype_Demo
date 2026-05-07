import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Search,
  BadgeCheck,
  Heart,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpRight,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import type { Factory } from '../../contexts/DataContext';
import { ImageWithFallback } from '../../components/shared';
import { masterApi, factoriesApi } from '../../services/api';
import { fetchExploreCategoriesMerged } from '../../utils/exploreCategoriesFromApi';
import {
  loadSubCategories,
  prefetchSubCategoriesFor,
  getCachedSubCategoriesSync,
} from '../../utils/subCategoriesCache';
import {
  factoryIdeasCategoryOptionSelected,
  parseMasterProductCategories,
  showcaseMatchesSelectedCategoryId,
} from '../../utils/exploreToFactoryIdeasCategory';
import { logFactoryIdeasCategory } from '../../utils/debugFactoryIdeasCategory';
import { useFactoryIdeasCategorySelection } from '../../hooks/useFactoryIdeasCategoryFromUrl';
import { useShowcases, showcaseQueryTypeFromTab } from '../../hooks/useShowcases';
import { useFavorites } from '../../hooks/useFavorites';
import { MapPin, Star } from 'lucide-react';

const COLORS = {
  purple: '#7A4B94',
  purpleLight: '#9D77B2',
  orange: '#E38844',
  blue: '#2E2252',
  productBadgeBlue: '#2563EB',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  lightPurpleBg: '#F8F6FA',
  teal: '#0D9488',
};

type ContentType = 'all' | 'product' | 'promotion' | 'idea' | 'material' | 'factory';

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'product', label: 'สินค้า' },
  { id: 'promotion', label: 'โปรโมชัน' },
  { id: 'material', label: 'วัตถุดิบ' },
  { id: 'idea', label: 'ไอเดีย' },
  { id: 'factory', label: 'โรงงาน' },
];

const contentTypeLabel: Record<Exclude<ContentType, 'all'>, string> = {
  product: 'สินค้า',
  promotion: 'โปรโมชัน',
  material: 'วัตถุดิบ',
  idea: 'ไอเดีย',
  factory: 'โรงงาน',
};

const contentTypeBadge: Record<Exclude<ContentType, 'all'>, string> = {
  product: COLORS.productBadgeBlue,
  promotion: COLORS.orange,
  material: '#0EA5A4',
  idea: COLORS.purple,
  factory: COLORS.teal,
};

/* ─── Factory normaliser ─── */
function normFactory(r: Record<string, unknown>): Factory {
  const provinceName = String(r.province_name ?? r.provinceName ?? '').trim();
  return {
    id: String(r.factory_id ?? r.id ?? ''),
    name: String(r.factory_name ?? r.name ?? ''),
    image: String(r.image_url ?? r.image ?? r.logo_url ?? ''),
    location: provinceName || String(r.location ?? r.city ?? ''),
    ...(provinceName ? { provinceName } : {}),
    rating: Number(r.avg_rating ?? r.rating ?? 0),
    reviews: Number(r.review_count ?? r.reviews ?? 0),
    specialization: String(r.specialization ?? ''),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    minOrder: Number(r.min_order ?? r.minOrder ?? 0),
    leadTime: String(r.lead_time ?? r.leadTime ?? ''),
    verified: Boolean(r.is_verified ?? r.verified ?? false),
    completedOrders: Number(r.completed_orders ?? r.completedOrders ?? 0),
    priceRange: String(r.price_range ?? r.priceRange ?? ''),
  };
}

export function FactoryIdeasDesktop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  /**
   * When `pickSubCategory` triggers a category change (hover-selected category
   * differs from effective), the resulting `selectedCategoryIdForSubs` effect
   * would otherwise wipe the sub-id we just set. This ref tells the effect to
   * skip the reset exactly once. (Mobile doesn't need it because the user must
   * tap the category row first — `applyCategory` in `pickSubCategory` is a
   * no-op there, so the effect never re-runs.)
   */
  const skipSubResetOnNextCategoryChangeRef = useRef(false);
  const [menuHighlightCategoryId, setMenuHighlightCategoryId] = useState<string | null>(null);
  const [panelSubs, setPanelSubs] = useState<
    { id: string; name: string; sortOrder: number }[]
  >([]);
  const [panelSubsLoading, setPanelSubsLoading] = useState(false);
  const [subCategories, setSubCategories] = useState<
    { id: string; name: string; sortOrder: number }[]
  >([]);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  /** หมวดทั้งหมดจาก GET /categories + GET /master/product-categories (Explore ยังคงแสดงแค่ 6 การ์ด) */
  const [apiCategoriesAll, setApiCategoriesAll] = useState<{ id: string; name: string }[]>([]);
  const data = useData();
  const { isLiked, toggleFavorite } = useFavorites();

  const isFactoryTab = selectedType === 'factory';
  const isMaterialTab = selectedType === 'material';
  const showcaseApiType = isFactoryTab ? undefined : showcaseQueryTypeFromTab(selectedType);
  const { showcases: pageShowcases, loading: showcasesLoading } = useShowcases({
    type: showcaseApiType,
  });

  /* ── Factory data (GET /factories/) ── */
  const [factoryList, setFactoryList] = useState<Factory[]>([]);
  const [factoriesLoading, setFactoriesLoading] = useState(false);

  useEffect(() => {
    if (selectedType !== 'all' && selectedType !== 'factory') return;
    let cancelled = false;
    setFactoriesLoading(true);
    factoriesApi.list()
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        setFactoryList(arr.map(normFactory).filter((f) => f.id && f.name));
      })
      .catch(() => { if (!cancelled) setFactoryList([]); })
      .finally(() => { if (!cancelled) setFactoriesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedType]);

  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'product' || t === 'promotion' || t === 'idea' || t === 'material' || t === 'factory') {
      setSelectedType(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isMaterialTab || !categoryMenuOpen || !menuHighlightCategoryId || menuHighlightCategoryId === 'all') {
      setPanelSubs([]);
      setPanelSubsLoading(false);
      return;
    }

    // Synchronous cache peek — prefetch likely already resolved this
    const cached = getCachedSubCategoriesSync(menuHighlightCategoryId);
    if (cached) {
      logFactoryIdeasCategory('panelSubs.cacheHit', {
        menuHighlightCategoryId,
        panelSubs: cached,
      });
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
      if (el && !el.contains(e.target as Node)) setCategoryMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [categoryMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isMaterialTab) {
          // Tab วัตถุดิบ → ดึง MT categories จาก GET /lbi/categories?scope=MT
          const raw = await masterApi.lbiCategories('MT') as unknown as Record<string, unknown>;
          if (cancelled) return;
          const arr = (Array.isArray(raw.categories) ? raw.categories : []) as Record<string, unknown>[];
          const rows = arr
            .map((c) => ({ id: String(c.category_id ?? c.id ?? ''), name: String(c.name ?? '') }))
            .filter((r) => r.id && r.name);
          if (!cancelled) setApiCategoriesAll(rows);
        } else {
          // Tab อื่น → ดึง PD categories จาก Explore (merged)
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
            } catch { /* keep [] */ }
          }
          if (!cancelled) {
            setApiCategoriesAll(rows);
            // Prefetch sub-categories for every category in parallel —
            // dropdown clicks become instant (module-level cache in subCategoriesCache.ts)
            prefetchSubCategoriesFor(rows.map((r) => r.id));
            logFactoryIdeasCategory('categoryMenu.apiCategoriesAll', {
              source: categorySource,
              exploreMergedCount: res.merged.length,
              rowCount: rows.length,
              rows,
            });
          }
        }
      } catch {
        if (!cancelled) setApiCategoriesAll([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMaterialTab]);

  /** dropdown: รายการจาก API ก่อน แล้วต่อด้วยหมวดจาก bundle ที่ยังไม่มี id ซ้ำ */
  const categoryFilters = useMemo(() => {
    if (isMaterialTab) {
      // MT: ใช้เฉพาะ categories จาก API scope=MT ไม่รวม bundle PD
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

  const { effectiveCategoryId, applyCategory } = useFactoryIdeasCategorySelection(
    data.categories,
    apiCategoriesAll,
  );

  // Reset category / sub เมื่อสลับระหว่าง material tab กับ tab อื่น
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
    setMenuHighlightCategoryId(
      effectiveCategoryId !== 'all' ? effectiveCategoryId : null,
    );
  }, [categoryMenuOpen, effectiveCategoryId]);

  const selectedCategoryIdForSubs =
    effectiveCategoryId !== 'all' ? effectiveCategoryId : null;

  useEffect(() => {
    // MT showcase ไม่มี sub-category
    if (isMaterialTab) {
      setSelectedSubCategoryId(null);
      setSubCategories([]);
      return;
    }

    // Skip the reset when the category change was triggered by pickSubCategory
    // (it already set the new sub id we want to keep).
    if (skipSubResetOnNextCategoryChangeRef.current) {
      skipSubResetOnNextCategoryChangeRef.current = false;
    } else {
      setSelectedSubCategoryId(null);
    }
    setSubCategories([]);

    if (!selectedCategoryIdForSubs) return;

    // Synchronous cache peek — prefetch likely already resolved this
    const cached = getCachedSubCategoriesSync(selectedCategoryIdForSubs);
    if (cached) {
      setSubCategories(cached);
      return;
    }

    let cancelled = false;
    setSubCategoriesLoading(true);

    loadSubCategories(selectedCategoryIdForSubs)
      .then((mapped) => {
        if (cancelled) return;
        setSubCategories(mapped);
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
    const catName =
      categoryFilters.find((c) => c.id === effectiveCategoryId)?.name ?? 'หมวด';
    if (isMaterialTab) return catName; // MT ไม่มีหมวดย่อย
    if (!selectedSubCategoryId) return `${catName} › ทุกหมวดย่อย`;
    const subName = subCategories.find((s) => s.id === selectedSubCategoryId)?.name;
    return subName ? `${catName} › ${subName}` : `${catName} › หมวดย่อย`;
  }, [
    effectiveCategoryId,
    selectedSubCategoryId,
    categoryFilters,
    subCategories,
    isMaterialTab,
  ]);

  const visibleItems = useMemo(() => {
    if (isFactoryTab) return [];
    const q = searchText.trim().toLowerCase();
    return pageShowcases
      .filter((item) => {
        const hideIdeaFromAll = selectedType === 'all' && item.contentType === 'idea';
        const byType = selectedType === 'all' || item.contentType === selectedType;
        const byCategory = showcaseMatchesSelectedCategoryId(
          item.category,
          effectiveCategoryId,
          apiCategoriesAll,
          data.categories.map((c) => ({ id: String(c.id), name: c.name })),
          item.categoryId,
        );
        const bySubCategory = !(
          selectedSubCategoryId &&
          item.sub_category_id != null &&
          String(item.sub_category_id) !== selectedSubCategoryId
        );
        if (!q) return !hideIdeaFromAll && byType && byCategory && bySubCategory;
        const haystack = [item.title, item.excerpt, item.factoryName, item.category, ...(item.tags ?? [])]
          .join(' ')
          .toLowerCase();
        return !hideIdeaFromAll && byType && byCategory && bySubCategory && haystack.includes(q);
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [searchText, selectedType, effectiveCategoryId, selectedSubCategoryId, pageShowcases, apiCategoriesAll, data.categories, isFactoryTab]);

  const visibleIdeaItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return pageShowcases
      .filter((item) => {
        const byType = item.contentType === 'idea';
        const byCategory = showcaseMatchesSelectedCategoryId(
          item.category,
          effectiveCategoryId,
          apiCategoriesAll,
          data.categories.map((c) => ({ id: String(c.id), name: c.name })),
          item.categoryId,
        );
        const bySubCategory = !(
          selectedSubCategoryId &&
          item.sub_category_id != null &&
          String(item.sub_category_id) !== selectedSubCategoryId
        );
        if (!q) return byType && byCategory && bySubCategory;
        const haystack = [item.title, item.excerpt, item.factoryName, item.category, ...(item.tags ?? [])]
          .join(' ')
          .toLowerCase();
        return byType && byCategory && bySubCategory && haystack.includes(q);
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [searchText, effectiveCategoryId, selectedSubCategoryId, pageShowcases, apiCategoriesAll, data.categories]);

  const visibleMaterialItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return pageShowcases
      .filter((item) => {
        const byType = item.contentType === 'material';
        const byCategory = showcaseMatchesSelectedCategoryId(
          item.category,
          effectiveCategoryId,
          apiCategoriesAll,
          data.categories.map((c) => ({ id: String(c.id), name: c.name })),
          item.categoryId,
        );
        const bySubCategory = !(
          selectedSubCategoryId &&
          item.sub_category_id != null &&
          String(item.sub_category_id) !== selectedSubCategoryId
        );
        if (!q) return byType && byCategory && bySubCategory;
        const haystack = [item.title, item.excerpt, item.factoryName, item.category, ...(item.tags ?? [])]
          .join(' ')
          .toLowerCase();
        return byType && byCategory && bySubCategory && haystack.includes(q);
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [searchText, effectiveCategoryId, selectedSubCategoryId, pageShowcases, apiCategoriesAll, data.categories]);

  const visibleFactories = useMemo(() => {
    if (selectedType !== 'all' && selectedType !== 'factory') return [];
    const q = searchText.trim().toLowerCase();
    return factoryList.filter((f) => {
      if (!q) return true;
      const haystack = [f.name, f.location, f.specialization, ...(f.tags ?? [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [searchText, selectedType, factoryList]);

  const totalCount = isFactoryTab
    ? visibleFactories.length
    : selectedType === 'idea'
      ? visibleIdeaItems.length
      : selectedType === 'material'
        ? visibleMaterialItems.length
      : visibleItems.length + (selectedType === 'all' ? visibleFactories.length + visibleIdeaItems.length : 0);

  const getDetailPath = (type: string, id: string) => {
    const q = encodeURIComponent(id);
    if (type === 'product') return `/product-detail?showcase_id=${q}`;
    if (type === 'material') return `/product-detail?showcase_id=${q}`;
    if (type === 'promotion') return `/promotion-detail?showcase_id=${q}`;
    return `/idea-detail?showcase_id=${q}`;
  };

  const closeCategoryMenu = () => setCategoryMenuOpen(false);

  const pickSubCategory = (subId: string | null, categoryIdForApply: string) => {
    // If the category is about to change as a result of this pick, tell the
    // effect to keep our freshly-chosen sub id instead of clearing it.
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

  return (
    <div className="hidden lg:block min-h-[calc(100vh-4rem)]" style={{ backgroundColor: COLORS.lightPurpleBg }}>

      {/* ── Sticky top bar ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="px-8 py-4 space-y-4">

          {/* Hero banner */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}
          >
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-40 blur-2xl mix-blend-screen" style={{ backgroundColor: '#FF7A00' }} />
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-60 transform translate-x-8 skew-x-[-15deg]" style={{ backgroundColor: '#A238FF' }} />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full opacity-30 blur-xl mix-blend-screen" style={{ backgroundColor: '#A238FF' }} />
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-2.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(162,56,255,0.30)', border: '1px solid rgba(162,56,255,0.50)' }}>
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-0.5" style={{ color: '#EBD3FF' }}>พื้นที่โปรโมตจากโรงงานพาร์ทเนอร์</p>
                <h2 className="text-base font-bold leading-tight">
                  ค้นหาไอเดียสินค้าใหม่ พร้อมโรงงานที่ทำได้จริงในที่เดียว
                </h2>
              </div>
              <span className="shrink-0 text-sm font-semibold" style={{ color: '#EBD3FF' }}>
                {totalCount} รายการ
              </span>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Content type tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(46,34,82,0.07)' }}>
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`px-4 py-2 rounded-lg text-[13px] transition-all ${
                    selectedType === type.id
                      ? 'shadow-sm'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: selectedType === type.id ? COLORS.orange : 'transparent',
                    color: selectedType === type.id ? COLORS.white : COLORS.blue,
                    fontWeight: selectedType === type.id ? 700 : 500,
                    boxShadow: selectedType === type.id ? '0 2px 8px rgba(227,136,68,0.35)' : 'none',
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Multi-level category + sub-category menu */}
            <div ref={categoryMenuRef} className="relative shrink-0 z-20">
              <button
                type="button"
                onClick={() => setCategoryMenuOpen((o) => !o)}
                className="flex items-center gap-2 max-w-[min(100vw-8rem,22rem)] px-4 py-2.5 rounded-xl border text-[13px] transition-all"
                style={{
                  borderColor:
                    effectiveCategoryId !== 'all' || selectedSubCategoryId
                      ? COLORS.purple
                      : '#E5E7EB',
                  backgroundColor:
                    effectiveCategoryId !== 'all' || selectedSubCategoryId
                      ? COLORS.lightPurpleBg
                      : COLORS.gray,
                  color:
                    effectiveCategoryId !== 'all' || selectedSubCategoryId
                      ? COLORS.purple
                      : '#4B5563',
                  fontWeight:
                    effectiveCategoryId !== 'all' || selectedSubCategoryId ? 600 : 400,
                }}
              >
                <span className="truncate min-w-0 text-left">{categoryMenuTriggerLabel}</span>
                <ChevronDown
                  size={12}
                  className={`shrink-0 transition-transform duration-200 ${categoryMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {categoryMenuOpen ? (
                <div className="absolute top-full mt-1.5 left-0 flex rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden max-w-[calc(100vw-4rem)]">
                  <div className={`max-h-[min(75vh,22rem)] overflow-y-auto py-1 shrink-0 ${isMaterialTab ? 'w-56 sm:w-64' : 'w-44 sm:w-52 border-r border-gray-100'}`}>
                    {categoryFilters.map((cat) => {
                      const selected = factoryIdeasCategoryOptionSelected(effectiveCategoryId, cat.id);
                      const rowHi =
                        cat.id === 'all'
                          ? menuHighlightCategoryId == null
                          : menuHighlightCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseEnter={() =>
                            setMenuHighlightCategoryId(cat.id === 'all' ? null : cat.id)
                          }
                          onClick={() => {
                            if (cat.id === 'all') {
                              applyCategory('all');
                              setSelectedSubCategoryId(null);
                              closeCategoryMenu();
                            } else if (isMaterialTab) {
                              // MT ไม่มีหมวดย่อย → ปิดเมนูทันที
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
                          {cat.id !== 'all' ? (
                            <ChevronRight size={14} className="shrink-0 opacity-40" aria-hidden />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {!isMaterialTab && <div className="w-44 sm:w-52 max-h-[min(75vh,22rem)] overflow-y-auto py-1 shrink-0">
                    {!menuHighlightCategoryId ? (
                      <p className="px-3 py-4 text-[11px] text-gray-400 leading-relaxed">
                        เลือกหมวดทางซ้ายเพื่อดูหมวดย่อย
                      </p>
                    ) : panelSubsLoading ? (
                      <div className="flex items-center gap-2 px-3 py-4 text-xs text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: COLORS.purple }} />
                        กำลังโหลดหมวดย่อย…
                      </div>
                    ) : panelSubs.length === 0 ? (
                      <p className="px-3 py-4 text-[11px] text-gray-400">ไม่มีหมวดย่อยในหมวดนี้</p>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => pickSubCategory(null, menuHighlightCategoryId)}
                          className="w-full px-3 py-2.5 text-left text-[13px]"
                          style={{
                            color:
                              !selectedSubCategoryId &&
                              effectiveCategoryId === menuHighlightCategoryId
                                ? COLORS.purple
                                : '#374151',
                            fontWeight:
                              !selectedSubCategoryId &&
                              effectiveCategoryId === menuHighlightCategoryId
                                ? 600
                                : 400,
                            backgroundColor:
                              !selectedSubCategoryId &&
                              effectiveCategoryId === menuHighlightCategoryId
                                ? COLORS.lightPurpleBg
                                : 'transparent',
                          }}
                        >
                          ทุกหมวดย่อย
                        </button>
                        {panelSubs.map((s) => {
                          const active =
                            selectedSubCategoryId === s.id &&
                            effectiveCategoryId === menuHighlightCategoryId;
                          return (
                            <button
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
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>}
                </div>
              ) : null}
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border transition-all w-64"
              style={{ backgroundColor: COLORS.gray, borderColor: '#E5E7EB' }}
            >
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ค้นหาไอเดีย, สินค้า, โรงงาน…"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder-gray-400"
                style={{ color: COLORS.blue }}
              />
              {searchText && (
                <button type="button" onClick={() => setSearchText('')} className="text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-200" style={{ backgroundColor: COLORS.gray }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className="p-2 rounded-lg transition-all"
                style={{
                  backgroundColor: viewMode === 'grid' ? COLORS.white : 'transparent',
                  color: viewMode === 'grid' ? COLORS.purple : '#9CA3AF',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="p-2 rounded-lg transition-all"
                style={{
                  backgroundColor: viewMode === 'list' ? COLORS.white : 'transparent',
                  color: viewMode === 'list' ? COLORS.purple : '#9CA3AF',
                  boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-6">
        {(showcasesLoading || factoriesLoading) ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm gap-2">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.purple }} />
            <p className="text-sm text-gray-500">กำลังโหลดจากเซิร์ฟเวอร์…</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-[14px] font-medium" style={{ color: COLORS.blue }}>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            <p className="text-[12px] text-gray-400 mt-1">ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>
        ) : isFactoryTab ? (
          /* ━━━ Factory-only Grid ━━━ */
          <div className="grid grid-cols-4 gap-3">
            {visibleFactories.map((factory) => (
              <article
                key={factory.id}
                className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col"
                onClick={() => navigate(`/factories/${factory.id}`)}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <ImageWithFallback src={factory.image} alt={factory.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                  {factory.verified && (
                    <div className="absolute top-1 left-1 z-[1] flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <BadgeCheck className="w-2.5 h-2.5 shrink-0" style={{ color: '#A238FF' }} />
                      <span className="font-medium text-[8px]" style={{ color: '#A238FF' }}>ยืนยัน</span>
                    </div>
                  )}
                </div>
                <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                  <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                    {factory.name}
                  </p>
                  <div className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    <span className="text-gray-500 text-[10px] truncate">
                      {(factory.provinceName ?? factory.location).trim() || '—'}
                    </span>
                  </div>
                  <div className="mt-auto pt-1 border-t border-gray-50">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-gray-700 text-[10px] font-semibold">{factory.rating}</span>
                        <span className="text-gray-400 text-[9px] truncate">({factory.reviews})</span>
                      </div>
                      <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {factory.minOrder}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : selectedType === 'idea' ? (
          <div className="grid grid-cols-2 gap-4">
            {visibleIdeaItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              return (
                <article
                  key={item.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 p-4"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: COLORS.purple }}>
                      ไอเดีย
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">{item.factoryName}</span>
                  </div>
                  <h3 className="text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#A656A0] transition-colors" style={{ color: COLORS.blue }}>
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-gray-500 mt-1 line-clamp-3">{item.excerpt || ' '}</p>
                  <div className="pt-2 mt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                        className="flex items-center gap-1 min-w-0 flex-1 text-left text-[10px] font-semibold transition-colors hover:opacity-90"
                        style={{ color: COLORS.blue }}
                      >
                        <span className="truncate">{item.factoryName}</span>
                        {factory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: COLORS.purple }} />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void toggleFavorite(item.id); }}
                        className="flex items-center gap-0 shrink-0 tabular-nums text-[9px] active:opacity-70"
                        aria-label="ถูกใจ"
                      >
                        <Heart
                          className="w-2.5 h-2.5 shrink-0"
                          style={isLiked(item.id) ? { color: '#EF4444', fill: '#EF4444' } : {}}
                        />
                        <span className="text-[10px] leading-none">
                          {item.likes + (isLiked(item.id) ? 1 : 0)}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-3">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: badgeColor }}>
                      {contentTypeLabel[item.contentType]}
                    </span>
                  </div>
                  <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                    <div>
                      <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">{item.title}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate">
                          {(factory?.provinceName ?? factory?.location ?? '').trim() || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto pt-1 border-t border-gray-50">
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-0.5 min-w-0">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                          <span className="text-gray-700 text-[10px] font-semibold">{factory?.rating ?? 0}</span>
                          <span className="text-gray-400 text-[9px] truncate">({factory?.reviews ?? 0})</span>
                        </div>
                        <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {item.minOrder}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 text-white"
                              style={{ backgroundColor: badgeColor }}
                            >
                              {contentTypeLabel[item.contentType]}
                            </span>
                            <span className="text-[10px] text-gray-400">{item.category}</span>
                          </div>
                          <h3 className="text-[13px] font-bold truncate" style={{ color: COLORS.blue }}>{item.title}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{item.excerpt || ' '}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-4 text-[11px] text-gray-400">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); void toggleFavorite(item.id); }}
                            className="flex items-center gap-1 active:opacity-70"
                            aria-label="ถูกใจ"
                          >
                            <Heart
                              className="w-3 h-3"
                              style={isLiked(item.id) ? { color: '#EF4444', fill: '#EF4444' } : {}}
                            />
                            {item.likes + (isLiked(item.id) ? 1 : 0)}
                          </button>
                          <span>MOQ <span className="font-semibold" style={{ color: COLORS.blue }}>{item.minOrder}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                          className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                          style={{ color: COLORS.blue }}
                        >
                          {item.factoryName}
                          {factory?.verified && <BadgeCheck className="w-3.5 h-3.5" style={{ color: COLORS.purple }} />}
                        </button>
                        <span className="text-gray-200">·</span>
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: COLORS.gray, color: COLORS.blue }}>
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
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: COLORS.blue }}>
                <Sparkles className="w-5 h-5" style={{ color: '#0EA5A4' }} />
                วัตถุดิบแนะนำ
              </h3>
              <button
                type="button"
                onClick={() => setSelectedType('material')}
                className="text-[13px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleMaterialItems.length})
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {visibleMaterialItems.slice(0, 5).map((item) => {
                const factory = data.factories.find((f) => f.id === item.factoryId);
                return (
                  <article
                    key={`mt-top-${item.id}`}
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col"
                    onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: '#0EA5A4' }}>
                        วัตถุดิบ
                      </span>
                    </div>
                    <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                      <div>
                        <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">{item.title}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                          <span className="text-gray-500 text-[10px] truncate">
                            {(factory?.provinceName ?? factory?.location ?? '').trim() || '—'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between min-w-0">
                          <div className="flex items-center gap-0.5 min-w-0">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-gray-700 text-[10px] font-semibold">{factory?.rating ?? 0}</span>
                            <span className="text-gray-400 text-[9px] truncate">({factory?.reviews ?? 0})</span>
                          </div>
                          <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {item.minOrder}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ━━━ Factory section ใน tab "ทั้งหมด" ━━━ */}
        {selectedType === 'all' && visibleFactories.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: COLORS.blue }}>
                <MapPin className="w-5 h-5" style={{ color: COLORS.teal }} />
                โรงงานแนะนำ
              </h3>
              <button
                type="button"
                onClick={() => setSelectedType('factory')}
                className="text-[13px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleFactories.length})
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {visibleFactories.slice(0, 5).map((factory) => (
                <div
                  key={`fac-${factory.id}`}
                  onClick={() => navigate(`/factories/${factory.id}`)}
                  className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={factory.image}
                      alt={factory.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {factory.verified === true && (
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                        <BadgeCheck className="w-3 h-3 text-[#A238FF]" />
                        <span className="text-[9px] font-medium" style={{ color: '#A238FF' }}>
                          ยืนยันแล้ว
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-medium text-[13px] leading-tight text-gray-700 mb-1 truncate group-hover:text-[#A238FF] transition-colors">
                        {factory.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[11px] truncate">
                          {(factory.provinceName ?? factory.location).trim() || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-gray-700 text-[11px] font-semibold">{factory.rating}</span>
                        <span className="text-gray-400 text-[9px]">({factory.reviews})</span>
                      </div>
                      <span className="text-gray-400 text-[9px]">ขั้นต่ำ {factory.minOrder}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedType === 'all' && visibleIdeaItems.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: COLORS.blue }}>
                <Sparkles className="w-5 h-5" style={{ color: COLORS.purple }} />
                บทความ Idea
              </h3>
              <button
                type="button"
                onClick={() => setSelectedType('idea')}
                className="text-[13px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleIdeaItems.length})
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {visibleIdeaItems.slice(0, 6).map((item) => {
                const factory = data.factories.find((f) => f.id === item.factoryId);
                return (
                  <article
                    key={`idea-${item.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 p-4"
                    onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: COLORS.purple }}>
                        ไอเดีย
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">{item.factoryName}</span>
                    </div>
                    <h3 className="text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#A656A0] transition-colors" style={{ color: COLORS.blue }}>
                      {item.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 mt-1 line-clamp-3">{item.excerpt || ' '}</p>
                    <div className="pt-2 mt-3 border-t border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                          className="flex items-center gap-1 min-w-0 flex-1 text-left text-[10px] font-semibold transition-colors hover:opacity-90"
                          style={{ color: COLORS.blue }}
                        >
                          <span className="truncate">{item.factoryName}</span>
                          {factory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: COLORS.purple }} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void toggleFavorite(item.id); }}
                          className="flex items-center gap-0 shrink-0 tabular-nums text-[9px] active:opacity-70"
                          aria-label="ถูกใจ"
                        >
                          <Heart
                            className="w-2.5 h-2.5 shrink-0"
                            style={isLiked(item.id) ? { color: '#EF4444', fill: '#EF4444' } : {}}
                          />
                          {item.likes + (isLiked(item.id) ? 1 : 0)}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
        {selectedType === 'all' && visibleMaterialItems.length > 0 && false && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: COLORS.blue }}>
                <Sparkles className="w-5 h-5" style={{ color: '#0EA5A4' }} />
                วัตถุดิบแนะนำ
              </h3>
              <button
                type="button"
                onClick={() => setSelectedType('material')}
                className="text-[13px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleMaterialItems.length})
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {visibleMaterialItems.slice(0, 5).map((item) => {
                const factory = data.factories.find((f) => f.id === item.factoryId);
                return (
                  <article
                    key={`mt-${item.id}`}
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col"
                    onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: '#0EA5A4' }}>
                        วัตถุดิบ
                      </span>
                    </div>
                    <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                      <div>
                        <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">{item.title}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                          <span className="text-gray-500 text-[10px] truncate">
                            {(factory?.provinceName ?? factory?.location ?? '').trim() || '—'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between min-w-0">
                          <div className="flex items-center gap-0.5 min-w-0">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-gray-700 text-[10px] font-semibold">{factory?.rating ?? 0}</span>
                            <span className="text-gray-400 text-[9px] truncate">({factory?.reviews ?? 0})</span>
                          </div>
                          <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {item.minOrder}</span>
                        </div>
                      </div>
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
