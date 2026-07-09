import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Layers, Search } from 'lucide-react';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { factoryIdeasChromeGradientClass, factoryIdeasContentSurfaceClass } from '@/components/features/factory-ideas/factoryIdeasTheme';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabSwipeContent } from '@/components/layout/TabSwipeContent';
import { HubScopeTabs } from '@/components/features/hub/HubScopeTabs';
import { HubSection } from '@/components/features/hub/HubSection';
import { HubSectionSkeleton } from '@/components/features/hub/HubSectionSkeleton';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { Input } from '@/components/ui/input';
import { cn } from '@lib/utils';
import type { IHubResponse } from '@/services/api/types/master.types';

const HUB_SCOPE_ORDER: HubScope[] = ['PD', 'MT'];

type FilterChip = 'popular' | 'low_moq' | '';

function ComingSoonStrip() {
  return (
    <div
      className='pointer-events-none select-none rounded-2xl border border-gray-100 bg-white px-3.5 py-3 text-left'
      aria-hidden
    >
      <div className='mb-1 flex flex-wrap items-center gap-2'>
        <span className='text-[13px] font-semibold text-gray-600'>หมวดอื่นๆ</span>
        <span className='rounded-md bg-[#EEEDFE] px-2 py-0.5 text-[9px] font-semibold text-brand-purple'>
          เร็วๆ นี้
        </span>
      </div>
      <p className='text-[11px] leading-relaxed text-gray-400'>
        กำลังเปิดให้บริการเร็วๆ นี้
      </p>
    </div>
  );
}

function filterHubs(hubs: IHubResponse[], search: string): IHubResponse[] {
  if (!search.trim()) return hubs;
  const q = search.trim().toLowerCase();
  return hubs
    .map((hub) => ({
      ...hub,
      categories: hub.categories.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          hub.name.toLowerCase().includes(q) ||
          (c.sub_preview ?? []).some((s) => s.toLowerCase().includes(q)),
      ),
    }))
    .filter((hub) => hub.categories.length > 0);
}

export function FactoryIdeasHubPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scopeFromUrl = searchParams.get('scope');
  const [activeScope, setActiveScope] = useState<HubScope>(() =>
    scopeFromUrl === 'MT' ? 'MT' : 'PD',
  );
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState<FilterChip>('');

  useEffect(() => {
    if (scopeFromUrl === 'PD' || scopeFromUrl === 'MT') {
      setActiveScope(scopeFromUrl);
    }
  }, [scopeFromUrl]);

  const hubsQ = useLbiHubsQuery();
  const allHubs = (hubsQ.data ?? []).filter((h) => h.scope === activeScope);
  const isLoading = hubsQ.isLoading;

  const filteredHubs = useMemo(() => filterHubs(allHubs, search), [allHubs, search]);

  const toggleChip = (chip: FilterChip) => setActiveChip((prev) => (prev === chip ? '' : chip));

  const renderContent = () => (
    <div className='space-y-6 lg:space-y-7'>
      {/* Search + filter chips */}
      <div className='space-y-2.5'>
        <div className='relative'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='ค้นหาหมวดหมู่หรือสินค้า...'
            className='w-full rounded-xl border-gray-200 bg-white py-2.5 pl-9 pr-3 text-[12px] shadow-none placeholder:text-gray-400 focus:border-brand-purple/40 focus:ring-1 focus:ring-brand-purple/20 xl:text-[13px]'
          />
        </div>
         
      </div>

      {isLoading ? (
        <>
          <HubSectionSkeleton />
          <HubSectionSkeleton />
          <HubSectionSkeleton />
        </>
      ) : null}

      {!isLoading && filteredHubs.length === 0 ? (
        <div className='rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center'>
          <p className='text-sm text-gray-500'>
            {search ? `ไม่พบหมวดหมู่ที่ตรงกับ "${search}"` : 'ไม่พบข้อมูลในหมวดนี้'}
          </p>
        </div>
      ) : null}

      {!isLoading
        ? filteredHubs.map((hub) => <HubSection key={hub.hub_id} hub={hub} onNavigate={navigate} />)
        : null}

      {activeScope === 'PD' && !isLoading ? <ComingSoonStrip /> : null}
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

          <HubScopeTabs
            activeScope={activeScope}
            onScopeChange={setActiveScope}
            sticky
            className='bg-white shadow-none'
          />
        </div>

        <main className={`flex-1 px-4 pt-5 ${factoryIdeasContentSurfaceClass}`}>
          <TabSwipeContent activeKey={activeScope} tabOrder={HUB_SCOPE_ORDER}>
            {renderContent()}
          </TabSwipeContent>
        </main>
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

          <HubScopeTabs
            activeScope={activeScope}
            onScopeChange={setActiveScope}
          />
        </div>

        <main className='flex-1 px-8 py-6 2xl:px-10'>
          <TabSwipeContent activeKey={activeScope} tabOrder={HUB_SCOPE_ORDER}>
            {renderContent()}
          </TabSwipeContent>
        </main>
      </div>
    </>
  );
}
