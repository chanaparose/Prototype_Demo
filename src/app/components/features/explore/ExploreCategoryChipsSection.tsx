import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Settings2 } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import {
  buildExploreCategoriesAllUrl,
  buildFactoryIdeasCategoryUrl,
  getCategoryChipColor,
  type ExploreCategoryItem,
} from '@/components/features/explore/exploreCategoryUtils';
import { ExploreCategoryBrowseSheet } from '@/components/features/explore/ExploreCategoryBrowseSheet';

type ExploreCategoryChipsSectionProps = {
  activeScope: HubScope;
  categories: ExploreCategoryItem[];
  isLoading?: boolean;
  className?: string;
};

/** Two-row horizontal category chips — scrolls sideways only. */
export function ExploreCategoryChipsSection({
  activeScope,
  categories,
  isLoading = false,
  className,
}: ExploreCategoryChipsSectionProps) {
  const navigate = useNavigate();
  const allHref = buildExploreCategoriesAllUrl(activeScope);
  const [browseOpen, setBrowseOpen] = useState(false);

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className={cn('space-y-2.5', className)}>
      <div className='flex items-center justify-between gap-2 px-4 md:px-0'>
        <div className='flex min-w-0 items-center gap-1.5'>
          <button
            type='button'
            onClick={() => setBrowseOpen(true)}
            className='text-[14px] font-bold text-brand-navy-ink transition-colors hover:text-brand-purple md:text-[15px]'
          >
            หมวดหมู่
          </button>
          <button
            type='button'
            onClick={() => setBrowseOpen(true)}
            aria-label='ดูหมวดย่อย'
            className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-purple'
          >
            <Settings2 size={14} strokeWidth={2.25} />
          </button>
        </div>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(allHref)}
          aria-label='ดูหมวดหมู่ทั้งหมด'
          className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-purple'
        >
          <ChevronRight size={18} strokeWidth={2.25} />
        </Button>
      </div>

      {isLoading ? (
        <div className='overflow-x-hidden px-4 md:px-0'>
          <div className='grid grid-flow-col grid-rows-2 gap-2'>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className='h-8 w-24 animate-pulse rounded-full bg-slate-200/80'
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className='overflow-x-auto px-4 scrollbar-hide md:px-0'
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className='grid w-max grid-flow-col grid-rows-2 gap-x-2 gap-y-2 pb-0.5'>
            {categories.map((cat) => (
              <button
                key={cat.categoryId}
                type='button'
                onClick={() => navigate(buildFactoryIdeasCategoryUrl(cat))}
                className='h-8 max-w-[11rem] truncate rounded-full px-3.5 text-[12px] font-semibold text-white shadow-sm transition-transform active:scale-[0.97] md:h-9 md:text-[13px]'
                style={{ backgroundColor: getCategoryChipColor(cat.categoryId) }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <ExploreCategoryBrowseSheet
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        activeScope={activeScope}
      />
    </section>
  );
}
