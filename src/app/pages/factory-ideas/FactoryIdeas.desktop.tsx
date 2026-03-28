import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
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
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ImageWithFallback } from '../../components/shared';

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

export function FactoryIdeasDesktop() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const data = useData();

  const categoryFilters = useMemo(
    () => [
      { id: 'all', name: 'ทุกหมวดหมู่' },
      ...data.categories.map((c) => ({ id: c.name, name: c.name })),
    ],
    [data.categories],
  );

  const visibleItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return data.factoryShowcases
      .filter((item) => {
        const byType = selectedType === 'all' || item.contentType === selectedType;
        const byCategory = selectedCategory === 'all' || item.category === selectedCategory;
        if (!q) return byType && byCategory;
        const haystack = [item.title, item.excerpt, item.factoryName, item.category, ...(item.tags ?? [])]
          .join(' ')
          .toLowerCase();
        return byType && byCategory && haystack.includes(q);
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [searchText, selectedType, selectedCategory]);

  const getDetailPath = (type: string, id: string) => {
    if (type === 'product') return `/factory-ideas/products/${id}`;
    if (type === 'promotion') return `/factory-ideas/promotions/${id}`;
    return `/factory-ideas/ideas/${id}`;
  };

  const selectedCategoryName = categoryFilters.find((c) => c.id === selectedCategory)?.name ?? 'ทุกหมวดหมู่';

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
                {visibleItems.length} รายการ
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

            {/* Category dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] transition-all"
                style={{
                  borderColor: selectedCategory !== 'all' ? COLORS.purple : '#E5E7EB',
                  backgroundColor: selectedCategory !== 'all' ? COLORS.lightPurpleBg : COLORS.gray,
                  color: selectedCategory !== 'all' ? COLORS.purple : '#4B5563',
                  fontWeight: selectedCategory !== 'all' ? 600 : 400,
                }}
              >
                {selectedCategoryName}
                <ChevronDown size={12} className={`transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryOpen && (
                <div className="absolute top-full mt-1.5 left-0 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-20 min-w-[180px] max-h-64 overflow-y-auto">
                  {categoryFilters.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setSelectedCategory(cat.id); setCategoryOpen(false); }}
                      className="w-full px-4 py-2 text-left text-[13px] transition-colors"
                      style={{
                        color: selectedCategory === cat.id ? COLORS.purple : '#374151',
                        fontWeight: selectedCategory === cat.id ? 600 : 400,
                        backgroundColor: selectedCategory === cat.id ? COLORS.lightPurpleBg : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (selectedCategory !== cat.id) e.currentTarget.style.backgroundColor = COLORS.lightPurpleBg; }}
                      onMouseLeave={(e) => { if (selectedCategory !== cat.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
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
        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-[14px] font-medium" style={{ color: COLORS.blue }}>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            <p className="text-[12px] text-gray-400 mt-1">ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const badgeColor = contentTypeBadge[item.contentType];
              return (
                <article
                  key={item.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className="relative h-36 overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {contentTypeLabel[item.contentType]}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={11} className="text-white" />
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <h3 className="text-[12px] font-bold line-clamp-2 leading-snug" style={{ color: COLORS.blue }}>{item.title}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{item.excerpt}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                        className="flex items-center gap-1 text-[10px] font-semibold truncate max-w-[70%] transition-colors"
                        style={{ color: COLORS.blue }}
                      >
                        {item.factoryName}
                        {factory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: COLORS.purple }} />}
                      </button>
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Heart className="w-2.5 h-2.5" />{item.likes}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">MOQ <span className="font-semibold" style={{ color: COLORS.blue }}>{item.minOrder}</span></p>
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
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{item.excerpt}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-4 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{item.likes}</span>
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
      </div>
    </div>
  );
}
