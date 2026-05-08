import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import type { ExploreCategoryItem } from '../../../utils/exploreCategoriesFromApi';
import { exploreDisplayNameForTile } from '../../../utils/exploreCategoriesFromApi';
import { EXPLORE_CATEGORY_TILES } from './exploreCategoryTilesConfig';

export type CategoryItem = ExploreCategoryItem;

type ExploreCategoriesProps = {
  /** สำรองชื่อจาก bundle (เช่น mock-data) ถ้า API ยังไม่มี id นั้น */
  categories?: CategoryItem[];
  /** จาก GET /categories เท่านั้น (โหลดที่ useExploreData → useExploreCategoriesFromApi) */
  mergedFromApi: CategoryItem[];
  apiLoading: boolean;
  apiError: string | null;
  onRetryCategoriesApi: () => void;
};

export function ExploreCategories({
  categories: categoriesProp,
  mergedFromApi,
  apiLoading,
  apiError,
  onRetryCategoriesApi,
}: ExploreCategoriesProps) {
  const tiles = useMemo(
    () =>
      EXPLORE_CATEGORY_TILES.map((cfg) => ({
        ...cfg,
        displayName: exploreDisplayNameForTile(
          cfg.categoryId,
          cfg.fallbackName,
          mergedFromApi,
          categoriesProp,
        ),
      })),
    [mergedFromApi, categoriesProp],
  );

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-4 mb-2">
        <h3 className="text-gray-800 font-bold">หมวดหมู่</h3>
        <Link
          to="/factory-ideas"
          className="text-[#A238FF] text-[13px] flex items-center gap-0.5 hover:underline"
        >
          ดูทั้งหมด <ChevronRight size={13} />
        </Link>
      </div>

      {apiLoading && (
        <p className="px-4 text-[11px] text-gray-400 mb-2" aria-live="polite">
          กำลังโหลดชื่อหมวดจากฐานข้อมูล…
        </p>
      )}

      {apiError && !apiLoading && (
        <div className="mx-4 mb-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[13px] text-amber-900" role="alert">
          <span>{apiError}</span>
          <button
            type="button"
            onClick={() => void onRetryCategoriesApi()}
            className="ml-2 font-semibold text-[#A238FF] underline hover:no-underline"
          >
            ลองอีกครั้ง
          </button>
          <p className="mt-1 text-[11px] text-amber-800/90">ใช้ชื่อเริ่มต้นในโค้ดจนกว่าจะโหลดสำเร็จ</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 px-3">
        {tiles.map((row) => {
          const Icon = row.icon;
          return (
            <Link
              key={row.categoryId}
              to={`/factory-ideas?category_id=${encodeURIComponent(row.categoryId)}`}
              className="bg-white border border-gray-100 rounded-xl p-2 flex flex-col items-center justify-center gap-1.5 hover:shadow-md hover:border-[#A238FF]/40 transition-all cursor-pointer group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${row.color} group-hover:scale-110 transition-transform`}
              >
                <Icon size={18} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-[#2D1B4E]">
                {row.displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
