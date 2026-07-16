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
import { HubSectionSkeleton } from '@/components/features/hub/HubSectionSkeleton';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { IHubResponse } from '@/services/api/types/master.types';

const HUB_SCOPE_ORDER: HubScope[] = ['PD', 'MT'];

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
      <p className='text-[11px] leading-relaxed text-gray-400'>กำลังเปิดให้บริการเร็วๆ นี้</p>
    </div>
  );
}

function filterHubs(hubs: IHubResponse[], search: string): IHubResponse[] {
  if (!search.trim()) return hubs;
  const q = search.trim().toLowerCase();
  return hubs.filter(
    (hub) =>
      hub.name.toLowerCase().includes(q) ||
      hub.categories.some(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.sub_preview ?? []).some((s) => s.toLowerCase().includes(q)),
      ),
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
}: {
  title: string;
  subtitle?: string;
  hubs: IHubResponse[];
  accent?: 'purple' | 'orange';
  seeAllHref?: string;
  onHubClick: (hub: IHubResponse) => void;
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
        {hubs.map((hub) => (
          <HubCard key={hub.hub_id} hub={hub} onClick={() => onHubClick(hub)} />
        ))}
      </div>
    </section>
  );
}

export function FactoryIdeasHubPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const hubsQ = useLbiHubsQuery();
  const allHubs = hubsQ.data ?? [];
  const isLoading = hubsQ.isLoading;

  const filteredByScope = useMemo(() => {
    const filtered = filterHubs(allHubs, search);
    return {
      PD: filtered.filter((h) => h.scope === 'PD'),
      MT: filtered.filter((h) => h.scope === 'MT'),
      popular: sortHubsByPopularity(filtered).slice(0, 8),
    };
  }, [allHubs, search]);

  const hasAny =
    filteredByScope.PD.length > 0 ||
    filteredByScope.MT.length > 0 ||
    filteredByScope.popular.length > 0;

  const openHub = (hub: IHubResponse) => {
    navigate(`/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}`);
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

      {!isLoading
        ? HUB_SCOPE_ORDER.map((scope) => (
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
            />
          ))
        : null}

        
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

        <main className={`flex-1 px-4 pt-5 ${factoryIdeasContentSurfaceClass}`}>{content}</main>
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
    </>
  );
}
