import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import type { IExploreCategory } from '@/domain/explore/types/explore.model';
import { exploreDisplayNameForTile } from '@/utils/exploreCategoriesFromApi';
import { EXPLORE_CATEGORY_TILES } from '@/components/features/explore/exploreCategoryTilesConfig';
import { Button } from '@/components/ui/button';

export type CategoryItem = IExploreCategory;

type ExploreCategoriesProps = {
  /** สำรองชื่อจาก bundle (เช่น mock-data) ถ้า API ยังไม่มี id นั้น */
  categories?: CategoryItem[];
  mergedFromApi: CategoryItem[];
  apiLoading: boolean;
  apiError: string | null;
  onRetryCategoriesApi: () => void;
  guestConnecting?: boolean;
};

export function ExploreCategories({
  categories: categoriesProp,
  mergedFromApi,
  apiLoading,
  apiError,
  onRetryCategoriesApi,
  guestConnecting = false,
}: Readonly<ExploreCategoriesProps>) {
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
    <div className='mb-3'>
      <div className='flex items-center justify-between px-4 mb-2'>
        <h3 className='text-gray-800 font-bold'>หมวดหมู่</h3>
        <Link
          to='/factory-ideas'
          className='text-brand-purple text-[13px] flex items-center gap-0.5 hover:underline'
        >
          ดูทั้งหมด <ChevronRight size={13} />
        </Link>
      </div>

      {apiLoading && (
        <p className='px-4 text-[11px] text-gray-400 mb-2' aria-live='polite'>
          กำลังโหลดชื่อหมวดจากฐานข้อมูล…
        </p>
      )}

      {!apiLoading && (guestConnecting || apiError) && (
        <div
          className='mx-4 mb-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 flex items-start gap-3 text-[13px] text-amber-900'
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
              <p className='mt-0.5 text-[11px] text-amber-800/90'>
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
              <p className='mt-1 text-[11px] text-amber-800/90'>
                ใช้ชื่อเริ่มต้นในโค้ดจนกว่าจะโหลดสำเร็จ
              </p>
            </div>
          )}
        </div>
      )}

      <div className='grid grid-cols-3 gap-2 px-3'>
        {tiles.map((row) => {
          const Icon = row.icon;
          return (
            <Link
              key={row.categoryId}
              to={`/factory-ideas?category_id=${encodeURIComponent(row.categoryId)}`}
              className='bg-white border border-gray-100 rounded-xl p-2 flex flex-col items-center justify-center gap-1.5 hover:shadow-md hover:border-brand-purple/40 transition-all cursor-pointer group'
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${row.color} group-hover:scale-110 transition-transform`}
              >
                <Icon size={18} />
              </div>
              <span className='text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-brand-navy-deep'>
                {row.displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
