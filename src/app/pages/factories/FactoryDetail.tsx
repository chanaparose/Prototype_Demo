import React from 'react';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { useFactoryProfile } from '@/components/features/factory/hooks/useFactoryProfile';
import { FactoryDetailMobile } from '@/pages/factories/FactoryDetail.mobile';
import { FactoryDetailDesktop } from '@/pages/factories/FactoryDetail.desktop';

export function FactoryDetail() {
  const { render } = useResponsiveRender();
  const state = useFactoryProfile();

  return render(
    <FactoryDetailMobile state={state} />,
    <FactoryDetailDesktop state={state} />
  );
}
