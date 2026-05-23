import React from 'react';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { ProductDetailMobile } from '@/pages/product-detail/ProductDetail.mobile';
import { ProductDetailDesktop } from '@/pages/product-detail/ProductDetail.desktop.tsx';

export function ProductDetail() {
  const { render } = useResponsiveRender();
  return render(<ProductDetailMobile />, <ProductDetailDesktop />);
}
