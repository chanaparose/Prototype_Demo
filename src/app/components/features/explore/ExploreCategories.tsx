import React from 'react';

export type CategoryItem = {
  id: string;
  name: string;
  icon: string;
};

type ExploreCategoriesProps = {
  categories: CategoryItem[];
};

export function ExploreCategories({ categories }: ExploreCategoriesProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-gray-800" style={{ fontWeight: 700 }}>
          หมวดหมู่
        </h3>
        <button type="button" className="text-[#A020C8]" style={{ fontSize: 13 }}>
          ดูทั้งหมด
        </button>
      </div>
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#A020C8]/10 border border-[#A020C8]/10 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl leading-none">{cat.icon}</span>
            </div>
            <span className="text-gray-600 whitespace-nowrap" style={{ fontSize: 11 }}>
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
