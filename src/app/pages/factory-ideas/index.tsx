import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useManualApiPageGate } from '@/hooks/useManualApiPageGate';
import { ManualApiDevGate } from '@/components/shared/ManualApiDevGate';
import { FactoryIdeasMobile } from '@/pages/factory-ideas/FactoryIdeas.mobile.tsx';
import { FactoryIdeasDesktop } from '@/pages/factory-ideas/FactoryIdeas.desktop.tsx';

export function FactoryIdeas() {
  const isDesktop = useIsDesktop();
  const { showGate, setPageApisReady } = useManualApiPageGate();

  if (showGate) {
    return (
      <ManualApiDevGate
        pageLabel='แนะนำโรงงาน / Factory Ideas'
        onLoad={() => setPageApisReady(true)}
      />
    );
  }

  return isDesktop ? <FactoryIdeasDesktop /> : <FactoryIdeasMobile />;
}
