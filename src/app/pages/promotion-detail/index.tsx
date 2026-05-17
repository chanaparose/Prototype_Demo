import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { PromotionDetailMobile } from '@/pages/promotion-detail/PromotionDetail.mobile.tsx';
import { PromotionDetailDesktop } from '@/pages/promotion-detail/PromotionDetail.desktop.tsx';

export function PromotionDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <PromotionDetailDesktop /> : <PromotionDetailMobile />;
}
