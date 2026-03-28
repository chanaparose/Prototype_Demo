import React from 'react';
import { Link } from 'react-router';
import {
  Cat,
  Pill,
  Bone,
  Scissors,
  Package,
  Volleyball,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CategoryItem = {
  id: string;
  name: string;
  parentId?: string | null;
};

type IconConfig = { icon: LucideIcon; color: string };

const FIXED_CATEGORIES: { name: string; icon: LucideIcon; color: string }[] = [
  { name: 'ของเล่น', icon: Volleyball, color: 'bg-[#FF7A00]/10 text-[#FF7A00]' },
  { name: 'อาหารสัตว์เลี้ยง', icon: Cat, color: 'bg-[#A238FF]/10 text-[#A238FF]' },
  { name: 'ขนมสัตว์เลี้ยง', icon: Bone, color: 'bg-amber-50 text-amber-500' },
  { name: 'อาหารเสริม', icon: Pill, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'เสื้อผ้า', icon: Scissors, color: 'bg-pink-50 text-pink-600' },
  { name: 'แพ็คเกจจิ้ง', icon: Package, color: 'bg-purple-50 text-purple-600' },
];

type ExploreCategoriesProps = {
  categories: CategoryItem[];
};

export function ExploreCategories({ categories }: ExploreCategoriesProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-gray-800 font-bold">หมวดหมู่</h3>
        <Link
          to="/factory-ideas"
          className="text-[#A238FF] text-[13px] flex items-center gap-0.5 hover:underline"
        >
          ดูทั้งหมด <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4">
        {FIXED_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.name}
              to="/factory-ideas"
              className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-[#A238FF]/40 transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                <Icon size={22} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-[#2D1B4E]">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
