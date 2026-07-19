import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Layers } from 'lucide-react';
import { cn } from '@lib/utils';
import { AppDialog } from '@/components/ui/app-dialog';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { getPalette } from '@/components/features/hub/HubCategoryCard';
import {
  buildFactoryIdeasSubCategoryUrl,
} from '@/components/features/explore/exploreCategoryUtils';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { useFactoryIdeasCategoriesQuery } from '@/domain/factory/queries/useFactoryIdeasQueries';
import type { ICategoryForHubResponse, IHubResponse } from '@/services/api/types/master.types';

type HubCategoriesSheetProps = {
  hub: IHubResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function catImg(cat: ICategoryForHubResponse): string {
  return String(cat.img || cat.image_url || cat.image || '').trim();
}

function catDescription(cat: ICategoryForHubResponse): string {
  const preview = (cat.sub_preview ?? []).filter(Boolean).slice(0, 3).join(' · ');
  if (preview) return preview;
  if (cat.factory_count > 0) {
    return `${cat.factory_count.toLocaleString('th-TH')} โรงงานในหมวดนี้`;
  }
  return 'ดูไอเดียในหมวดนี้';
}

function hubFactoryIdeasUrl(hub: IHubResponse, categoryId?: number): string {
  const scope = (hub.scope === 'MT' ? 'MT' : 'PD') as HubScope;
  const params = new URLSearchParams({
    hub_id: String(hub.hub_id),
    hub_scope: scope,
    type: scope === 'MT' ? 'material' : 'product',
  });
  if (categoryId != null) params.set('category_id', String(categoryId));
  return `/factory-ideas?${params.toString()}`;
}

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

  const categories = hub?.categories ?? [];
  const scope = (hub?.scope === 'MT' ? 'MT' : 'PD') as HubScope;

  const closeAndGo = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const goAll = () => {
    if (!hub) return;
    closeAndGo(hubFactoryIdeasUrl(hub));
  };

  const goCategory = (cat: ICategoryForHubResponse) => {
    if (!hub) return;
    closeAndGo(hubFactoryIdeasUrl(hub, cat.category_id));
  };

  const goSub = (categoryId: number, subCategoryId: string) => {
    if (!hub) return;
    closeAndGo(
      buildFactoryIdeasSubCategoryUrl({
        categoryId,
        subCategoryId: Number(subCategoryId),
        scope,
        hubId: hub.hub_id,
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
      className='max-h-[calc(100dvh-5rem)] sm:max-h-[85vh]'
      bodyClassName='bg-white p-3 sm:p-4 [-webkit-overflow-scrolling:touch]'
    >
      {!hub ? null : (
        <div className='space-y-3'>
          <Button
            type='button'
            variant='outline'
            onClick={goAll}
            className='h-auto w-full justify-start gap-3 rounded-2xl border-brand-purple/20 bg-brand-lavender-chip/40 px-3 py-3 text-left hover:bg-brand-lavender-chip/70'
          >
            <span className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-purple/15 bg-white text-brand-purple'>
              <Layers size={22} strokeWidth={2} />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block text-[14px] font-bold leading-tight text-brand-navy-ink'>
                ดูทั้งหมด
              </span>
              <span className='mt-1 block text-[12px] leading-tight text-slate-400'>
                ไอเดียทุกหมวดใน {hub.name}
              </span>
            </span>
          </Button>

          {categories.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center'>
              <p className='text-sm font-medium text-slate-600'>ยังไม่มีหมวดในกลุ่มนี้</p>
            </div>
          ) : (
            <ul className='space-y-1'>
              {categories.map((cat) => {
                const palette = getPalette(cat.category_id);
                const img = catImg(cat);
                const subs = subsByCategoryId.get(cat.category_id) ?? [];

                return (
                  <li key={cat.category_id} className='rounded-2xl'>
                    <button
                      type='button'
                      onClick={() => goCategory(cat)}
                      className='flex w-full items-center gap-3.5 rounded-2xl px-1.5 py-2.5 text-left transition-colors hover:bg-brand-lavender-chip/50 active:bg-brand-lavender-chip/80'
                    >
                      <div
                        className={cn(
                          'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100',
                          img ? 'bg-white' : palette.bg,
                        )}
                      >
                        {img ? (
                          <ImageWithFallback
                            src={img}
                            alt={cat.name}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <span className={cn('text-lg font-bold opacity-50', palette.text)}>
                            {cat.name.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-[14px] font-bold leading-tight text-brand-navy-ink'>
                          {cat.name}
                        </p>
                        <p className='mt-1 line-clamp-1 text-[12px] leading-tight text-slate-400'>
                          {catDescription(cat)}
                        </p>
                      </div>
                    </button>

                    {subs.length > 0 ? (
                      <div className='flex flex-wrap gap-2 px-1.5 pb-2.5 pl-[4.25rem]'>
                        {subs.map((sub) => (
                          <button
                            key={sub.id}
                            type='button'
                            onClick={() => goSub(cat.category_id, sub.id)}
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
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </AppDialog>
  );
}
