import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';

import { Button } from '../../ui/button';
import { exploreDisplayNameForTile } from '../../../utils/exploreCategoriesFromApi';
import { EXPLORE_CATEGORY_TILES } from './exploreCategoryTilesConfig';
import type { CategoryItem } from './ExploreCategories';

type ExploreDesktopCategoriesProps = {
  categories: CategoryItem[];
  mergedFromApi: CategoryItem[];
  apiLoading: boolean;
  apiError: string | null;
  onRetryCategoriesApi: () => void;
};

export function ExploreDesktopCategories({
  categories,
  mergedFromApi,
  apiLoading,
  apiError,
  onRetryCategoriesApi,
}: ExploreDesktopCategoriesProps) {
  const navigate = useNavigate();
  const tiles = useMemo(
    () =>
      EXPLORE_CATEGORY_TILES.map((cfg) => ({
        ...cfg,
        displayName: exploreDisplayNameForTile(
          cfg.categoryId,
          cfg.fallbackName,
          mergedFromApi,
          categories,
        ),
      })),
    [categories, mergedFromApi],
  );

  return (
    <section>
      {apiLoading && (
        <p className="text-sm text-gray-400 mb-3" aria-live="polite">
          กำลังโหลดชื่อหมวดจากฐานข้อมูล…
        </p>
      )}
      {apiError && !apiLoading && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900" role="alert">
          <span>{apiError}</span>
          <Button
            variant="unstyled"
            type="button"
            onClick={() => void onRetryCategoriesApi()}
            className="ml-2 font-semibold text-[#A238FF] underline hover:no-underline"
          >
            ลองอีกครั้ง
          </Button>
        </div>
      )}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
        {tiles.map((cfg) => {
          const Icon = cfg.icon;
          const href = `/factory-ideas?category_id=${encodeURIComponent(cfg.categoryId)}`;
          return (
            <div
              key={cfg.categoryId}
              role="button"
              tabIndex={0}
              onClick={() => navigate(href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(href);
                }
              }}
              className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-[#A238FF]/40 transition-all cursor-pointer group"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${cfg.color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center group-hover:text-[#2D1B4E]">{cfg.displayName}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center mt-4">
        <Button
          variant="unstyled"
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-8 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5"
        >
          ดูเพิ่มเติม <ChevronRight size={13} />
        </Button>
      </div>
    </section>
  );
}
