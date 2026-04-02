import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, BadgeCheck, Heart, Sparkles, X, Loader2, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ImageWithFallback } from '../../components/shared';
import { masterApi, favoritesApi } from '../../services/api';
import { fetchExploreCategoriesMerged } from '../../utils/exploreCategoriesFromApi';
import {
  factoryIdeasCategoryOptionSelected,
  factoryIdeasSelectedCategoryLabel,
  parseMasterProductCategories,
  showcaseMatchesSelectedCategoryId,
} from '../../utils/exploreToFactoryIdeasCategory';
import { useFactoryIdeasCategorySelection } from '../../hooks/useFactoryIdeasCategoryFromUrl';
import { useShowcases, showcaseQueryTypeFromTab } from '../../hooks/useShowcases';

const COLORS = {
  purple: '#7A4B94',
  purpleLight: '#9D77B2',
  orange: '#E38844',
  blue: '#2E2252',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  lightPurpleBg: '#F8F6FA',
};

type ContentType = 'all' | 'product' | 'promotion' | 'idea';

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'product', label: 'สินค้า' },
  { id: 'promotion', label: 'โปรโมชัน' },
  { id: 'idea', label: 'ไอเดีย' },
];

const contentTypeLabel: Record<Exclude<ContentType, 'all'>, string> = {
  product: 'สินค้า',
  promotion: 'โปรโมชัน',
  idea: 'ไอเดีย',
};

const contentTypeBadge: Record<Exclude<ContentType, 'all'>, string> = {
  product: COLORS.orange,
  promotion: COLORS.purple,
  idea: COLORS.blue,
};

export function FactoryIdeasMobile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('all');
  const [apiCategoriesAll, setApiCategoriesAll] = useState<{ id: string; name: string }[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  // Optimistic favorites: Set of showcase IDs that this session has liked
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const data = useData();

  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'product' || t === 'promotion' || t === 'idea') {
      setSelectedType(t);
    }
  }, [searchParams]);

  const showcaseApiType = showcaseQueryTypeFromTab(selectedType);
  const { showcases: pageShowcases, loading: showcasesLoading } = useShowcases({
    type: showcaseApiType,
  });

  const toggleFavorite = useCallback(async (showcaseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const numId = Number(showcaseId);
    const wasLiked = likedIds.has(showcaseId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(showcaseId); else next.add(showcaseId);
      return next;
    });
    try {
      if (wasLiked) await favoritesApi.remove(numId);
      else await favoritesApi.add(numId);
    } catch {
      // revert
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(showcaseId); else next.delete(showcaseId);
        return next;
      });
    }
  }, [likedIds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchExploreCategoriesMerged();
        if (cancelled) return;
        let rows = res.merged.map((c) => ({ id: String(c.id), name: c.name }));
        if (rows.length === 0) {
          try {
            const raw = await masterApi.productCategories();
            if (!cancelled) rows = parseMasterProductCategories(raw);
          } catch {
            /* keep [] */
          }
        }
        if (!cancelled) setApiCategoriesAll(rows);
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

  const { effectiveCategoryId, applyCategory } = useFactoryIdeasCategorySelection(
    data.categories,
    apiCategoriesAll,
  );

  const selectedCategoryName = factoryIdeasSelectedCategoryLabel(
    effectiveCategoryId,
    categoryFilters,
  );

  useEffect(() => {
    if (!categoryOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const el = categoryDropdownRef.current;
      if (el && !el.contains(e.target as Node)) setCategoryOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [categoryOpen]);

  const visibleItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return pageShowcases
      .filter((item) => {
        const byType     = selectedType === 'all' || item.contentType === selectedType;
        const byCategory = showcaseMatchesSelectedCategoryId(
          item.category,
          effectiveCategoryId,
          apiCategoriesAll,
          data.categories.map((c) => ({ id: String(c.id), name: c.name })),
          item.categoryId,
        );
        if (!q) return byType && byCategory;
        const haystack = [item.title, item.excerpt, item.factoryName, item.category, ...(item.tags ?? [])]
          .join(' ').toLowerCase();
        return byType && byCategory && haystack.includes(q);
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [searchText, selectedType, effectiveCategoryId, pageShowcases, apiCategoriesAll, data.categories]);

  const getDetailPath = (type: string, id: string) => {
    if (type === 'product')   return `/factory-ideas/products/${id}`;
    if (type === 'promotion') return `/factory-ideas/promotions/${id}`;
    return `/factory-ideas/ideas/${id}`;
  };

  return (
    <div className="pb-24 min-h-screen" style={{ backgroundColor: COLORS.lightPurpleBg }}>
      {/* ── Header ── */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: COLORS.orange }}>Discover</p>
          <h1 className="text-xl font-bold" style={{ color: COLORS.blue }}>แนะนำโรงงาน</h1>
        </div>

        {/* Hero banner */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden text-white shadow-md mb-4"
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
              {visibleItems.length} รายการ
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 border transition-all" style={{ backgroundColor: COLORS.gray, borderColor: '#E5E7EB' }}>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาไอเดีย สินค้า หรือชื่อโรงงาน…"
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
            style={{ color: COLORS.blue }}
          />
          {searchText && (
            <button type="button" onClick={() => setSearchText('')}>
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* ── Sticky filter pills ── */}
      <div className="bg-white border-b border-gray-100 px-4 pt-3 pb-3 space-y-2.5">
        {/* Content type */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className="shrink-0 px-4 py-1.5 rounded-full text-[13px] transition-all"
              style={{
                background: selectedType === type.id ? COLORS.orange : 'rgba(46,34,82,0.07)',
                color:      selectedType === type.id ? COLORS.white : COLORS.blue,
                fontWeight: selectedType === type.id ? 700 : 500,
                boxShadow:  selectedType === type.id ? '0 2px 8px rgba(227,136,68,0.35)' : 'none',
              }}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Category — dropdown (เดียวกับ desktop) */}
        <div ref={categoryDropdownRef} className="relative w-full z-20">
          <button
            type="button"
            onClick={() => setCategoryOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-[13px] transition-all"
            style={{
              borderColor: effectiveCategoryId !== 'all' ? COLORS.purple : '#E5E7EB',
              backgroundColor: effectiveCategoryId !== 'all' ? COLORS.lightPurpleBg : COLORS.gray,
              color: effectiveCategoryId !== 'all' ? COLORS.purple : '#4B5563',
              fontWeight: effectiveCategoryId !== 'all' ? 600 : 400,
            }}
          >
            <span className="truncate text-left">{selectedCategoryName}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {categoryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg py-1 max-h-60 overflow-y-auto">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id === 'all' ? 'all' : `cat-${cat.id}`}
                  type="button"
                  onClick={() => {
                    applyCategory(cat.id);
                    setCategoryOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-[13px] transition-colors active:bg-gray-50"
                  style={{
                    color: factoryIdeasCategoryOptionSelected(effectiveCategoryId, cat.id)
                      ? COLORS.purple
                      : '#374151',
                    fontWeight: factoryIdeasCategoryOptionSelected(effectiveCategoryId, cat.id) ? 600 : 400,
                    backgroundColor: factoryIdeasCategoryOptionSelected(effectiveCategoryId, cat.id)
                      ? COLORS.lightPurpleBg
                      : 'transparent',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <p className="text-[11px] flex-1 min-w-0" style={{ color: COLORS.blue }}>
            พบ <span className="font-semibold">{visibleItems.length}</span> รายการ
          </p>
          <div
            className="flex items-center gap-1 p-1 rounded-xl border border-gray-200 shrink-0"
            style={{ backgroundColor: COLORS.gray }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className="p-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: viewMode === 'grid' ? COLORS.white : 'transparent',
                color: viewMode === 'grid' ? COLORS.purple : '#9CA3AF',
                boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
              aria-label="มุมมองตาราง"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="p-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: viewMode === 'list' ? COLORS.white : 'transparent',
                color: viewMode === 'list' ? COLORS.purple : '#9CA3AF',
                boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
              aria-label="มุมมองรายการ"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="px-4 pt-4">
        {showcasesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.purple }} />
            <span className="ml-2 text-sm text-gray-500">กำลังโหลด...</span>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium" style={{ color: COLORS.blue }}>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  {/* Image */}
                  <div className="relative h-32 bg-gray-100">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {contentTypeLabel[item.contentType]}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-2.5 space-y-1.5">
                    <h3 className="text-[12px] font-bold line-clamp-2 leading-snug" style={{ color: COLORS.blue }}>
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>

                    {/* Factory name */}
                    <div className="pt-1.5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                        className="flex items-center gap-1 text-[10px] font-semibold transition-colors truncate w-full"
                        style={{ color: COLORS.blue }}
                      >
                        <span className="truncate">{item.factoryName}</span>
                        {factory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: COLORS.purple }} />}
                      </button>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                        <span>MOQ <span className="font-medium" style={{ color: COLORS.blue }}>{item.minOrder}</span></span>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(item.id, e)}
                          className="flex items-center gap-0.5 transition-colors"
                          aria-label="ถูกใจ"
                        >
                          <Heart
                            className="w-2.5 h-2.5"
                            style={likedIds.has(item.id) ? { color: '#EF4444', fill: '#EF4444' } : {}}
                          />
                          {item.likes + (likedIds.has(item.id) ? 1 : 0)}
                        </button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full text-[9px]" style={{ backgroundColor: COLORS.gray, color: COLORS.blue }}>
                          #{tag}
                        </span>
                      ))}
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
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span
                              className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                              style={{ backgroundColor: badgeColor }}
                            >
                              {contentTypeLabel[item.contentType]}
                            </span>
                            {item.category ? (
                              <span className="text-[9px] text-gray-400 truncate max-w-[120px]">{item.category}</span>
                            ) : null}
                          </div>
                          <h3 className="text-[12px] font-bold line-clamp-2 leading-snug" style={{ color: COLORS.blue }}>
                            {item.title}
                          </h3>
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.excerpt}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-0.5 text-[10px] text-gray-400">
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className="flex items-center gap-0.5 p-0.5 -mr-0.5"
                            aria-label="ถูกใจ"
                          >
                            <Heart
                              className="w-3 h-3"
                              style={likedIds.has(item.id) ? { color: '#EF4444', fill: '#EF4444' } : {}}
                            />
                            <span>{item.likes + (likedIds.has(item.id) ? 1 : 0)}</span>
                          </button>
                          <span>
                            MOQ <span className="font-semibold" style={{ color: COLORS.blue }}>{item.minOrder}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                        className="flex items-center gap-1 text-[10px] font-semibold mt-1.5 truncate w-full text-left"
                        style={{ color: COLORS.blue }}
                      >
                        <span className="truncate">{item.factoryName}</span>
                        {factory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: COLORS.purple }} />}
                      </button>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded-full text-[9px]"
                              style={{ backgroundColor: COLORS.gray, color: COLORS.blue }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
