import React from 'react';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { RFQDetailMobile } from '@/pages/rfq-detail/RFQDetail.mobile.tsx';
import { RFQDetailDesktop } from '@/pages/rfq-detail/RFQDetail.desktop.tsx';

export function RFQDetail() {
  const { render } = useResponsiveRender();
  return render(<RFQDetailMobile />, <RFQDetailDesktop />);
}
