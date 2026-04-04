import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { RFQDetailMobile } from './RFQDetail.mobile.tsx';
import { RFQDetailDesktop } from './RFQDetail.desktop.tsx';

export function RFQDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <RFQDetailDesktop /> : <RFQDetailMobile />;
}

