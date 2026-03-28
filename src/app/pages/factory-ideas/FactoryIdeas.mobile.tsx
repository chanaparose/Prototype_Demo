import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, BadgeCheck, Heart, Sparkles, X } from 'lucide-react';
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

export function FactoryIdeasMobile() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const data = useData();

  const categoryFilters = useMemo(
    () => [{ id: 'all', name: 'ทุกหมวดหมู่' }, ...data.categories.map((c) => ({ id: c.name, name: c.name }))],
    [data.categories],
  );

  const visibleItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return data.factoryShowcases
      .filter((item) => {
        const byType     = selectedType === 'all' || item.contentType === selectedType;
        const byCategory = selectedCategory === 'all' || item.category === selectedCategory;
        if (!q) return byType && byCategory;
        const haystack = [item.title, item.excerpt, item.factoryName, item.category, ...(item.tags ?? [])]
          .join(' ').toLowerCase();
        return byType && byCategory && haystack.includes(q);
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [searchText, selectedType, selectedCategory]);

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

        {/* Category */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {categoryFilters.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0 px-3.5 py-1 rounded-full text-[11px] transition-all"
              style={{
                background: selectedCategory === cat.id ? COLORS.blue : 'rgba(46,34,82,0.05)',
                color:      selectedCategory === cat.id ? COLORS.white : COLORS.blue,
                border:     selectedCategory === cat.id ? `1px solid ${COLORS.blue}` : '1px solid rgba(46,34,82,0.12)',
                fontWeight: selectedCategory === cat.id ? 600 : 400,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <p className="text-[11px] pt-0.5" style={{ color: COLORS.blue }}>
          พบ <span className="font-semibold">{visibleItems.length}</span> รายการ
        </p>
      </div>

      {/* ── Content grid ── */}
      <div className="px-4 pt-4">
        {visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium" style={{ color: COLORS.blue }}>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>
        ) : (
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
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5" />
                          {item.likes}
                        </span>
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
        )}
      </div>
    </div>
  );
}
