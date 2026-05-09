import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { ProductDetailMobile } from './ProductDetail.mobile';
import { ProductDetailDesktop } from './ProductDetail.desktop.tsx';

export function ProductDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <ProductDetailDesktop /> : <ProductDetailMobile />;
}

