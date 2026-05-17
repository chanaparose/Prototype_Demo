import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { RFQDetailMobile } from '@/pages/rfq-detail/RFQDetail.mobile.tsx';
import { RFQDetailDesktop } from '@/pages/rfq-detail/RFQDetail.desktop.tsx';

export function RFQDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <RFQDetailDesktop /> : <RFQDetailMobile />;
}
