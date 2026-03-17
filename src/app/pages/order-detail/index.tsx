import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { OrderDetailMobile } from './OrderDetail.mobile.tsx';
import { OrderDetailDesktop } from './OrderDetail.desktop.tsx';

export function OrderDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <OrderDetailDesktop /> : <OrderDetailMobile />;
}

