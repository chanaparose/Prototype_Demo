import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { ProductDetailMobile } from '@/pages/product-detail/ProductDetail.mobile';
import { ProductDetailDesktop } from '@/pages/product-detail/ProductDetail.desktop.tsx';

export function ProductDetail() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <ProductDetailDesktop /> : <ProductDetailMobile />;
}
