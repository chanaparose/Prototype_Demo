import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { FactoryIdeasMobile } from './FactoryIdeas.mobile.tsx';
import { FactoryIdeasDesktop } from './FactoryIdeas.desktop.tsx';

export function FactoryIdeas() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <FactoryIdeasDesktop /> : <FactoryIdeasMobile />;
}

