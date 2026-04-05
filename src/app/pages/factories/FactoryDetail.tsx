import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useFactoryProfile } from '../../hooks/useFactoryProfile';
import { FactoryDetailMobile } from './FactoryDetail.mobile';
import { FactoryDetailDesktop } from './FactoryDetail.desktop';

export function FactoryDetail() {
  const isDesktop = useIsDesktop();
  const state = useFactoryProfile();

  if (isDesktop) {
    return <FactoryDetailDesktop state={state} />;
  }

  return <FactoryDetailMobile state={state} />;
}
