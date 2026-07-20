import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Layers, Search } from 'lucide-react';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { HUB_SCOPE_LABELS } from '@/components/features/hub/hubRowShared';
import {
  factoryIdeasChromeGradientClass,
  factoryIdeasContentSurfaceClass,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { PageHeader } from '@/components/ui/PageHeader';
import { HubCard } from '@/components/features/hub/HubCard';
import { HubCategoriesSheet } from '@/components/features/hub/HubCategoriesSheet';
import { HubCategoryCard } from '@/components/features/hub/HubCategoryCard';
import { HubSectionSkeleton } from '@/components/features/hub/HubSectionSkeleton';
import { HubShowcasesFeed } from '@/components/features/hub/HubShowcasesFeed';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { useFactoryIdeasCategoriesQuery } from '@/domain/factory/queries/useFactoryIdeasQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import type { ICategoryForHubResponse, IHubResponse } from '@/services/api/types/master.types';

const HUB_SCOPE_ORDER: HubScope[] = ['PD', 'MT'];

/** category_id → full list of sub-category names (from the categories-with-subs API). */
type SubNamesByCatId = Map<number, string[]>;

/** True if the category name, its sub-preview, or any full sub-category name matches. */
function categoryMatchesSearch(
  cat: ICategoryForHubResponse,
  q: string,
  subNamesByCatId: SubNamesByCatId,
): boolean {
  if (cat.name.toLowerCase().includes(q)) return true;
  if ((cat.sub_preview ?? []).some((s) => s.toLowerCase().includes(q))) return true;
  const fullSubs = subNamesByCatId.get(cat.category_id);
  return fullSubs ? fullSubs.some((s) => s.toLowerCase().includes(q)) : false;
}

function filterHubs(
  hubs: IHubResponse[],
  search: string,
  subNamesByCatId: SubNamesByCatId,
): IHubResponse[] {
  if (!search.trim()) return hubs;
  const q = search.trim().toLowerCase();
  return hubs.filter(
    (hub) =>
      hub.name.toLowerCase().includes(q) ||
      hub.categories.some((c) => categoryMatchesSearch(c, q, subNamesByCatId)),
  );
}

function sortHubsByPopularity(hubs: IHubResponse[]): IHubResponse[] {
  return [...hubs].sort((a, b) => {
    const fa = a.categories.reduce((s, c) => s + (c.factory_count ?? 0), 0);
    const fb = b.categories.reduce((s, c) => s + (c.factory_count ?? 0), 0);
    return fb - fa;
  });
}

function HubSection({
  title,
  subtitle,
  hubs,
  accent = 'purple',
  seeAllHref,
  onHubClick,
  markFirstCard = false,
}: {
  title: string;
  subtitle?: string;
  hubs: IHubResponse[];
  accent?: 'purple' | 'orange';
  seeAllHref?: string;
  onHubClick: (hub: IHubResponse) => void;
  /** Tag the first card with data-tour="hub-first-card" for the product tour. */
  markFirstCard?: boolean;
}) {
  const navigate = useNavigate();
  if (hubs.length === 0) return null;

  return (
    <section className='space-y-2.5'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <span
            className={
              accent === 'orange'
                ? 'h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-orange/85 to-brand-orange/35'
                : 'h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-purple/85 to-brand-purple/35'
            }
          />
          <div className='min-w-0'>
            <h2 className='truncate text-[14px] font-bold text-[var(--brand-navy)] lg:text-[15px]'>
              {title}
            </h2>
            {subtitle ? (
              <p className='mt-0.5 truncate text-[11px] text-gray-500'>{subtitle}</p>
            ) : null}
          </div>
        </div>
        {seeAllHref ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate(seeAllHref)}
            className='group flex shrink-0 items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-[12px] font-medium text-brand-purple transition-colors hover:bg-brand-purple/8'
          >
            ดูทั้งหมด
            <span className='flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple/10 transition-colors group-hover:bg-brand-purple/15'>
              <ChevronRight size={11} strokeWidth={2.5} />
            </span>
          </Button>
        ) : null}
      </div>

      <div className='flex flex-nowrap items-stretch gap-2 overflow-x-auto pb-2 scrollbar-hide lg:gap-2.5'>
        {hubs.map((hub, i) => (
          <HubCard
            key={hub.hub_id}
            hub={hub}
            onClick={() => onHubClick(hub)}
            dataTour={markFirstCard && i === 0 ? 'hub-first-card' : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export function FactoryIdeasHubPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sheetHub, setSheetHub] = useState<IHubResponse | null>(null);
  const { isLiked, toggleFavorite } = useFavorites();

  const hubsQ = useLbiHubsQuery();
  const allHubs = hubsQ.data ?? [];
  const isLoading = hubsQ.isLoading;

  // Full sub-category names per category — hub payload only ships the first 3
  // (sub_preview), so we pull the complete list to search every sub-category.
  const categoriesQ = useFactoryIdeasCategoriesQuery();
  const subNamesByCatId = useMemo<SubNamesByCatId>(() => {
    const map: SubNamesByCatId = new Map();
    for (const c of categoriesQ.data ?? []) {
      map.set(Number(c.id), c.subCategories.map((s) => s.name));
    }
    return map;
  }, [categoriesQ.data]);

  const filteredByScope = useMemo(() => {
    const filtered = filterHubs(allHubs, search, subNamesByCatId);
    return {
      PD: filtered.filter((h) => h.scope === 'PD'),
      MT: filtered.filter((h) => h.scope === 'MT'),
      popular: sortHubsByPopularity(filtered).slice(0, 8),
    };
  }, [allHubs, search, subNamesByCatId]);

  // Phase 2: categories (across all hubs) whose name or any sub-category name
  // matches the search — surfaced as category cards so the user lands on the
  // matching category instead of only the parent hub.
  const matchedCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [] as { cat: ICategoryForHubResponse; hubId: number; scope: string }[];
    const seen = new Set<number>();
    const out: { cat: ICategoryForHubResponse; hubId: number; scope: string }[] = [];
    for (const hub of allHubs) {
      for (const cat of hub.categories) {
        if (seen.has(cat.category_id)) continue;
        if (categoryMatchesSearch(cat, q, subNamesByCatId)) {
          seen.add(cat.category_id);
          out.push({ cat, hubId: hub.hub_id, scope: hub.scope });
        }
      }
    }
    return out;
  }, [allHubs, search, subNamesByCatId]);

  const hasAny =
    matchedCategories.length > 0 ||
    filteredByScope.PD.length > 0 ||
    filteredByScope.MT.length > 0 ||
    filteredByScope.popular.length > 0;

  const openHub = (hub: IHubResponse) => {
    setSheetHub(hub);
  };

  const openCategory = (hubId: number, scope: string, categoryId: number) => {
    navigate(`/factory-ideas?hub_id=${hubId}&hub_scope=${scope}&category_id=${categoryId}`);
  };

  const content = (
    <div className='space-y-6 lg:space-y-7'>
      <div className='relative'>
        <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='ค้นหาสินค้า หมวดหมู่ หรือผู้ผลิต...'
          className='w-full rounded-xl border-gray-200 bg-white py-2.5 pl-9 pr-3 text-[12px] shadow-none placeholder:text-gray-400 focus:border-brand-purple/40 focus:ring-1 focus:ring-brand-purple/20 xl:text-[13px]'
        />
      </div>

      {isLoading ? (
        <>
          <HubSectionSkeleton />
          <HubSectionSkeleton />
          <HubSectionSkeleton />
        </>
      ) : null}

      {!isLoading && !hasAny ? (
        <div className='rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center'>
          <p className='text-sm text-gray-500'>
            {search ? `ไม่พบหมวดหมู่ที่ตรงกับ "${search}"` : 'ไม่พบข้อมูลหมวดหมู่'}
          </p>
        </div>
      ) : null}

      {!isLoading && search.trim() && matchedCategories.length > 0 ? (
        <section className='space-y-2.5'>
          <div className='flex items-center gap-2.5'>
            <span className='h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-purple/85 to-brand-purple/35' />
            <div className='min-w-0'>
              <h2 className='truncate text-[14px] font-bold text-[var(--brand-navy)] lg:text-[15px]'>
                หมวดหมู่ที่ตรงกับการค้นหา
              </h2>
              <p className='mt-0.5 truncate text-[11px] text-gray-500'>
                {matchedCategories.length} หมวดหมู่
              </p>
            </div>
          </div>
          <div className='flex flex-nowrap items-stretch gap-2 overflow-x-auto pb-2 scrollbar-hide lg:gap-2.5'>
            {matchedCategories.map(({ cat, hubId, scope }) => (
              <HubCategoryCard
                key={cat.category_id}
                cat={cat}
                onClick={() => openCategory(hubId, scope, cat.category_id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!isLoading
        ? (() => {
            // First non-empty scope owns the product-tour's first-card target,
            // so step 1 lands on the top card without scrolling to find one.
            const firstFilledScope = HUB_SCOPE_ORDER.find(
              (scope) => filteredByScope[scope].length > 0,
            );
            return HUB_SCOPE_ORDER.map((scope) => (
              <HubSection
                key={scope}
                title={`หมวดแนะนำ · ${HUB_SCOPE_LABELS[scope]}`}
                subtitle={
                  filteredByScope[scope].length > 0
                    ? `${filteredByScope[scope].length} กลุ่มธุรกิจ`
                    : undefined
                }
                hubs={filteredByScope[scope]}
                seeAllHref={`/factory-ideas?hub_scope=${scope}`}
                onHubClick={openHub}
                markFirstCard={scope === firstFilledScope}
              />
            ));
          })()
        : null}

      <HubShowcasesFeed
        search={search}
        isLiked={isLiked}
        onToggleFavorite={(id) => void toggleFavorite(id)}
      />
    </div>
  );

  return (
    <>
      <div className={`flex min-h-[100dvh] flex-col pb-24 lg:hidden ${factoryIdeasContentSurfaceClass}`}>
        <div className={factoryIdeasChromeGradientClass}>
          <PageHeader
            title='หมวดหมู่โรงงาน'
            subtitle='Discover'
            icon={Layers}
            variant='minimal'
            withBackdrop
            className='px-4 pb-3 pt-3'
          />
        </div>

        <main className={`flex-1 px-4 ${factoryIdeasContentSurfaceClass}`}>{content}</main>
      </div>

      <div className='hidden min-h-[100dvh] flex-col bg-[var(--brand-page)] pb-8 lg:flex'>
        <div className='sticky top-0 z-20'>
          <PageHeader
            title='หมวดหมู่โรงงาน'
            subtitle='Discover'
            icon={Layers}
            variant='minimal'
            withBackdrop
            className='border-b border-gray-100/80 px-8 py-4 2xl:px-10'
          />
        </div>

        <main className='flex-1 px-8 py-6 2xl:px-10'>{content}</main>
      </div>

      <HubCategoriesSheet
        hub={sheetHub}
        open={sheetHub != null}
        onOpenChange={(next) => {
          if (!next) setSheetHub(null);
        }}
      />
    </>
  );
}
