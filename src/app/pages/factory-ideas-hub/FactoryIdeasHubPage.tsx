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
      className='rounded-2xl border border-dashed border-gray-200 bg-white/90 px-3.5 py-3 shadow-sm backdrop-blur-sm select-none pointer-events-none'
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
    <div className='relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-[#F9F5FF] pb-24 lg:pb-8'>
      <HubPageContentBackdrop className='fixed inset-0' />
      <div className='relative z-10 shrink-0 bg-white/[0.92] shadow-[0_1px_0_rgba(46,34,82,0.06)] backdrop-blur-xl'>
        <header className='px-4 pb-3 pt-4 lg:px-8 2xl:px-10'>
          <div className='mb-2.5'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
              Discover
            </p>
            <h1 className={APP_PAGE_TITLE_CLASS}>หมวดหมู่โรงงาน</h1>
          </div>

          <div className='relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--brand-navy-deep)_0%,#4A267D_100%)] px-3 py-2.5 text-white shadow-md'>
            <div className='pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[var(--brand-orange-hot)] opacity-35 blur-xl mix-blend-screen' />
            <div className='pointer-events-none absolute right-0 top-0 h-16 w-16 translate-x-5 skew-x-[-15deg] rounded-full bg-[var(--brand-purple)] opacity-50' />
            <div className='pointer-events-none absolute -bottom-2 -left-2 h-14 w-14 rounded-full bg-[var(--brand-purple)] opacity-25 blur-lg mix-blend-screen' />
            <div className='relative z-10 flex items-center gap-2.5'>
              <div className='flex shrink-0 items-center justify-center rounded-full border border-[rgba(162,56,255,0.50)] bg-[rgba(162,56,255,0.30)] p-1.5'>
                <Sparkles size={16} className='text-white' />
              </div>
              <p className='flex-1 text-[11px] font-medium leading-snug text-[#EBD3FF]'>
                เลือกหมวดเพื่อดูโรงงานและสินค้าที่ตรงกับธุรกิจของคุณ
              </p>
            </div>
          </div>

          <p className='mt-2.5 text-[11px] leading-relaxed text-gray-500'>
            <span className='font-semibold text-brand-purple'>①</span> เลือกประเภทด้านล่าง{' '}
            <span className='text-gray-300' aria-hidden>
              ·
            </span>{' '}
            <span className='font-semibold text-brand-purple'>②</span> แตะหมวดที่สนใจ
          </p>
        </header>

        <HubScopeTabs
          activeScope={activeScope}
          onScopeChange={setActiveScope}
          sticky
          className='border-t border-gray-100'
        />
      </div>

      <main className='relative z-10 flex-1'>
        <div className='relative z-10 space-y-3 px-3 py-3 lg:space-y-4 lg:px-8 lg:py-4 2xl:px-10'>
          {isLoading ? (
            <>
              <HubSectionSkeleton />
              <HubSectionSkeleton />
              <HubSectionSkeleton />
            </>
          ) : null}

          {!isLoading && hubs.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-brand-purple/20 bg-white/80 px-6 py-16 text-center shadow-sm backdrop-blur-sm'>
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
