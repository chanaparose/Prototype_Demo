import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useFactoriesList } from '../../hooks/useFactoriesList';
import { FactoriesListMobile } from './FactoriesList.mobile';
import { FactoriesListDesktop } from './FactoriesList.desktop';

export function FactoriesList() {
  const isDesktop = useIsDesktop();
  const state = useFactoriesList();

  if (isDesktop) {
    return <FactoriesListDesktop state={state} />;
  }

  return <FactoriesListMobile state={state} />;
}

