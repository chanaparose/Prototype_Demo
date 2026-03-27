import React, { useState } from 'react';
import {
  Cat,
  Pill,
  Bone,
  Scissors,
  Package,
  Volleyball,
  ShowerHead,
  Wrench,
  Tag,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CategoryItem = {
  id: string;
  name: string;
  parentId?: string | null;
};

type IconConfig = { icon: LucideIcon; color: string };

/* ── Mapping จาก lbi_product_categories DB ─────────────────────
   id | parent | name                 → icon         color
    1 | NULL   | ของเล่น              → CircleDot    orange
    2 | NULL   | อาหารสัตว์เลี้ยง     → Cat          purple
    3 | NULL   | ขนมสัตว์เลี้ยง       → Bone         amber
    4 | NULL   | อาหารเสริม           → Pill         emerald
    5 | NULL   | เสื้อผ้า             → Scissors     pink
    6 | NULL   | แพ็คเกจจิ้ง          → Package      purple-light
    7 | NULL   | ผลิตภัณฑ์ดูแลต่างๆ  → ShowerHead   sky
    8 | NULL   | อุปกรณ์ของใช้        → Wrench       gray-blue
   (9 | 1      | ของเล่นแมว — subcategory, ไม่แสดง)
──────────────────────────────────────────────────────────────── */
const ID_MAP: Record<string, IconConfig> = {
  '1': { icon: Volleyball, color: 'bg-[#FF7A00]/10 text-[#FF7A00]' },
  '2': { icon: Cat,        color: 'bg-[#A238FF]/10 text-[#A238FF]' },
  '3': { icon: Bone,       color: 'bg-amber-50 text-amber-500' },
  '4': { icon: Pill,       color: 'bg-emerald-50 text-emerald-600' },
  '5': { icon: Scissors,   color: 'bg-pink-50 text-pink-600' },
  '6': { icon: Package,    color: 'bg-purple-50 text-purple-600' },
  '7': { icon: ShowerHead, color: 'bg-sky-50 text-sky-500' },
  '8': { icon: Wrench,     color: 'bg-slate-50 text-slate-500' },
};

function resolveIcon(id: string, name: string): IconConfig {
  if (ID_MAP[id]) return ID_MAP[id];
  const n = name.toLowerCase();
  if (n.includes('อาหาร') && !n.includes('เสริม')) return ID_MAP['2'];
  if (n.includes('เสริม'))   return ID_MAP['4'];
  if (n.includes('ของเล่น') || n.includes('ลูกบอล')) return ID_MAP['1'];
  if (n.includes('ขนม'))     return ID_MAP['3'];
  if (n.includes('เสื้อ') || n.includes('ผ้า')) return ID_MAP['5'];
  if (n.includes('แพ็ค') || n.includes('บรรจุ')) return ID_MAP['6'];
  if (n.includes('ดูแล') || n.includes('อาบ'))   return ID_MAP['7'];
  if (n.includes('อุปกรณ์')) return ID_MAP['8'];
  return { icon: Tag, color: 'bg-gray-50 text-gray-500' };
}

const MAX_VISIBLE = 6;

type ExploreCategoriesProps = {
  categories: CategoryItem[];
};

export function ExploreCategories({ categories }: ExploreCategoriesProps) {
  const [showAll, setShowAll] = useState(false);

  // แสดงเฉพาะหมวดหมู่หลัก (parentId = null หรือ undefined)
  const topLevel = categories.filter((c) => !c.parentId);
  const visible = showAll ? topLevel : topLevel.slice(0, MAX_VISIBLE);
  const hasMore = topLevel.length > MAX_VISIBLE;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-gray-800 font-bold">หมวดหมู่</h3>
        {hasMore && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-[#A238FF] text-[13px] flex items-center gap-0.5 hover:underline"
          >
            ดูทั้งหมด <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 px-4">
        {visible.map((cat) => {
          const { icon: Icon, color } = resolveIcon(cat.id, cat.name);
          return (
            <div
              key={cat.id}
              className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-[#A238FF]/40 transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={22} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-[#2D1B4E]">
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>

      {hasMore && showAll && (
        <div className="flex justify-center mt-3 px-4">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-6 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            ย่อลง
          </button>
        </div>
      )}
    </div>
  );
}
