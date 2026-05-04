import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Search,
  BadgeCheck,
  Heart,
  Sparkles,
  X,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
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
  /** ป้าย “สินค้า” ให้โทนฟ้า แยกจากสีหัวข้อ */
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

/** สีป้ายให้สอดคล้องหน้า detail: สินค้า=ฟ้า, โปรโมชัน=ส้ม, ไอเดีย=ม่วง */
const contentTypeBadge: Record<Exclude<ContentType, 'all'>, string> = {
  product: COLORS.productBadgeBlue,
  promotion: COLORS.orange,
  material: '#0EA5A4',
  idea: COLORS.purple,
  factory: COLORS.teal,
};

/* ─── Factory normaliser (snake_case API → camelCase) ─── */
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

export function FactoryIdeasMobile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('all');
  const [apiCategoriesAll, setApiCategoriesAll] = useState<{ id: string; name: string }[]>([]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuStep, setCategoryMenuStep] = useState<'categories' | 'subs'>('categories');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const categoryMenuRef = useRef<HTMLDivElement>(null);
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
  const { isLiked, toggleFavorite } = useFavorites();
  const data = useData();

  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'product' || t === 'promotion' || t === 'idea' || t === 'material' || t === 'factory') {
      setSelectedType(t);
    }
  }, [searchParams]);

  /* ── Showcase data (product / promotion / idea) ── */
  const isFactoryTab = selectedType === 'factory';
  const showcaseApiType = isFactoryTab ? undefined : showcaseQueryTypeFromTab(selectedType);
  const { showcases: pageShowcases, loading: showcasesLoading } = useShowcases({
    type: showcaseApiType,
  });

  /* ── Factory data (GET /factories/) ── */
  const [factoryList, setFactoryList] = useState<Factory[]>([]);
  const [factoriesLoading, setFactoriesLoading] = useState(false);

  useEffect(() => {
    // โหลดโรงงานเมื่อ tab = all หรือ factory
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
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchExploreCategoriesMerged();
        if (cancelled) return;
        let rows = res.merged.map((c) => ({ id: String(c.id), name: c.name }));
        let categorySource: 'exploreMerged' | 'masterProductCategories' | 'empty' = 'exploreMerged';
        if (rows.length === 0) {
          categorySource = 'empty';
          try {
            const raw = await masterApi.productCategories();
            if (!cancelled) {
              rows = parseMasterProductCategories(raw);
              categorySource =
                rows.length > 0 ? 'masterProductCategories' : 'empty';
            }
          } catch {
            /* keep [] */
          }
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
      } catch {
        if (!cancelled) setApiCategoriesAll([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryFilters = useMemo(() => {
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
  }, [apiCategoriesAll, data.categories]);

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

  const selectedCategoryIdForSubs =
    effectiveCategoryId !== 'all' ? effectiveCategoryId : null;

  useEffect(() => {
    if (!categoryMenuOpen) return;
    setMenuHighlightCategoryId(
      effectiveCategoryId !== 'all' ? effectiveCategoryId : null,
    );
  }, [categoryMenuOpen, effectiveCategoryId]);

  useEffect(() => {
    if (categoryMenuOpen) setCategoryMenuStep('categories');
  }, [categoryMenuOpen]);

  useEffect(() => {
    if (!categoryMenuOpen || !menuHighlightCategoryId || menuHighlightCategoryId === 'all') {
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
  }, [categoryMenuOpen, menuHighlightCategoryId]);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const el = categoryMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
        setCategoryMenuStep('categories');
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [categoryMenuOpen]);

  useEffect(() => {
    setSelectedSubCategoryId(null);
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
  }, [selectedCategoryIdForSubs]);

  const categoryMenuTriggerLabel = useMemo(() => {
    if (effectiveCategoryId === 'all') return 'ทุกหมวดหมู่';
    const catName =
      categoryFilters.find((c) => c.id === effectiveCategoryId)?.name ?? 'หมวด';
    if (!selectedSubCategoryId) return `${catName} › ทุกหมวดย่อย`;
    const subName = subCategories.find((s) => s.id === selectedSubCategoryId)?.name;
    return subName ? `${catName} › ${subName}` : `${catName} › หมวดย่อย`;
  }, [
    effectiveCategoryId,
    selectedSubCategoryId,
    categoryFilters,
    subCategories,
  ]);

  const closeCategoryMenu = () => {
    setCategoryMenuOpen(false);
    setCategoryMenuStep('categories');
  };

  const pickSubCategory = (subId: string | null, categoryIdForApply: string) => {
    if (categoryIdForApply && categoryIdForApply !== 'all') {
      applyCategory(categoryIdForApply);
    }
    setSelectedSubCategoryId(subId);
    closeCategoryMenu();
  };

  /* ── Showcase filter (product / promotion / idea) ── */
  const visibleItems = useMemo(() => {
    if (isFactoryTab) return []; // factory tab ใช้ visibleFactories แทน
    const q = searchText.trim().toLowerCase();
    return pageShowcases
      .filter((item) => {
        const hideIdeaFromAll = selectedType === 'all' && item.contentType === 'idea';
        const byType     = selectedType === 'all' || item.contentType === selectedType;
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
          .join(' ').toLowerCase();
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
          .join(' ').toLowerCase();
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
          .join(' ').toLowerCase();
        return byType && byCategory && bySubCategory && haystack.includes(q);
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [searchText, effectiveCategoryId, selectedSubCategoryId, pageShowcases, apiCategoriesAll, data.categories]);

  /* ── Factory filter ── */
  const visibleFactories = useMemo(() => {
    if (selectedType !== 'all' && selectedType !== 'factory') return [];
    const q = searchText.trim().toLowerCase();
    return factoryList.filter((f) => {
      if (!q) return true;
      const haystack = [f.name, f.location, f.specialization, ...(f.tags ?? [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [searchText, selectedType, factoryList]);

  /* ── Total count ── */
  const totalCount = isFactoryTab
    ? visibleFactories.length
    : selectedType === 'idea'
      ? visibleIdeaItems.length
      : selectedType === 'material'
        ? visibleMaterialItems.length
      : visibleItems.length + (selectedType === 'all' ? visibleFactories.length + visibleIdeaItems.length : 0);

  /** Showcase จาก GET /showcases — PD→product-detail, PM→promotion-detail, ID→idea-detail */
  const getDetailPath = (type: string, id: string) => {
    const q = encodeURIComponent(id);
    if (type === 'product') return `/product-detail?showcase_id=${q}`;
    if (type === 'material') return `/product-detail?showcase_id=${q}`;
    if (type === 'promotion') return `/promotion-detail?showcase_id=${q}`;
    return `/idea-detail?showcase_id=${q}`;
  };

  return (
    <div className="pb-24 min-h-screen" style={{ backgroundColor: COLORS.lightPurpleBg }}>
      {/* ── Header ── */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="mb-2.5">
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: COLORS.orange }}>Discover</p>
          <h1 className="text-lg font-bold leading-tight" style={{ color: COLORS.blue }}>แนะนำโรงงาน</h1>
        </div>

        {/* Hero banner — กระชับขึ้น ~ครึ่งหนึ่ง */}
        <div
          className="rounded-xl px-3 py-2.5 relative overflow-hidden text-white shadow-md mb-2.5"
          style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}
        >
          <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full opacity-35 blur-xl mix-blend-screen pointer-events-none" style={{ backgroundColor: '#FF7A00' }} />
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-50 transform translate-x-5 skew-x-[-15deg] pointer-events-none" style={{ backgroundColor: '#A238FF' }} />
          <div className="absolute -left-2 -bottom-2 w-14 h-14 rounded-full opacity-25 blur-lg mix-blend-screen pointer-events-none" style={{ backgroundColor: '#A238FF' }} />
          <div className="relative z-10 flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-full shrink-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(162,56,255,0.30)', border: '1px solid rgba(162,56,255,0.50)' }}
            >
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium leading-snug mb-0.5" style={{ color: '#EBD3FF' }}>
                พื้นที่โปรโมตจากโรงงานพาร์ทเนอร์
              </p>
              <h2 className="text-[13px] font-bold leading-snug line-clamp-2">
                ค้นหาไอเดียสินค้าใหม่ พร้อมโรงงานที่ทำได้จริงในที่เดียว
              </h2>
            </div>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums leading-none py-0.5 px-1.5 rounded-md self-center" style={{ color: '#EBD3FF', background: 'rgba(255,255,255,0.12)' }}>
              {totalCount} รายการ
            </span>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 border transition-all"
          style={{ backgroundColor: COLORS.gray, borderColor: '#E5E7EB' }}
        >
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาไอเดีย สินค้า หรือชื่อโรงงาน…"
            className="flex-1 text-[13px] bg-transparent outline-none placeholder-gray-400 min-w-0"
            style={{ color: COLORS.blue }}
          />
          {searchText && (
            <button type="button" onClick={() => setSearchText('')} className="shrink-0 p-0.5">
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* ── Sticky filter bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">

        {/* Row 1: Content type pills — scroll แนวนอน แถวเดียว */}
        <div
          className="flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {CONTENT_TYPES.map((type) => {
            const active = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] transition-all whitespace-nowrap ${
                  active ? 'shadow-sm' : 'active:scale-95'
                }`}
                style={{
                  backgroundColor: active ? COLORS.orange : 'rgba(46,34,82,0.07)',
                  color: active ? COLORS.white : COLORS.blue,
                  fontWeight: active ? 700 : 500,
                  boxShadow: active ? '0 2px 8px rgba(227,136,68,0.30)' : 'none',
                }}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Row 2: Category (multi-level) + จำนวน + view toggle */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">

          <div ref={categoryMenuRef} className="relative flex-1 min-w-[min(100%,10rem)] z-30">
            <button
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
            </button>
            {categoryMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 max-h-[50vh] overflow-y-auto z-40">
                {categoryMenuStep === 'categories' ? (
                  categoryFilters.map((cat) => {
                    const selected = factoryIdeasCategoryOptionSelected(effectiveCategoryId, cat.id);
                    const isAll = cat.id === 'all';
                    return (
                      <button
                        key={isAll ? 'all' : `cat-${cat.id}`}
                        type="button"
                        onClick={() => {
                          if (isAll) {
                            applyCategory('all');
                            setSelectedSubCategoryId(null);
                            closeCategoryMenu();
                          } else {
                            applyCategory(cat.id);
                            setMenuHighlightCategoryId(cat.id);
                            setCategoryMenuStep('subs');
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
                        {!isAll && (
                          <ChevronRight size={16} className="shrink-0 text-gray-400" aria-hidden />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setCategoryMenuStep('categories')}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-[12px] font-medium active:bg-gray-50"
                      style={{ color: COLORS.purple }}
                    >
                      <ChevronLeft size={18} className="shrink-0" aria-hidden />
                      หมวดหมู่
                    </button>
                    <div className="mx-3 border-t border-gray-100" />
                    {panelSubsLoading ? (
                      <div className="px-4 py-6 flex items-center justify-center gap-2 text-[12px] text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        กำลังโหลดหมวดย่อย...
                      </div>
                    ) : panelSubs.length === 0 ? (
                      <p className="px-4 py-4 text-center text-[12px] text-gray-500">
                        ไม่มีหมวดย่อยในหมวดนี้
                      </p>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const cid = menuHighlightCategoryId;
                            if (cid) pickSubCategory(null, cid);
                          }}
                          className="w-full px-4 py-2.5 text-left text-[12px] transition-colors active:bg-gray-50"
                          style={{
                            color: !selectedSubCategoryId ? COLORS.purple : '#374151',
                            fontWeight: !selectedSubCategoryId ? 600 : 400,
                            backgroundColor: !selectedSubCategoryId ? COLORS.lightPurpleBg : 'transparent',
                          }}
                        >
                          ทุกหมวดย่อย
                        </button>
                        {panelSubs.map((s) => {
                          const sel = selectedSubCategoryId === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                const cid = menuHighlightCategoryId;
                                if (cid) pickSubCategory(s.id, cid);
                              }}
                              className="w-full px-4 py-2.5 text-left text-[12px] transition-colors active:bg-gray-50"
                              style={{
                                color: sel ? COLORS.purple : '#374151',
                                fontWeight: sel ? 600 : 400,
                                backgroundColor: sel ? COLORS.lightPurpleBg : 'transparent',
                              }}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Count badge */}
          <span
            className="shrink-0 text-[11px] font-semibold tabular-nums px-2 py-1 rounded-md"
            style={{ color: COLORS.blue, backgroundColor: 'rgba(46,34,82,0.06)' }}
          >
            {totalCount} รายการ
          </span>

          {/* View toggle */}
          <div
            className="shrink-0 flex items-center gap-0.5 p-0.5 rounded-lg border border-gray-200"
            style={{ backgroundColor: COLORS.gray }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className="p-1.5 rounded-md transition-all"
              style={{
                backgroundColor: viewMode === 'grid' ? COLORS.white : 'transparent',
                color: viewMode === 'grid' ? COLORS.purple : '#9CA3AF',
                boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
              aria-label="มุมมองตาราง"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="p-1.5 rounded-md transition-all"
              style={{
                backgroundColor: viewMode === 'list' ? COLORS.white : 'transparent',
                color: viewMode === 'list' ? COLORS.purple : '#9CA3AF',
                boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
              aria-label="มุมมองรายการ"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-4">
        {(showcasesLoading || factoriesLoading) ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.purple }} />
            <span className="ml-2 text-sm text-gray-500">กำลังโหลด...</span>
          </div>
        ) : totalCount === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium" style={{ color: COLORS.blue }}>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>

        ) : isFactoryTab ? (
          /* ━━━ Factory-only Grid ━━━ */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {visibleFactories.map((factory) => (
              <article
                key={factory.id}
                className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                onClick={() => navigate(`/factories/${factory.id}`)}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <ImageWithFallback src={factory.image} alt={factory.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {factory.verified && (
                    <div className="absolute top-1 left-1 z-[1] flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <BadgeCheck className="w-2.5 h-2.5 shrink-0" style={{ color: '#A238FF' }} />
                      <span className="font-medium text-[8px]" style={{ color: '#A238FF' }}>ยืนยัน</span>
                    </div>
                  )}
                </div>
                {/* Body */}
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
                  {/* Footer */}
                  <div className="mt-auto pt-1 border-t border-gray-50">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-gray-700 text-[10px] font-semibold">{factory.rating}</span>
                        <span className="text-gray-400 text-[9px]">({factory.reviews})</span>
                      </div>
                      <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {factory.minOrder}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : selectedType === 'idea' ? (
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {visibleIdeaItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer p-3"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: COLORS.purple }}>
                      ไอเดีย
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">{item.factoryName}</span>
                  </div>
                  <h3 className="text-[13px] font-bold leading-[19px] line-clamp-2" style={{ color: COLORS.blue }}>
                    {item.title}
                  </h3>
                  <p className="text-[11px] leading-[16px] text-gray-500 mt-1 line-clamp-3">
                    {item.excerpt || ' '}
                  </p>
                  <div className="pt-2 mt-2 border-t border-gray-100">
                    <div className="h-[18px] mb-1 min-w-0">
                      {item.factoryName ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/factories/${item.factoryId}`);
                          }}
                          className="flex items-center gap-1 w-full text-left text-[10px] font-semibold active:opacity-80 min-w-0"
                          style={{ color: COLORS.blue }}
                        >
                          <span className="truncate">{item.factoryName}</span>
                          {factory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: COLORS.purple }} />}
                        </button>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-end min-w-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void toggleFavorite(item.id); }}
                        className="flex items-center gap-1 shrink-0 text-[10px] text-gray-400 active:opacity-70"
                        aria-label="ถูกใจ"
                      >
                        <Heart
                          className="w-3 h-3 shrink-0"
                          style={isLiked(item.id) ? { color: '#EF4444', fill: '#EF4444' } : {}}
                        />
                        <span className="tabular-nums font-medium text-gray-500">
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
          /* ━━━ Grid View ━━━
             Rule: grid + items-stretch → ทุกการ์ดในแถวเดียวกันสูงเท่ากัน
             Rule: h-full + flex flex-col → การ์ดยืดเต็ม Grid Track */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  {/* ── Image: h-[150px] ตายตัว + shrink-0 ป้องกัน flex บีบ ── */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className="absolute top-1 left-1 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
                      style={{ backgroundColor: badgeColor }}
                    >
                      {contentTypeLabel[item.contentType]}
                    </span>
                  </div>

                  {/* ── Body: flex-1 ยืดเต็มที่เหลือ + min-w-0 ให้ truncate ทำงาน ── */}
                  <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">

                    {/* Title — min-h-[36px] จอง 2 บรรทัดเสมอ */}
                    <h3 className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-0.5 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                      <span className="text-gray-500 text-[10px] truncate">
                        {(factory?.provinceName ?? factory?.location ?? '').trim() || '—'}
                      </span>
                    </div>

                    {/* ── Footer: mt-auto ดันลงล่างเสมอ ── */}
                    <div className="mt-auto pt-1 border-t border-gray-50">
                      {/* Factory name — h-[18px] ตายตัว ไม่ว่ามีหรือไม่มีชื่อ */}
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
          /* ━━━ List View ━━━
             Rule: h-[130px] ตายตัว + overflow-hidden ซ่อนส่วนที่ล้น */
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className="h-[130px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className="flex h-full p-3 gap-3">

                    {/* ── Image: w-[100px] + shrink-0 ล็อคขนาด ── */}
                    <div className="w-[100px] shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className="absolute top-1.5 left-1.5 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {contentTypeLabel[item.contentType]}
                      </span>
                    </div>

                    {/* ── Content: flex-1 + min-w-0 ป้องกันทะลักกรอบ ── */}
                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                      <div className="min-w-0">
                        {item.category && (
                          <p className="text-[9px] text-gray-400 truncate mb-0.5">{item.category}</p>
                        )}
                        <h3
                          className="text-[12px] font-bold leading-snug line-clamp-2 min-w-0"
                          style={{ color: COLORS.blue }}
                        >
                          {item.title}
                        </h3>
                        <p className="text-[10px] leading-[15px] text-gray-500 line-clamp-2 mt-1">
                          {item.excerpt || ' '}
                        </p>
                      </div>

                      {/* Footer — mt-auto ติดขอบล่าง */}
                      <div className="flex items-center justify-between gap-2 mt-auto pt-1.5 border-t border-gray-50 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                          className="flex items-center gap-1 text-[10px] font-semibold min-w-0 text-left active:opacity-80"
                          style={{ color: COLORS.blue }}
                        >
                          <span className="truncate">{item.factoryName}</span>
                          {factory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: COLORS.purple }} />}
                        </button>
                        <span className="text-[9px] text-gray-400 shrink-0">
                          MOQ <span className="font-semibold tabular-nums" style={{ color: COLORS.blue }}>{item.minOrder}</span>
                        </span>
                      </div>
                    </div>

                    {/* ── Right column: w-[40px] + shrink-0 ล็อคขนาด ── */}
                    <div className="w-[40px] shrink-0 flex flex-col items-center justify-center border-l border-gray-100 pl-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void toggleFavorite(item.id); }}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-gray-400 active:opacity-70"
                        aria-label="ถูกใจ"
                      >
                        <Heart
                          className="w-4 h-4 shrink-0"
                          style={isLiked(item.id) ? { color: '#EF4444', fill: '#EF4444' } : {}}
                        />
                        <span className="text-[9px] font-medium tabular-nums leading-none">
                          {item.likes + (isLiked(item.id) ? 1 : 0)}
                        </span>
                      </button>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ━━━ Factory section ใน tab "ทั้งหมด" ━━━ */}
        {selectedType === 'all' && visibleFactories.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: COLORS.blue }}>
                <MapPin className="w-4 h-4" style={{ color: COLORS.teal }} />
                โรงงานแนะนำ
              </h3>
              <button
                type="button"
                onClick={() => setSelectedType('factory')}
                className="text-[11px] font-medium"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleFactories.length})
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {visibleFactories.slice(0, 4).map((factory) => (
                <div
                  key={`fac-${factory.id}`}
                  onClick={() => navigate(`/factories/${factory.id}`)}
                  className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={factory.image}
                      alt={factory.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {factory.verified === true && (
                      <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                        <BadgeCheck className="w-2.5 h-2.5 shrink-0" style={{ color: '#A238FF' }} />
                        <span className="font-medium text-[8px]" style={{ color: '#A238FF' }}>
                          ยืนยัน
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                    <div>
                      <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                        {factory.name}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate">
                          {(factory.provinceName ?? factory.location).trim() || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-gray-700 text-[10px] font-semibold">{factory.rating}</span>
                        <span className="text-gray-400 text-[9px] truncate">({factory.reviews})</span>
                      </div>
                      <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {factory.minOrder}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedType === 'all' && visibleIdeaItems.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: COLORS.blue }}>
                <Sparkles className="w-4 h-4" style={{ color: COLORS.purple }} />
                บทความ Idea
              </h3>
              <button
                type="button"
                onClick={() => setSelectedType('idea')}
                className="text-[11px] font-medium"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleIdeaItems.length})
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              {visibleIdeaItems.slice(0, 4).map((item) => {
                const factory = data.factories.find((f) => f.id === item.factoryId);
                return (
                  <article
                    key={`idea-${item.id}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer p-3"
                    onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: COLORS.purple }}>
                        ไอเดีย
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">{item.factoryName}</span>
                    </div>
                    <h3 className="text-[13px] font-bold leading-[19px] line-clamp-2" style={{ color: COLORS.blue }}>
                      {item.title}
                    </h3>
                    <p className="text-[11px] leading-[16px] text-gray-500 mt-1 line-clamp-3">
                      {item.excerpt || ' '}
                    </p>
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <div className="h-[18px] mb-1 min-w-0">
                        {item.factoryName ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/factories/${item.factoryId}`);
                            }}
                            className="flex items-center gap-1 w-full text-left text-[10px] font-semibold active:opacity-80 min-w-0"
                            style={{ color: COLORS.blue }}
                          >
                            <span className="truncate">{item.factoryName}</span>
                            {factory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: COLORS.purple }} />}
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between min-w-0">
                        <span className="text-[10px] text-gray-400 shrink-0">
                          MOQ{' '}
                          <span className="font-semibold tabular-nums" style={{ color: COLORS.blue }}>
                            {item.minOrder}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void toggleFavorite(item.id); }}
                          className="flex items-center gap-1 shrink-0 text-[10px] text-gray-400 active:opacity-70"
                          aria-label="ถูกใจ"
                        >
                          <Heart
                            className="w-3 h-3 shrink-0"
                            style={isLiked(item.id) ? { color: '#EF4444', fill: '#EF4444' } : {}}
                          />
                          <span className="tabular-nums font-medium text-gray-500">
                            {item.likes + (isLiked(item.id) ? 1 : 0)}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
        {selectedType === 'all' && visibleMaterialItems.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: COLORS.blue }}>
                <Sparkles className="w-4 h-4" style={{ color: '#0EA5A4' }} />
                วัตถุดิบแนะนำ
              </h3>
              <button
                type="button"
                onClick={() => setSelectedType('material')}
                className="text-[11px] font-medium"
                style={{ color: COLORS.purple }}
              >
                ดูทั้งหมด ({visibleMaterialItems.length})
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {visibleMaterialItems.slice(0, 4).map((item) => {
                const factory = data.factories.find((f) => f.id === item.factoryId);
                return (
                  <article
                    key={`mt-${item.id}`}
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
                    onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-1 left-1 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: '#0EA5A4' }}>
                        วัตถุดิบ
                      </span>
                    </div>
                    <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                      <h3 className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate">
                          {(factory?.provinceName ?? factory?.location ?? '').trim() || '—'}
                        </span>
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
