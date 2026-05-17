import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useFactoryProfile } from '@/components/features/factory/hooks/useFactoryProfile';
import { FactoryDetailMobile } from '@/pages/factories/FactoryDetail.mobile';
import { FactoryDetailDesktop } from '@/pages/factories/FactoryDetail.desktop';

export function FactoryDetail() {
  const isDesktop = useIsDesktop();
  const state = useFactoryProfile();

  if (isDesktop) {
    return <FactoryDetailDesktop state={state} />;
  }

  return <FactoryDetailMobile state={state} />;
}
