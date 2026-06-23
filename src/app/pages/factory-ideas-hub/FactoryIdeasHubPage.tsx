import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Layers } from 'lucide-react';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { HubScopeTabs } from '@/components/features/hub/HubScopeTabs';
import { HubSection } from '@/components/features/hub/HubSection';
import { HubSectionSkeleton } from '@/components/features/hub/HubSectionSkeleton';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';

function ComingSoonStrip() {
  return (
    <div
      className='pointer-events-none select-none rounded-2xl border border-gray-100 bg-white px-3.5 py-3 text-left'
      aria-hidden
    >
      <div className='mb-1 flex flex-wrap items-center gap-2'>
        <span className='text-[13px] font-semibold text-gray-600'>อาหารคน · Human Food</span>
        <span className='rounded-md bg-[#EEEDFE] px-2 py-0.5 text-[9px] font-semibold text-brand-purple'>
          เร็วๆ นี้
        </span>
      </div>
      <p className='text-[11px] leading-relaxed text-gray-400'>
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

  const renderContent = () => (
    <div className='space-y-6 lg:space-y-7'>
      {isLoading ? (
        <>
          <HubSectionSkeleton />
          <HubSectionSkeleton />
          <HubSectionSkeleton />
        </>
      ) : null}

      {!isLoading && hubs.length === 0 ? (
        <div className='rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center'>
          <p className='text-sm text-gray-500'>ไม่พบข้อมูลในหมวดนี้</p>
        </div>
      ) : null}

      {!isLoading
        ? hubs.map((hub) => <HubSection key={hub.hub_id} hub={hub} onNavigate={navigate} />)
        : null}

      {activeScope === 'PD' && !isLoading ? <ComingSoonStrip /> : null}
    </div>
  );

  return (
    <>
      <div className='flex min-h-[100dvh] flex-col bg-[var(--brand-page)] pb-24 lg:hidden'>
        <div className='px-4 py-3'>
          <FactoryPageHeader
            title='หมวดหมู่โรงงาน'
            subtitle='Discover'
            icon={Layers}
            variant='minimal'
          />
        </div>

        <HubScopeTabs
          activeScope={activeScope}
          onScopeChange={setActiveScope}
          sticky
        />

        <main className='flex-1 px-4 py-5'>{renderContent()}</main>
      </div>

      <div className='hidden min-h-[100dvh] flex-col bg-[var(--brand-page)] pb-8 lg:flex'>
        <div className='sticky top-0 z-20 bg-[var(--brand-page)]'>
          <header className='px-8 py-4 2xl:px-10'>
            <FactoryPageHeader
              title='หมวดหมู่โรงงาน'
              subtitle='Discover'
              icon={Layers}
              variant='minimal'
            />
          </header>

          <HubScopeTabs
            activeScope={activeScope}
            onScopeChange={setActiveScope}
          />
        </div>

        <main className='flex-1 px-8 py-6 2xl:px-10'>{renderContent()}</main>
      </div>
    </>
  );
}
