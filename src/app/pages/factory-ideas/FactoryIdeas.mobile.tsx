import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, BadgeCheck, Heart, Sparkles, X } from 'lucide-react';
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
  product:   { color: '#1D4ED8', bg: '#DBEAFE' },
  promotion: { color: '#B45309', bg: '#FEF3C7' },
  idea:      { color: '#7C3AED', bg: '#EDE9FE' },
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
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* ── Header ── */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="mb-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Discover</p>
          <h1 className="text-xl font-bold text-gray-900">แนะนำโรงงาน</h1>
        </div>

        {/* Hero banner */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'linear-gradient(135deg, #3B1FA8, #6C47FF)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <p className="text-[11px] text-violet-300 font-medium">พื้นที่โปรโมตจากโรงงานพาร์ทเนอร์</p>
          </div>
          <p className="text-[13px] font-bold text-white leading-snug">
            ค้นหาไอเดียสินค้าใหม่ พร้อมโรงงานที่ทำได้จริงในที่เดียว
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-violet-400 focus-within:bg-white transition-all">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาไอเดีย สินค้า หรือชื่อโรงงาน…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
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
                background: selectedType === type.id ? '#6C47FF' : '#F3F4F6',
                color:      selectedType === type.id ? '#FFFFFF' : '#6B7280',
                fontWeight: selectedType === type.id ? 600 : 400,
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
                background: selectedCategory === cat.id ? '#EDE9FE' : '#F9FAFB',
                color:      selectedCategory === cat.id ? '#6C47FF' : '#6B7280',
                border:     selectedCategory === cat.id ? '1px solid #C4B5FD' : '1px solid #F3F4F6',
                fontWeight: selectedCategory === cat.id ? 600 : 400,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 pt-0.5">
          พบ <span className="font-semibold text-gray-600">{visibleItems.length}</span> รายการ
        </p>
      </div>

      {/* ── Content grid ── */}
      <div className="px-4 pt-4">
        {visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium text-gray-500">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleItems.map((item) => {
              const factory = data.factories.find((f) => f.id === item.factoryId);
              const style = contentTypeStyle[item.contentType];
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
                        className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {contentTypeLabel[item.contentType]}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-2.5 space-y-1.5">
                    <h3 className="text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug">
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
                        className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 hover:text-violet-600 transition-colors truncate w-full"
                      >
                        <span className="truncate">{item.factoryName}</span>
                        {factory?.verified && <BadgeCheck className="w-3 h-3 text-violet-500 shrink-0" />}
                      </button>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                        <span>MOQ <span className="font-medium text-gray-500">{item.minOrder}</span></span>
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5" />
                          {item.likes}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px]">
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