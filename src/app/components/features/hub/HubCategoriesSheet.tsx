import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AppDialog } from '@/components/ui/app-dialog';
import {
  HubBrowseContent,
  hubFactoryIdeasUrl,
} from '@/components/features/hub/HubBrowseContent';
import { buildFactoryIdeasSubCategoryUrl } from '@/components/features/explore/exploreCategoryUtils';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { useFactoryIdeasCategoriesQuery } from '@/domain/factory/queries/useFactoryIdeasQueries';
import type { ICategoryForHubResponse, IHubResponse } from '@/services/api/types/master.types';

type HubCategoriesSheetProps = {
  hub: IHubResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Bottom sheet: pick a category / sub-category under a hub, or view all. */
export function HubCategoriesSheet({ hub, open, onOpenChange }: HubCategoriesSheetProps) {
  const navigate = useNavigate();
  const categoriesQ = useFactoryIdeasCategoriesQuery();

  const subsByCategoryId = useMemo(() => {
    const map = new Map<number, { id: string; name: string }[]>();
    for (const row of categoriesQ.data ?? []) {
      map.set(
        Number(row.id),
        row.subCategories.map((s) => ({ id: s.id, name: s.name })),
      );
    }
    return map;
  }, [categoriesQ.data]);

  const isLoading = categoriesQ.isLoading;

  const closeAndGo = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const goAll = (target: IHubResponse) => {
    closeAndGo(hubFactoryIdeasUrl(target));
  };

  const goCategory = (target: IHubResponse, cat: ICategoryForHubResponse) => {
    closeAndGo(hubFactoryIdeasUrl(target, cat.category_id));
  };

  const goSub = (target: IHubResponse, categoryId: number, subCategoryId: string) => {
    const scope = (target.scope === 'MT' ? 'MT' : 'PD') as HubScope;
    closeAndGo(
      buildFactoryIdeasSubCategoryUrl({
        categoryId,
        subCategoryId: Number(subCategoryId),
        scope,
        hubId: target.hub_id,
      }),
    );
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={hub ? hub.name : 'หมวดหมู่'}
      variant='sheet'
      size='lg'
      className='max-h-[88vh] sm:max-h-[85vh]'
      bodyClassName='bg-white p-0 [-webkit-overflow-scrolling:touch]'
    >
      <div className='p-3 sm:p-4'>
        {isLoading ? (
          <div className='space-y-3'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='space-y-2'>
                <div className='h-16 animate-pulse rounded-2xl border border-slate-100 bg-slate-50' />
                <div className='flex gap-3 px-1.5'>
                  <div className='h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-slate-100' />
                  <div className='min-w-0 flex-1 space-y-2 py-1'>
                    <div className='h-3.5 w-32 animate-pulse rounded bg-slate-100' />
                    <div className='h-3 w-48 animate-pulse rounded bg-slate-50' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !hub ? (
          <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center'>
            <p className='text-sm font-medium text-slate-600'>ยังไม่มีหมวดในขอบเขตนี้</p>
          </div>
        ) : (
          <HubBrowseContent
            hub={hub}
            subsByCategoryId={subsByCategoryId}
            onGoAll={goAll}
            onGoCategory={goCategory}
            onGoSub={goSub}
          />
        )}
      </div>
    </AppDialog>
  );
}
