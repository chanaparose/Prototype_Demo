import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useFactoryProfile } from '../../hooks/useFactoryProfile';
import { FactoryProfileMobile } from './FactoryProfile.mobile';
import { FactoryProfileDesktop } from './FactoryProfile.desktop';

export function FactoryProfile() {
  const isDesktop = useIsDesktop();
  const state = useFactoryProfile();

  if (isDesktop) {
    return <FactoryProfileDesktop state={state} />;
  }

  return <FactoryProfileMobile state={state} />;
}

