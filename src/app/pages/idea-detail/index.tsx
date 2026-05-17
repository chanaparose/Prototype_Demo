import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { IdeaDetailMobile } from '@/pages/idea-detail/IdeaDetail.mobile.tsx';
import { IdeaDetailDesktop } from '@/pages/idea-detail/IdeaDetail.desktop.tsx';

export function IdeaDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <IdeaDetailDesktop /> : <IdeaDetailMobile />;
}
