import React from 'react';
import { ProductDetailMobile } from './ProductDetail.mobile';

export function ProductDetailDesktop() {
  return (
    <div className="hidden lg:block">
      <div className="max-w-4xl mx-auto px-6">
        <ProductDetailMobile />
      </div>
    </div>
  );
}

