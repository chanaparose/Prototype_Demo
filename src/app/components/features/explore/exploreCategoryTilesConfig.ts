import { Cat, Pill, Bone, Scissors, Package, Volleyball } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// หมวด 6 ช่องบน Explore — category_id + icon + สี; ชื่อจาก API ผ่าน exploreDisplayNameForTile
export const EXPLORE_CATEGORY_TILES: {
  categoryId: string;
  fallbackName: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    categoryId: '3',
    fallbackName: 'ของเล่น',
    icon: Volleyball,
    color: 'bg-brand-orange-hot/10 text-brand-orange-hot',
  },
  {
    categoryId: '1',
    fallbackName: 'อาหารสัตว์เลี้ยง',
    icon: Cat,
    color: 'bg-brand-purple/10 text-brand-purple',
  },
  {
    categoryId: '11',
    fallbackName: 'ขนมสัตว์เลี้ยง',
    icon: Bone,
    color: 'bg-amber-50 text-amber-500',
  },
  {
    categoryId: '2',
    fallbackName: 'อาหารเสริม',
    icon: Pill,
    color: 'bg-emerald-50 text-emerald-600',
  },
  { categoryId: '4', fallbackName: 'เสื้อผ้า', icon: Scissors, color: 'bg-pink-50 text-pink-600' },
  {
    categoryId: '6',
    fallbackName: 'แพ็คเกจจิ้ง',
    icon: Package,
    color: 'bg-purple-50 text-purple-600',
  },
];
