import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { IdeaDetailMobile } from './IdeaDetail.mobile.tsx';
import { IdeaDetailDesktop } from './IdeaDetail.desktop.tsx';

export function IdeaDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <IdeaDetailDesktop /> : <IdeaDetailMobile />;
}

