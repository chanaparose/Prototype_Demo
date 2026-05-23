import React from 'react';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { IdeaDetailMobile } from '@/pages/idea-detail/IdeaDetail.mobile.tsx';
import { IdeaDetailDesktop } from '@/pages/idea-detail/IdeaDetail.desktop.tsx';

export function IdeaDetail() {
  const { render } = useResponsiveRender();
  return render(<IdeaDetailMobile />, <IdeaDetailDesktop />);
}
