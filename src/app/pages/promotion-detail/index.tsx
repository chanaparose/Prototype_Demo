import React from 'react';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { PromotionDetailMobile } from '@/pages/promotion-detail/PromotionDetail.mobile.tsx';
import { PromotionDetailDesktop } from '@/pages/promotion-detail/PromotionDetail.desktop.tsx';

export function PromotionDetail() {
  const { render } = useResponsiveRender();
  return render(<PromotionDetailMobile />, <PromotionDetailDesktop />);
}
