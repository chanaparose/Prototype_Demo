import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Sparkles } from 'lucide-react';
import { APP_PAGE_TITLE_CLASS } from '@lib/appTypography';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { HubScopeTabs } from '@/components/features/hub/HubScopeTabs';
import { HubSection } from '@/components/features/hub/HubSection';
import { HubSectionSkeleton } from '@/components/features/hub/HubSectionSkeleton';
import { HubPageContentBackdrop } from '@/components/features/hub/HubPageContentBackdrop';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';

function ComingSoonStrip() {
  return (
    <div
      className='select-none rounded-2xl border border-white/70 bg-white/45 px-3.5 py-3 text-left backdrop-blur-md pointer-events-none'
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
  const [activeScope, setActiveScope] = useState<HubScope>(() =>
    scopeFromUrl === 'MT' ? 'MT' : 'PD',
  );

  useEffect(() => {
    if (scopeFromUrl === 'PD' || scopeFromUrl === 'MT') {
      setActiveScope(scopeFromUrl);
    }
  }, [scopeFromUrl]);

  const hubsQ = useLbiHubsQuery();
  const hubs = (hubsQ.data ?? []).filter((h) => h.scope === activeScope);
  const isLoading = hubsQ.isLoading;

  return (
    <div className='relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-[#F8F4FF] pb-24 lg:pb-8'>
      <HubPageContentBackdrop className='fixed inset-0' />
      <div className='relative z-10 shrink-0 border-b border-gray-100 bg-white'>
        <header className='px-4 pb-2.5 pt-4 lg:px-8 2xl:px-10'>
          <div className='flex items-end justify-between gap-3'>
            <div className='min-w-0'>
              <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
                Discover
              </p>
              <h1 className={APP_PAGE_TITLE_CLASS}>หมวดหมู่โรงงาน</h1>
            </div>
            <p className='hidden max-w-[280px] text-right text-[11px] leading-snug text-slate-500 sm:block'>
              เลือกประเภท แล้วแตะหมวดที่สนใจเพื่อดูโรงงานที่ตรงกับธุรกิจของคุณ
            </p>
          </div>

           
        </header>

        <HubScopeTabs
          activeScope={activeScope}
          onScopeChange={setActiveScope}
          sticky
          className='bg-transparent'
        />
      </div>

      <main className='relative z-10 flex-1'>
        <div className='relative z-10 space-y-6 px-4 py-5 lg:space-y-7 lg:px-8 lg:py-6 2xl:px-10'>
          {isLoading ? (
            <>
              <HubSectionSkeleton />
              <HubSectionSkeleton />
              <HubSectionSkeleton />
            </>
          ) : null}

          {!isLoading && hubs.length === 0 ? (
            <div className='rounded-3xl border border-white/75 bg-white/55 px-6 py-16 text-center backdrop-blur-md'>
              <p className='text-sm text-gray-500'>ไม่พบข้อมูลในหมวดนี้</p>
            </div>
          ) : null}

          {!isLoading
            ? hubs.map((hub) => <HubSection key={hub.hub_id} hub={hub} onNavigate={navigate} />)
            : null}

          {activeScope === 'PD' && !isLoading ? <ComingSoonStrip /> : null}
        </div>
      </main>
    </div>
  );
}
