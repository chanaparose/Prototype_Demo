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

const contentTypeStyle: Record<Exclude<ContentType, 'all'>, { color: string; bg: string }> = {
  product: { color: '#1D4ED8', bg: '#DBEAFE' },
  promotion: { color: '#B45309', bg: '#FEF3C7' },
  idea: { color: '#7C3AED', bg: '#EDE9FE' },
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
    <div className="hidden lg:block min-h-[calc(100vh-4rem)] bg-gray-50">

      {/* ── Sticky top bar ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="px-8 py-4 space-y-4">

          {/* Hero banner */}
          <div className="flex items-center gap-4 px-5 py-3.5 bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] rounded-2xl">
            <Sparkles className="w-4 h-4 text-purple-200 shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-purple-200 font-medium">พื้นที่โปรโมตจากโรงงานพาร์ทเนอร์</p>
              <p className="text-[14px] font-bold text-white">
                ค้นหาไอเดียสินค้าใหม่ พร้อมโรงงานที่ทำได้จริงในที่เดียว
              </p>
            </div>
            <span className="text-[12px] font-semibold text-purple-200 shrink-0">
              {visibleItems.length} รายการ
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Content type tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`px-4 py-2 rounded-lg text-[13px] transition-all ${
                    selectedType === type.id
                      ? 'bg-white text-purple-700 font-semibold shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] transition-all ${
                  selectedCategory !== 'all'
                    ? 'border-purple-400 bg-purple-50 text-purple-700 font-semibold'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-white'
                }`}
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
                      className={`w-full px-4 py-2 text-left text-[13px] hover:bg-purple-50 transition-colors ${selectedCategory === cat.id ? 'text-purple-600 font-semibold bg-purple-50/50' : 'text-gray-700'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-200 focus-within:border-purple-400 focus-within:bg-white transition-all w-64">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ค้นหาไอเดีย, สินค้า, โรงงาน…"
                className="flex-1 bg-transparent text-[13px] outline-none text-gray-800 placeholder-gray-400"
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
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
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
            <p className="text-[14px] text-gray-500 font-medium">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            <p className="text-[12px] text-gray-400 mt-1">ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const style = contentTypeStyle[item.contentType];
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
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: style.bg, color: style.color }}>
                        {contentTypeLabel[item.contentType]}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={11} className="text-white" />
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <h3 className="text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug">{item.title}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{item.excerpt}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-purple-600 transition-colors font-semibold truncate max-w-[70%]"
                      >
                        {item.factoryName}
                        {factory?.verified && <BadgeCheck className="w-3 h-3 text-purple-500 shrink-0" />}
                      </button>
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Heart className="w-2.5 h-2.5" />{item.likes}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">MOQ <span className="font-semibold text-gray-600">{item.minOrder}</span></p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const style = contentTypeStyle[item.contentType];
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
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0" style={{ background: style.bg, color: style.color }}>
                              {contentTypeLabel[item.contentType]}
                            </span>
                            <span className="text-[10px] text-gray-400">{item.category}</span>
                          </div>
                          <h3 className="text-[13px] font-bold text-gray-900 truncate">{item.title}</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{item.excerpt}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-4 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{item.likes}</span>
                          <span>MOQ {item.minOrder}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/factories/${item.factoryId}`); }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-purple-600 transition-colors"
                        >
                          {item.factoryName}
                          {factory?.verified && <BadgeCheck className="w-3.5 h-3.5 text-purple-500" />}
                        </button>
                        <span className="text-gray-200">·</span>
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-500">
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