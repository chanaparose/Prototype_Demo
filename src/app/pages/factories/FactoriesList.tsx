import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useFactoriesList } from '@/hooks/useFactoriesList';
import { FactoriesListMobile } from '@/pages/factories/FactoriesList.mobile';
import { FactoriesListDesktop } from '@/pages/factories/FactoriesList.desktop';
import { FactoryListRowSkeleton } from '@/components/skeletons/PageSkeletons';

export function FactoriesList() {
  const isDesktop = useIsDesktop();
  const state = useFactoriesList();

  if (state.loading) {
    return (
      <div className='pb-24 bg-gray-50 min-h-screen'>
        <div className='bg-white px-4 pt-5 pb-4 border-b border-gray-100 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1.5'>
              <div className='h-2.5 w-16 rounded bg-slate-100 animate-pulse' />
              <div className='h-6 w-36 rounded bg-slate-100 animate-pulse' />
            </div>
            <div className='h-7 w-20 rounded-full bg-slate-100 animate-pulse' />
          </div>
          <div className='h-12 w-full rounded-2xl bg-slate-100 animate-pulse' />
        </div>
        <div className='px-4 pt-4 space-y-3'>
          {[...Array(6)].map((_, i) => (
            <FactoryListRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isDesktop) {
    return <FactoriesListDesktop state={state} />;
  }

  return <FactoriesListMobile state={state} />;
}
