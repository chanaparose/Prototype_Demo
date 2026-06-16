import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@lib/utils';
import { getLbiHubs } from '@/services/api/masterApi';
import type { ICategoryForHubResponse, IHubResponse } from '@/services/api/types/master.types';
import { MobileSearchField } from '@/components/shared/MobileSearchField';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const SCOPE_LABELS: Record<string, string> = {
  PD: 'โรงงานรับผลิต',
  MT: 'วัตถุดิบ',
};

const VISIBLE_CARDS = 4;

function useHubsQuery() {
  return useQuery({
    queryKey: ['lbi-hubs', 'all'],
    queryFn: async () => {
      const res = await getLbiHubs();
      const raw = res as unknown as { hubs?: IHubResponse[] };
      return raw.hubs ?? [];
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

function CategoryCard({
  cat,
  onClick,
}: {
  cat: ICategoryForHubResponse;
  onClick: () => void;
}) {
  const initial = cat.name.trim().charAt(0) || '?';
  const subText = (cat.sub_preview ?? []).slice(0, 2).join(' · ');

  return (
    <button
      type='button'
      onClick={onClick}
      className='group flex w-[100px] shrink-0 flex-col rounded-xl border border-gray-100 bg-white p-2.5 text-left shadow-sm transition-all hover:border-brand-purple/25 hover:shadow-md active:scale-[0.98]'
    >
      <div className='mb-2 flex items-start justify-between gap-1'>
        <span
          aria-hidden
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand-page)] to-white text-[15px] font-bold text-[var(--brand-mauve)] ring-1 ring-brand-purple/10 transition-all group-hover:ring-brand-purple/30'
        >
          {initial}
        </span>
        {cat.factory_count > 0 ? (
          <span className='rounded-full bg-[var(--brand-page)] px-1.5 py-0.5 text-[8px] font-medium leading-none text-gray-500'>
            {cat.factory_count}
          </span>
        ) : null}
      </div>
      <span className='line-clamp-2 text-[11px] font-semibold leading-snug text-[var(--brand-navy)]'>
        {cat.name}
      </span>
      {subText ? (
        <span className='mt-1 line-clamp-2 text-[9px] leading-tight text-gray-400'>{subText}</span>
      ) : null}
    </button>
  );
}

function SeeAllCard({
  count,
  hiddenNames,
  onClick,
}: {
  count: number;
  hiddenNames: string[];
  onClick: () => void;
}) {
  const subText = hiddenNames.slice(0, 2).join(' · ');

  return (
    <button
      type='button'
      onClick={onClick}
      className='flex w-[100px] shrink-0 flex-col rounded-xl border border-dashed border-brand-purple/25 bg-white p-2.5 text-left shadow-sm transition-all hover:border-brand-purple/40 hover:bg-[var(--brand-page)] active:scale-[0.98]'
    >
      <div className='mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple'>
        <ArrowRight size={16} strokeWidth={2.25} />
      </div>
      <span className='text-[11px] font-semibold leading-snug text-brand-purple'>+{count} หมวด</span>
      <span className='mt-0.5 text-[9px] font-medium text-brand-purple/70'>ดูครบ</span>
      {subText ? (
        <span className='mt-1 line-clamp-2 text-[9px] leading-tight text-gray-400'>{subText}</span>
      ) : null}
    </button>
  );
}

function HubSection({
  hub,
  navigate,
}: {
  hub: IHubResponse;
  navigate: (path: string) => void;
}) {
  const totalFactories = hub.categories.reduce((s, c) => s + (c.factory_count ?? 0), 0);
  const visible = hub.categories.slice(0, VISIBLE_CARDS);
  const hidden = hub.categories.slice(VISIBLE_CARDS);
  const hiddenCount = hidden.length;

  return (
    <section className='mx-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
      <div className='flex items-center justify-between gap-3 px-3.5 pb-2.5 pt-3.5'>
        <div className='min-w-0'>
          <h2 className='truncate text-[13px] font-bold text-[var(--brand-navy)]'>{hub.name}</h2>
          {totalFactories > 0 ? (
            <p className='mt-0.5 text-[10px] text-gray-400'>{totalFactories} โรงงาน</p>
          ) : null}
        </div>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(`/factory-ideas?hub_id=${hub.hub_id}`)}
          className='flex shrink-0 items-center gap-0.5 rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-brand-purple/30 hover:text-brand-purple'
        >
          ดูทั้งหมด
          <ChevronRight size={12} strokeWidth={2.25} />
        </Button>
      </div>

      <div className='scrollbar-hide flex gap-2.5 overflow-x-auto px-3.5 pb-3.5'>
        {visible.map((cat) => (
          <CategoryCard
            key={cat.category_id}
            cat={cat}
            onClick={() =>
              navigate(`/factory-ideas?hub_id=${hub.hub_id}&category_id=${cat.category_id}`)
            }
          />
        ))}
        {hiddenCount > 0 ? (
          <SeeAllCard
            count={hiddenCount}
            hiddenNames={hidden.map((c) => c.name)}
            onClick={() => navigate(`/factory-ideas?hub_id=${hub.hub_id}`)}
          />
        ) : null}
      </div>
    </section>
  );
}

function HubSectionSkeleton() {
  return (
    <div className='mx-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm'>
      <div className='mb-3 flex items-center justify-between'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-6 w-16 rounded-full' />
      </div>
      <div className='flex gap-2.5 overflow-hidden'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='w-[100px] shrink-0 space-y-2 rounded-xl border border-gray-100 p-2.5'>
            <Skeleton className='h-9 w-9 rounded-lg' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-2 w-4/5' />
          </div>
        ))}
      </div>
    </div>
  );
}

function ComingSoonStrip() {
  return (
    <div
      className='mx-3 mb-4 rounded-2xl border border-dashed border-gray-200 bg-white px-3.5 py-3 select-none pointer-events-none'
      aria-hidden
    >
      <div className='mb-1 flex flex-wrap items-center gap-2'>
        <span className='text-[12px] font-semibold text-gray-600'>อาหารคน · Human Food</span>
        <span className='rounded-md bg-[#EEEDFE] px-2 py-0.5 text-[9px] font-semibold text-brand-purple'>
          เร็วๆ นี้
        </span>
      </div>
      <p className='text-[10px] leading-relaxed text-gray-400'>
        โรงงาน GMP · Halal / กำลังเปิดให้บริการเร็วๆ นี้
      </p>
    </div>
  );
}

export function FactoryIdeasHubPage() {
  const navigate = useNavigate();
  const [activeScope, setActiveScope] = useState<'PD' | 'MT'>('PD');
  const [searchText, setSearchText] = useState('');

  const hubsQ = useHubsQuery();
  const hubs = (hubsQ.data ?? []).filter((h) => h.scope === activeScope);
  const isLoading = hubsQ.isLoading;

  const handleSearch = () => {
    const q = searchText.trim();
    if (q) navigate(`/explore?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className='flex min-h-[100dvh] flex-col bg-[var(--brand-page)] pb-24'>
      <header className='border-b border-gray-100 bg-white px-4 pb-3 pt-4'>
        <div className='mb-2.5'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
            Discover
          </p>
          <h1 className='text-lg font-bold leading-tight text-[var(--brand-navy)]'>หมวดหมู่โรงงาน</h1>
        </div>

        <div className='relative mb-3 overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--brand-navy-deep)_0%,#4A267D_100%)] px-3 py-2.5 text-white shadow-md'>
          <div className='pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[var(--brand-orange-hot)] opacity-35 blur-xl mix-blend-screen' />
          <div className='pointer-events-none absolute right-0 top-0 h-16 w-16 translate-x-5 skew-x-[-15deg] rounded-full bg-[var(--brand-purple)] opacity-50' />
          <div className='relative z-10 flex items-center gap-2.5'>
            <div className='flex shrink-0 items-center justify-center rounded-full border border-[rgba(162,56,255,0.50)] bg-[rgba(162,56,255,0.30)] p-1.5'>
              <Sparkles size={16} className='text-white' />
            </div>
            <p className='flex-1 text-[11px] font-medium leading-snug text-[#EBD3FF]'>
              เลือกหมวดเพื่อค้นหาโรงงานและสินค้าที่ตรงกับธุรกิจของคุณ
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <MobileSearchField
            value={searchText}
            onChange={setSearchText}
            placeholder='ค้นหาโรงงาน สินค้า วัตถุดิบ'
          />
        </form>
      </header>

      <div className='sticky top-0 z-20 border-b border-gray-200 bg-white'>
        <div className='flex'>
          {(['PD', 'MT'] as const).map((scope) => {
            const label = SCOPE_LABELS[scope] ?? scope;
            const isActive = activeScope === scope;
            return (
              <button
                key={scope}
                type='button'
                onClick={() => setActiveScope(scope)}
                className='relative flex-1 px-2 py-3 text-center'
              >
                <span
                  className={cn(
                    'text-[13px] leading-none whitespace-nowrap',
                    isActive ? 'font-bold text-[var(--brand-navy)]' : 'font-medium text-gray-400',
                  )}
                >
                  {label}
                </span>
                {isActive ? (
                  <span className='absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--brand-navy)]' />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <main className='flex-1 space-y-3 py-3'>
        {isLoading ? (
          <>
            <HubSectionSkeleton />
            <HubSectionSkeleton />
            <HubSectionSkeleton />
          </>
        ) : null}

        {!isLoading && hubs.length === 0 ? (
          <div className='px-6 py-16 text-center'>
            <p className='text-sm text-gray-400'>ไม่พบข้อมูลในหมวดนี้</p>
          </div>
        ) : null}

        {!isLoading
          ? hubs.map((hub) => (
              <HubSection key={hub.hub_id} hub={hub} navigate={navigate} />
            ))
          : null}

        {activeScope === 'PD' && !isLoading ? <ComingSoonStrip /> : null}
      </main>
    </div>
  );
}
