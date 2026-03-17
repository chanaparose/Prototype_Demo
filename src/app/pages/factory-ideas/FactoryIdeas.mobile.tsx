import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  SlidersHorizontal,
  BadgeCheck,
  Heart,
  Sparkles,
} from 'lucide-react';
import { categories, factories, factoryShowcases } from '../../data/mockData';
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

const contentTypeStyle: Record<
  Exclude<ContentType, 'all'>,
  { color: string; bg: string }
> = {
  product: { color: '#1D4ED8', bg: '#DBEAFE' },
  promotion: { color: '#B45309', bg: '#FEF3C7' },
  idea: { color: '#7C3AED', bg: '#EDE9FE' },
};

export function FactoryIdeasMobile() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryFilters = useMemo(
    () => [
      { id: 'all', name: 'ทุกหมวดหมู่' },
      ...categories.map((c) => ({ id: c.name, name: c.name })),
    ],
    [],
  );

  const visibleItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return factoryShowcases
      .filter((item) => {
        const byType = selectedType === 'all' || item.contentType === selectedType;
        const byCategory =
          selectedCategory === 'all' || item.category === selectedCategory;
        if (!q) return byType && byCategory;

        const haystack = [
          item.title,
          item.excerpt,
          item.factoryName,
          item.category,
          ...(item.tags ?? []),
        ]
          .join(' ')
          .toLowerCase();
        return byType && byCategory && haystack.includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );
  }, [searchText, selectedType, selectedCategory]);

  const getDetailPath = (type: string, id: string) => {
    if (type === 'product') return `/factory-ideas/products/${id}`;
    if (type === 'promotion') return `/factory-ideas/promotions/${id}`;
    return `/factory-ideas/ideas/${id}`;
  };

  return (
    <div className="px-4 pt-5 pb-6 space-y-4">
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
          Discover
        </p>
        <h1 className="text-gray-900" style={{ fontWeight: 700 }}>
          แนะนำโรงงาน
        </h1>
      </div>

      <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4" />
          <p className="text-xs opacity-90">พื้นที่โปรโมตจากโรงงานพาร์ทเนอร์</p>
        </div>
        <p className="text-sm" style={{ fontWeight: 700 }}>
          ค้นหาไอเดียสินค้าใหม่ พร้อมโรงงานที่ทำได้จริงในที่เดียว
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาไอเดีย สินค้า หรือชื่อโรงงาน..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <button className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
          <SlidersHorizontal size={18} style={{ color: '#6C47FF' }} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setSelectedType(type.id)}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm transition-all"
            style={{
              background: selectedType === type.id ? '#6C47FF' : '#FFFFFF',
              color: selectedType === type.id ? '#FFFFFF' : '#6B7280',
              border:
                selectedType === type.id ? 'none' : '1px solid #E5E7EB',
              fontWeight: selectedType === type.id ? 600 : 400,
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categoryFilters.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.id)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs transition-all"
            style={{
              background:
                selectedCategory === category.id ? '#EDE9FF' : '#F9FAFB',
              color: selectedCategory === category.id ? '#6C47FF' : '#6B7280',
              border:
                selectedCategory === category.id
                  ? '1px solid #D9CCFF'
                  : '1px solid #F3F4F6',
              fontWeight: selectedCategory === category.id ? 600 : 500,
            }}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-500">ผลลัพธ์ {visibleItems.length} รายการ</p>
      </div>

      <div className="pb-20">
        {visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500 shadow-sm">
            ไม่พบรายการที่ตรงกับเงื่อนไข ลองเปลี่ยนคีย์เวิร์ดหรือหมวดหมู่
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleItems.map((item) => {
              const factory = factories.find((f) => f.id === item.factoryId);
              const style = contentTypeStyle[item.contentType];
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => navigate(getDetailPath(item.contentType, item.id))}
                >
                  <div className="relative h-32">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px]"
                        style={{
                          background: style.bg,
                          color: style.color,
                          fontWeight: 700,
                        }}
                      >
                        {contentTypeLabel[item.contentType]}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px] text-white w-fit"
                        style={{ background: 'rgba(17, 24, 39, 0.72)' }}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5">
                    <h3
                      className="text-xs text-gray-900 line-clamp-2"
                      style={{ fontWeight: 700 }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                      {item.excerpt}
                    </p>

                    <div className="mt-2 flex items-center gap-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/factories/${item.factoryId}`);
                        }}
                        className="text-[10px] text-gray-700 truncate hover:text-purple-600"
                        style={{ fontWeight: 600 }}
                      >
                        {item.factoryName}
                      </button>
                      {factory?.verified && (
                        <BadgeCheck className="w-3 h-3 text-purple-600 shrink-0" />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                      <span>MOQ {item.minOrder}</span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5" />
                        {item.likes}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px]"
                        >
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

