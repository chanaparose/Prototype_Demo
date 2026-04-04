import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { PromotionDetailMobile } from './PromotionDetail.mobile.tsx';
import { PromotionDetailDesktop } from './PromotionDetail.desktop.tsx';

export function PromotionDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <PromotionDetailDesktop /> : <PromotionDetailMobile />;
}

