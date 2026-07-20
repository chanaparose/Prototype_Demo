import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Layers } from 'lucide-react';
import { cn } from '@lib/utils';
import { AppDialog } from '@/components/ui/app-dialog';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { getPalette } from '@/components/features/hub/HubCategoryCard';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { buildFactoryIdeasSubCategoryUrl } from '@/components/features/explore/exploreCategoryUtils';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { useFactoryIdeasCategoriesQuery } from '@/domain/factory/queries/useFactoryIdeasQueries';
import type { ICategoryForHubResponse, IHubResponse } from '@/services/api/types/master.types';

type ExploreCategoryBrowseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeScope: HubScope;
  initialHubId?: number;
};

function catImg(cat: ICategoryForHubResponse): string {
  return String(cat.img || cat.image_url || cat.image || '').trim();
}

function catDescription(cat: ICategoryForHubResponse): string {
  const preview = (cat.sub_preview ?? []).filter(Boolean).join(' · ');
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

function HubTabButton({
  label,
  active,
  onClick,
  tabRef,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tabRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={tabRef}
      type='button'
      role='tab'
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'relative shrink-0 pb-2.5 pt-1 text-[13px] transition-colors',
        active
          ? 'font-bold text-brand-navy-ink'
          : 'font-medium text-slate-400 hover:text-slate-600',
      )}
    >
      <span className='max-w-[9rem] truncate'>{label}</span>
      {active ? (
        <span
          className='absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-brand-purple'
          aria-hidden
        />
      ) : null}
    </button>
  );
}

type HubBrowseContentProps = {
  hub: IHubResponse;
  subsByCategoryId: Map<number, { id: string; name: string }[]>;
  onGoAll: (hub: IHubResponse) => void;
  onGoCategory: (hub: IHubResponse, cat: ICategoryForHubResponse) => void;
  onGoSub: (hub: IHubResponse, categoryId: number, subCategoryId: string) => void;
};

function HubBrowseContent({
  hub,
  subsByCategoryId,
  onGoAll,
  onGoCategory,
  onGoSub,
}: HubBrowseContentProps) {
  const categories = hub.categories ?? [];

  return (
    <div className='space-y-1'>
      <Button
        type='button'
        variant='outline'
        onClick={() => onGoAll(hub)}
        className='h-auto w-full justify-start gap-3 rounded-2xl border-brand-purple/20 bg-brand-lavender-chip/40 px-3 py-3 text-left hover:bg-brand-lavender-chip/70'
      >
        <span className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-purple/15 bg-white text-brand-purple shadow-sm'>
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
        <p className='px-1.5 py-3 text-xs text-slate-400'>ยังไม่มีหมวดในกลุ่มนี้</p>
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
                  onClick={() => onGoCategory(hub, cat)}
                  className='group flex w-full items-center gap-3.5 rounded-2xl px-1.5 py-2.5 text-left transition-colors hover:bg-brand-lavender-chip/50 active:bg-brand-lavender-chip/80'
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
                  <span
                    className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-lavender-chip text-brand-purple transition-transform group-active:translate-x-0.5'
                    aria-hidden='true'
                  >
                    <ChevronRight size={17} strokeWidth={2.25} />
                  </span>
                </button>

                {subs.length > 0 ? (
                  <div className='flex flex-wrap gap-2 px-1.5 pb-2.5 pl-[4.25rem]'>
                    {subs.map((sub) => (
                      <button
                        key={sub.id}
                        type='button'
                        onClick={() => onGoSub(hub, cat.category_id, sub.id)}
                        className={cn(
                          'inline-flex max-w-full items-center rounded-full border border-slate-200',
                          'bg-white px-2.5 py-1.5 text-left text-[12px] font-medium text-slate-700',
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
  );
}

/** Browse sheet — scrollable hub tabs + category rows and sub-category chips. */
export function ExploreCategoryBrowseSheet({
  open,
  onOpenChange,
  activeScope,
  initialHubId,
}: ExploreCategoryBrowseSheetProps) {
  const navigate = useNavigate();
  const hubsQ = useLbiHubsQuery();
  const categoriesQ = useFactoryIdeasCategoriesQuery();
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const hubs = useMemo(
    () => (hubsQ.data ?? []).filter((hub) => hub.scope === activeScope),
    [activeScope, hubsQ.data],
  );

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

  const selectedHub = useMemo(
    () => hubs.find((hub) => hub.hub_id === selectedHubId) ?? hubs[0] ?? null,
    [hubs, selectedHubId],
  );

  const isLoading = hubsQ.isLoading || categoriesQ.isLoading;
  const showHubTabs = hubs.length > 1;

  useEffect(() => {
    if (!open) return;
    if (hubs.length === 0) {
      setSelectedHubId(null);
      return;
    }
    setSelectedHubId((prev) => {
      if (initialHubId != null && hubs.some((hub) => hub.hub_id === initialHubId)) {
        return initialHubId;
      }
      if (prev != null && hubs.some((hub) => hub.hub_id === prev)) return prev;
      return hubs[0]!.hub_id;
    });
  }, [open, activeScope, hubs, initialHubId]);

  useEffect(() => {
    if (!open || selectedHubId == null) return;
    const el = tabRefs.current.get(String(selectedHubId));
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [open, selectedHubId]);

  const closeAndGo = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const goAll = (hub: IHubResponse) => {
    closeAndGo(hubFactoryIdeasUrl(hub));
  };

  const goCategory = (hub: IHubResponse, cat: ICategoryForHubResponse) => {
    closeAndGo(hubFactoryIdeasUrl(hub, cat.category_id));
  };

  const goSub = (hub: IHubResponse, categoryId: number, subCategoryId: string) => {
    const scope = (hub.scope === 'MT' ? 'MT' : 'PD') as HubScope;
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
      title={selectedHub?.name ?? 'หมวดหมู่'}
      variant='sheet'
      size='lg'
      className='max-h-[88vh] sm:max-h-[85vh]'
      bodyClassName='bg-white p-0 [-webkit-overflow-scrolling:touch]'
    >
      {showHubTabs ? (
        <div className='sticky top-0 z-10 border-b border-slate-200/80 bg-white px-3 pt-0 sm:px-4'>
          <div
            role='tablist'
            aria-label='เลือกกลุ่มหมวดหมู่'
            className='overflow-x-auto scrollbar-hide'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className='flex items-end gap-4 pr-2'>
              {hubs.map((hub) => {
                const active = selectedHub?.hub_id === hub.hub_id;
                const key = String(hub.hub_id);
                return (
                  <HubTabButton
                    key={hub.hub_id}
                    label={hub.name}
                    active={active}
                    onClick={() => setSelectedHubId(hub.hub_id)}
                    tabRef={(el) => {
                      if (el) tabRefs.current.set(key, el);
                      else tabRefs.current.delete(key);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

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
        ) : !selectedHub ? (
          <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center'>
            <p className='text-sm font-medium text-slate-600'>ยังไม่มีหมวดในขอบเขตนี้</p>
          </div>
        ) : (
          <HubBrowseContent
            hub={selectedHub}
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
