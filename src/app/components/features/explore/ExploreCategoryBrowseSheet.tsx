import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Search, Store, X } from 'lucide-react';
import { cn } from '@lib/utils';
import { AppDialog } from '@/components/ui/app-dialog';
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

function factoryCountLabel(count: number): string {
  if (count > 0) return `${count.toLocaleString('th-TH')} โรงงาน`;
  return 'ดูไอเดียในหมวดนี้';
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('th-TH');
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
  categoriesOverride?: ICategoryForHubResponse[];
  onGoAll: (hub: IHubResponse) => void;
  onGoCategory: (hub: IHubResponse, cat: ICategoryForHubResponse) => void;
  onGoSub: (hub: IHubResponse, categoryId: number, subCategoryId: string) => void;
};

function HubBrowseContent({
  hub,
  subsByCategoryId,
  categoriesOverride,
  onGoAll,
  onGoCategory,
  onGoSub,
}: HubBrowseContentProps) {
  const categories = categoriesOverride ?? hub.categories ?? [];

  return (
    <div className='space-y-0'>
      <button
        type='button'
        onClick={() => onGoAll(hub)}
        className='mb-1 flex w-full items-center gap-3 rounded-2xl bg-brand-lavender-chip/55 px-3 py-3.5 text-left transition-colors hover:bg-brand-lavender-chip/80 active:bg-brand-lavender-chip'
      >
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white shadow-sm'>
          <Store size={20} strokeWidth={2} />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block text-[14px] font-bold leading-snug text-brand-navy-ink'>
            ดูทั้งหมดใน{hub.name}
          </span>
          <span className='mt-0.5 block text-[12px] leading-snug text-brand-purple/75'>
            ยังไม่ต้องเลือกหมวดย่อยก็เริ่มค้นหาได้
          </span>
        </span>
        <span
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white'
          aria-hidden='true'
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </span>
      </button>

      {categories.length === 0 ? (
        <p className='px-1.5 py-3 text-xs text-slate-400'>ยังไม่มีหมวดในกลุ่มนี้</p>
      ) : (
        <ul>
          {categories.map((cat) => {
            const palette = getPalette(cat.category_id);
            const img = catImg(cat);
            const subs = subsByCategoryId.get(cat.category_id) ?? [];

            return (
              <li
                key={cat.category_id}
                className='border-b border-slate-100 py-3 last:border-b-0'
              >
                <button
                  type='button'
                  onClick={() => onGoCategory(hub, cat)}
                  className='flex w-full items-start gap-3 text-left'
                >
                  <div
                    className={cn(
                      'flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100',
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
                  <div className='flex min-w-0 flex-1 items-start gap-1 pt-0.5'>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-[14px] font-bold leading-snug text-brand-navy-ink'>
                        {cat.name}
                      </p>
                      <p className='mt-0.5 text-[12px] font-medium text-brand-purple'>
                        {factoryCountLabel(cat.factory_count ?? 0)}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      strokeWidth={2}
                      className='mt-0.5 shrink-0 text-slate-300'
                      aria-hidden='true'
                    />
                  </div>
                </button>

                {subs.length > 0 ? (
                  <div
                    className='mt-2.5 overflow-x-auto pl-[64px] pr-0.5 scrollbar-hide'
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <div className='flex w-max gap-2 pb-0.5'>
                      {subs.map((sub) => (
                        <button
                          key={sub.id}
                          type='button'
                          onClick={() => onGoSub(hub, cat.category_id, sub.id)}
                          className={cn(
                            'inline-flex shrink-0 items-center rounded-full',
                            // เปลี่ยนสีพื้นหลังเป็นเทาอ่อน และตัวหนังสือเทาเข้ม
                            'bg-gray-100 px-3 py-1.5 text-[12px] font-medium text-gray-700', 
                            // เปลี่ยนสีตอน Hover ให้เข้มขึ้นนิดหน่อย
                            'transition-all hover:bg-gray-200 active:scale-[0.98]',
                          )}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
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
  const [searchTerm, setSearchTerm] = useState('');
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
  const normalizedSearch = normalizeSearch(searchTerm);

  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];

    return hubs
      .map((hub) => {
        const hubMatched = normalizeSearch(hub.name).includes(normalizedSearch);
        const filteredSubsByCategoryId = new Map<number, { id: string; name: string }[]>();
        const filteredCategories = (hub.categories ?? []).filter((cat) => {
          const catMatched = normalizeSearch(cat.name).includes(normalizedSearch);
          const allSubs = subsByCategoryId.get(cat.category_id) ?? [];
          const matchedSubs = allSubs.filter((sub) =>
            normalizeSearch(sub.name).includes(normalizedSearch),
          );

          if (hubMatched || catMatched) {
            filteredSubsByCategoryId.set(cat.category_id, allSubs);
            return true;
          }

          if (matchedSubs.length > 0) {
            filteredSubsByCategoryId.set(cat.category_id, matchedSubs);
            return true;
          }

          return false;
        });

        if (!hubMatched && filteredCategories.length === 0) return null;

        return {
          hub,
          categories: hubMatched && filteredCategories.length === 0 ? hub.categories ?? [] : filteredCategories,
          subsByCategoryId: hubMatched ? subsByCategoryId : filteredSubsByCategoryId,
        };
      })
      .filter((row): row is {
        hub: IHubResponse;
        categories: ICategoryForHubResponse[];
        subsByCategoryId: Map<number, { id: string; name: string }[]>;
      } => row != null);
  }, [hubs, normalizedSearch, subsByCategoryId]);

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

      <div className='sticky top-0 z-10 border-b border-slate-100 bg-white px-3 py-2.5 sm:px-4'>
        <div className='flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 shadow-sm shadow-slate-900/[0.03] focus-within:border-brand-purple/45 focus-within:bg-white'>
          <Search size={17} className='shrink-0 text-slate-400' aria-hidden='true' />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='ค้นหา hub, หมวดหมู่ หรือหมวดย่อย...'
            className='min-w-0 flex-1 bg-transparent text-[13px] font-medium text-brand-navy-ink outline-none placeholder:text-slate-400'
            type='search'
          />
          {searchTerm ? (
            <button
              type='button'
              onClick={() => setSearchTerm('')}
              className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600'
              aria-label='ล้างคำค้นหา'
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      </div>

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
        ) : normalizedSearch ? (
          searchResults.length > 0 ? (
            <div className='space-y-5'>
              {searchResults.map(({ hub, categories, subsByCategoryId: matchedSubs }) => (
                <section key={hub.hub_id} className='space-y-2'>
                  <div className='flex items-center justify-between px-1'>
                    <p className='text-[12px] font-bold uppercase tracking-wide text-slate-400'>
                      {hub.name}
                    </p>
                    <span className='text-[11px] font-semibold text-brand-purple'>
                      {categories.length} หมวด
                    </span>
                  </div>
                  <HubBrowseContent
                    hub={hub}
                    categoriesOverride={categories}
                    subsByCategoryId={matchedSubs}
                    onGoAll={goAll}
                    onGoCategory={goCategory}
                    onGoSub={goSub}
                  />
                </section>
              ))}
            </div>
          ) : (
            <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center'>
              <p className='text-sm font-bold text-brand-navy-ink'>ไม่พบผลลัพธ์</p>
              <p className='mt-1 text-xs text-slate-500'>ลองค้นด้วยชื่อหมวดหรือหมวดย่อยอื่น</p>
            </div>
          )
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
