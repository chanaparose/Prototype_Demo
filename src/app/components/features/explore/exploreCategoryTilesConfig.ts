import { Cat, Pill, Bone, Scissors, Package, Volleyball } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** หมวดที่แสดงบน Explore — category_id 1–6 เท่านั้น */
export const EXPLORE_VISIBLE_CATEGORY_IDS = ['1', '2', '3', '4', '5', '6'] as const;

/** หมวด 6 ช่องบน Explore — category_id + icon + สี; ชื่อจาก API ผ่าน exploreDisplayNameForTile */
export const EXPLORE_CATEGORY_TILES: {
  categoryId: string;
  fallbackName: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    categoryId: '1',
    fallbackName: 'อาหารสัตว์เลี้ยง',
    icon: Cat,
    color: 'bg-brand-purple/10 text-brand-purple',
  },
  {
    categoryId: '2',
    fallbackName: 'อาหารเสริม',
    icon: Pill,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    categoryId: '3',
    fallbackName: 'ของเล่น',
    icon: Volleyball,
    color: 'bg-brand-orange-hot/10 text-brand-orange-hot',
  },
  {
    categoryId: '4',
    fallbackName: 'เสื้อผ้า',
    icon: Scissors,
    color: 'bg-pink-50 text-pink-600',
  },
  {
    categoryId: '5',
    fallbackName: 'อุปกรณ์สัตว์เลี้ยง',
    icon: Bone,
    color: 'bg-amber-50 text-amber-500',
  },
  {
    categoryId: '6',
    fallbackName: 'แพ็คเกจจิ้ง',
    icon: Package,
    color: 'bg-purple-50 text-purple-600',
  },
];

export function getExploreCategoryTiles() {
  return EXPLORE_CATEGORY_TILES.filter((tile) =>
    (EXPLORE_VISIBLE_CATEGORY_IDS as readonly string[]).includes(tile.categoryId),
  ).sort((a, b) => Number(a.categoryId) - Number(b.categoryId));
}
