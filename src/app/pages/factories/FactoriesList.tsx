import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useFactoriesList } from '../../hooks/useFactoriesList';
import { FactoriesListMobile } from './FactoriesList.mobile';
import { FactoriesListDesktop } from './FactoriesList.desktop';

export function FactoriesList() {
  const isDesktop = useIsDesktop();
  const state = useFactoriesList();

  if (state.loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 bg-gray-50">
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
          aria-hidden
        />
        <p className="text-sm text-gray-500">กำลังโหลดรายชื่อโรงงาน…</p>
      </div>
    );
  }

  if (isDesktop) {
    return <FactoriesListDesktop state={state} />;
  }

  return <FactoriesListMobile state={state} />;
}

