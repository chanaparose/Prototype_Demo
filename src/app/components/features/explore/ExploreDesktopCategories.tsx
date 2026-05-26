import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { exploreDisplayNameForTile } from '@/utils/exploreCategoriesFromApi';
import { EXPLORE_CATEGORY_TILES } from '@/components/features/explore/exploreCategoryTilesConfig';
import type { CategoryItem } from '@/components/features/explore/ExploreCategories';

type ExploreDesktopCategoriesProps = {
  categories: CategoryItem[];
  mergedFromApi: CategoryItem[];
  apiLoading: boolean;
  apiError: string | null;
  onRetryCategoriesApi: () => void;
  guestConnecting?: boolean;
};

export function ExploreDesktopCategories({
  categories,
  mergedFromApi,
  apiLoading,
  apiError,
  onRetryCategoriesApi,
  guestConnecting = false,
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
        <p className='text-sm text-gray-400 mb-3' aria-live='polite'>
          กำลังโหลดชื่อหมวดจากฐานข้อมูล…
        </p>
      )}
      {!apiLoading && (guestConnecting || apiError) && (
        <div
          className='mb-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 flex items-start gap-3 text-sm text-amber-900'
          role={guestConnecting ? 'status' : 'alert'}
          aria-live={guestConnecting ? 'polite' : undefined}
        >
          <span
            className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border-2 border-amber-500 border-t-transparent ${guestConnecting ? 'animate-spin' : 'opacity-0 pointer-events-none'}`}
            aria-hidden
          />
          {guestConnecting ? (
            <div>
              <p className='font-semibold text-amber-700'>Guest View กำลังเชื่อมต่อเซิร์ฟเวอร์</p>
              <p className='mt-0.5 text-xs text-amber-800/90'>
                รอสักครู่ก่อน คุณสามารถดูแท็บต่าง ๆ เช่น แนะนำโรงงานได้ทันทีเมื่อโหลดเสร็จ
              </p>
            </div>
          ) : (
            <div>
              <span>{apiError}</span>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => void onRetryCategoriesApi()}
                className='ml-2 font-semibold text-brand-purple underline hover:no-underline'
              >
                ลองอีกครั้ง
              </Button>
            </div>
          )}
        </div>
      )}
      <div className='grid grid-cols-3 md:grid-cols-6 gap-2.5'>
        {tiles.map((cfg) => {
          const Icon = cfg.icon;
          const href = `/factory-ideas?category_id=${encodeURIComponent(cfg.categoryId)}`;
          return (
            <div
              key={cfg.categoryId}
              role='button'
              tabIndex={0}
              onClick={() => navigate(href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(href);
                }
              }}
              className='bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-brand-purple/40 transition-all cursor-pointer group'
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center ${cfg.color} group-hover:scale-110 transition-transform`}
              >
                <Icon size={20} />
              </div>
              <span className='text-xs font-medium text-gray-700 text-center group-hover:text-brand-navy-deep'>
                {cfg.displayName}
              </span>
            </div>
          );
        })}
      </div>
      <div className='flex justify-center mt-4'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/factory-ideas')}
          className='bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-8 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5'
        >
          ดูเพิ่มเติม <ChevronRight size={13} />
        </Button>
      </div>
    </section>
  );
}
