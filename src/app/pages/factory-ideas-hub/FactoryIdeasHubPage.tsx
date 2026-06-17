import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@lib/utils';
import { APP_PAGE_TITLE_CLASS } from '@lib/appTypography';
import { getLbiHubs } from '@/services/api/masterApi';
import type { ICategoryForHubResponse, IHubResponse } from '@/services/api/types/master.types';
import { MobileSearchField } from '@/components/shared/MobileSearchField';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const SCOPE_LABELS: Record<string, string> = {
  PD: 'โรงงานรับผลิต',
  MT: 'วัตถุดิบ',
};

const VISIBLE_CARDS_MOBILE = 4;
const VISIBLE_CARDS_DESKTOP = 5;
/** แถว desktop ออกแบบรองรับสูงสุด 5 หมวด + การ์ดดูครบ = 6 ช่องความกว้างเท่ากันทุก section */
const DESKTOP_ROW_SLOTS = 6;

const hubRowCardClass =
  'flex h-[104px] w-[108px] shrink-0 flex-col overflow-hidden rounded-xl p-3 text-left lg:h-[118px] lg:w-[calc((100%-3.75rem)/6)] lg:flex-none';

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsLgUp(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isLgUp;
}

function getHubRowVisibleCount(categoryCount: number, isLgUp: boolean) {
  const maxCategories = isLgUp ? VISIBLE_CARDS_DESKTOP : VISIBLE_CARDS_MOBILE;
  if (categoryCount <= maxCategories) return categoryCount;
  return maxCategories;
}

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
  const subText = (cat.sub_preview ?? []).slice(0, 2).join(' · ');
  const factoryLabel =
    cat.factory_count > 0 ? `${cat.factory_count} โรงงาน` : 'ดูรายการในหมวดนี้';

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        hubRowCardClass,
        'group border border-brand-purple/15 bg-gradient-to-br from-[var(--brand-lavender-chip)] via-[var(--brand-panel-soft)] to-white shadow-[0_2px_8px_rgba(46,34,82,0.07)] transition-all hover:-translate-y-0.5 hover:border-brand-purple/35 hover:shadow-[0_4px_14px_rgba(122,75,148,0.18)] active:scale-[0.98]',
      )}
    >
      <span className='line-clamp-2 text-[11px] font-bold leading-snug text-[var(--brand-navy)] group-hover:text-brand-purple'>
        {cat.name}
      </span>
      {subText ? (
        <span className='mt-1 line-clamp-2 text-[9px] leading-tight text-[var(--brand-muted-purple)]'>
          {subText}
        </span>
      ) : null}
      <span
        className={cn(
          'mt-auto pt-2.5 text-[9px] font-semibold leading-none',
          cat.factory_count > 0 ? 'text-brand-purple' : 'text-gray-400',
        )}
      >
        {factoryLabel}
      </span>
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
      className={cn(
        hubRowCardClass,
        'border border-dashed border-brand-purple/35 bg-gradient-to-br from-white to-[var(--brand-lavender-chip)] shadow-[0_2px_8px_rgba(46,34,82,0.06)] transition-all hover:border-brand-purple/50 hover:shadow-[0_4px_14px_rgba(122,75,148,0.14)] active:scale-[0.98]',
      )}
    >
      <span className='mb-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-purple/12 text-brand-purple'>
        <ArrowRight size={14} strokeWidth={2.5} />
      </span>
      <span className='text-[11px] font-bold leading-snug text-brand-purple'>+{count} หมวด</span>
      <span className='mt-0.5 text-[9px] font-medium text-brand-purple/75'>ดูครบทุกหมวด</span>
      {subText ? (
        <span className='mt-auto line-clamp-2 pt-1.5 text-[9px] leading-tight text-[var(--brand-muted-purple)]'>
          {subText}
        </span>
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
  const isLgUp = useIsLgUp();
  const visibleCount = getHubRowVisibleCount(hub.categories.length, isLgUp);
  const visible = hub.categories.slice(0, visibleCount);
  const hidden = hub.categories.slice(visibleCount);
  const hiddenCount = hidden.length;

  return (
    <section className='mx-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:mx-0'>
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
          onClick={() => navigate(`/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}`)}
          className='flex shrink-0 items-center gap-0.5 rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-brand-purple/30 hover:text-brand-purple'
        >
          ดูทั้งหมด
          <ChevronRight size={12} strokeWidth={2.25} />
        </Button>
      </div>

      <div className='flex flex-nowrap items-stretch gap-2.5 overflow-x-auto bg-[var(--brand-page)]/50 px-3.5 py-3.5 scrollbar-hide lg:gap-3 lg:overflow-hidden'>
        {visible.map((cat) => (
          <CategoryCard
            key={cat.category_id}
            cat={cat}
            onClick={() =>
              navigate(`/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}&category_id=${cat.category_id}`)
            }
          />
        ))}
        {hiddenCount > 0 ? (
          <SeeAllCard
            count={hiddenCount}
            hiddenNames={hidden.map((c) => c.name)}
            onClick={() => navigate(`/factory-ideas?hub_id=${hub.hub_id}&hub_scope=${hub.scope}`)}
          />
        ) : null}
      </div>
    </section>
  );
}

function HubSectionSkeleton() {
  return (
    <div className='mx-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm lg:mx-0'>
      <div className='mb-3 flex items-center justify-between'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-6 w-16 rounded-full' />
      </div>
      <div className='flex flex-nowrap items-stretch gap-2.5 overflow-hidden bg-[var(--brand-page)]/50 p-3.5 lg:gap-3'>
        {Array.from({ length: DESKTOP_ROW_SLOTS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              hubRowCardClass,
              'space-y-2 border border-brand-purple/10 bg-[var(--brand-lavender-chip)]',
            )}
          >
            <Skeleton className='h-3 w-full bg-brand-purple/10' />
            <Skeleton className='h-2 w-4/5 bg-brand-purple/10' />
            <Skeleton className='h-2 w-2/3 bg-brand-purple/10' />
          </div>
        ))}
      </div>
    </div>
  );
}

function ComingSoonStrip() {
  return (
    <div
      className='mx-3 mb-4 rounded-2xl border border-dashed border-gray-200 bg-white px-3.5 py-3 select-none pointer-events-none lg:mx-0'
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
  const [searchParams] = useSearchParams();
  const scopeFromUrl = searchParams.get('scope');
  const [activeScope, setActiveScope] = useState<'PD' | 'MT'>(() =>
    scopeFromUrl === 'MT' ? 'MT' : 'PD',
  );
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (scopeFromUrl === 'PD' || scopeFromUrl === 'MT') {
      setActiveScope(scopeFromUrl);
    }
  }, [scopeFromUrl]);

  const hubsQ = useHubsQuery();
  const hubs = (hubsQ.data ?? []).filter((h) => h.scope === activeScope);
  const isLoading = hubsQ.isLoading;

  const handleSearch = () => {
    const q = searchText.trim();
    if (q) navigate(`/explore?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className='flex min-h-[100dvh] flex-col bg-[var(--brand-page)] pb-24 lg:pb-8'>
      <header className='border-b border-gray-100 bg-white px-4 pb-3 pt-4 lg:px-8 2xl:px-10'>
        <div className='mb-2.5'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
            Discover
          </p>
          <h1 className={APP_PAGE_TITLE_CLASS}>หมวดหมู่โรงงาน</h1>
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
        <div className='flex overflow-x-auto scrollbar-hide'>
          {(['PD', 'MT'] as const).map((scope) => {
            const label = SCOPE_LABELS[scope] ?? scope;
            const isActive = activeScope === scope;
            return (
              <button
                key={scope}
                type='button'
                onClick={() => setActiveScope(scope)}
                className='relative min-w-0 flex-1 shrink-0 px-2 py-3 text-center'
              >
                <span
                  className={cn(
                    'text-[14px] leading-none whitespace-nowrap',
                    isActive ? 'font-bold text-[var(--brand-navy)]' : 'font-medium text-gray-400',
                  )}
                >
                  {label}
                </span>
                {isActive ? (
                  <span
                    className='absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full'
                    style={{ background: 'var(--brand-purple)' }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <main className='flex-1 space-y-3 py-3 lg:space-y-4 lg:px-8 lg:py-4 2xl:px-10'>
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
