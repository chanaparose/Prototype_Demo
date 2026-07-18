import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { AppDialog } from '@/components/ui/app-dialog';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { buildFactoryIdeasSubCategoryUrl } from '@/components/features/explore/exploreCategoryUtils';
import { useFactoryIdeasCategoriesQuery } from '@/domain/factory/queries/useFactoryIdeasQueries';

type ExploreCategoryBrowseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeScope: HubScope;
};

/** Category cards with sub-category tags — tap a tag to open /factory-ideas filtered by that sub. */
export function ExploreCategoryBrowseSheet({
  open,
  onOpenChange,
  activeScope,
}: ExploreCategoryBrowseSheetProps) {
  const navigate = useNavigate();
  const categoriesQ = useFactoryIdeasCategoriesQuery();

  const scopedCategories = useMemo(() => {
    const rows = categoriesQ.data ?? [];
    return rows
      .filter((c) => String(c.scope).toUpperCase() === activeScope)
      .filter((c) => c.subCategories.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [activeScope, categoriesQ.data]);

  const scopeLabel = activeScope === 'MT' ? 'วัตถุดิบ' : 'ผลิตสินค้า';

  const goToSub = (
    categoryId: string | number,
    subCategoryId: string | number,
    hubId?: number,
  ) => {
    onOpenChange(false);
    navigate(
      buildFactoryIdeasSubCategoryUrl({
        categoryId: Number(categoryId),
        subCategoryId: Number(subCategoryId),
        scope: activeScope,
        hubId,
      }),
    );
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`หมวดย่อย · ${scopeLabel}`}
      variant='sheet'
      size='lg'
      className='max-h-[88vh] sm:max-h-[85vh]'
      bodyClassName='space-y-3 bg-[var(--brand-page)]/40 p-3 sm:p-4'
    >
      {categoriesQ.isLoading ? (
        <div className='space-y-3'>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className='h-28 animate-pulse rounded-2xl border border-slate-100 bg-white'
            />
          ))}
        </div>
      ) : scopedCategories.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center'>
          <p className='text-sm font-medium text-slate-600'>ยังไม่มีหมวดย่อยในขอบเขตนี้</p>
        </div>
      ) : (
        scopedCategories.map((cat) => (
          <section
            key={cat.id}
            className='rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]'
          >
            <h4 className='mb-2.5 truncate text-[13px] font-bold text-brand-navy-ink'>
              {cat.name}
            </h4>

            <div className='flex flex-wrap gap-2'>
              {cat.subCategories.map((sub) => (
                <button
                  key={sub.id}
                  type='button'
                  onClick={() => goToSub(cat.id, sub.id, cat.hubId)}
                  className={cn(
                    'inline-flex max-w-full items-center rounded-full border border-slate-200',
                    'bg-slate-50/90 px-2.5 py-1.5 text-left text-[12px] font-medium text-slate-700',
                    'transition-all hover:border-brand-purple/40 hover:bg-brand-purple/8 hover:text-brand-violet-deep',
                    'active:scale-[0.98]',
                  )}
                >
                  <span className='truncate'>{sub.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </AppDialog>
  );
}
