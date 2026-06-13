import { useMemo } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { exploreDisplayNameForTile } from '@/utils/exploreCategoriesFromApi';
import { getExploreCategoryTiles } from '@/components/features/explore/exploreCategoryTilesConfig';
import { CategoryMarqueeStrip } from '@/components/features/explore/CategoryMarqueeStrip';
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
  const tiles = useMemo(
    () =>
      getExploreCategoryTiles().map((cfg) => ({
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
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-[14px] font-bold text-brand-navy-ink'>หมวดหมู่</h2>
        <Link
          to='/factory-ideas'
          className='flex items-center gap-0.5 text-[13px] text-brand-purple hover:underline'
        >
          ดูทั้งหมด <ChevronRight size={13} />
        </Link>
      </div>

      {apiLoading && (
        <p className='mb-3 text-sm text-gray-400' aria-live='polite'>
          กำลังโหลดชื่อหมวดจากฐานข้อมูล…
        </p>
      )}
      {!apiLoading && (guestConnecting || apiError) && (
        <div
          className='mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900'
          role={guestConnecting ? 'status' : 'alert'}
          aria-live={guestConnecting ? 'polite' : undefined}
        >
          <span
            className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border-2 border-amber-500 border-t-transparent ${guestConnecting ? 'animate-spin' : 'pointer-events-none opacity-0'}`}
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

      <CategoryMarqueeStrip tiles={tiles} />
    </section>
  );
}
