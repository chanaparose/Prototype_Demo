import React from 'react';
import { PromotionDetailMobile } from './PromotionDetail.mobile';

export function PromotionDetailDesktop() {
  return (
    <div className="hidden lg:block">
      <div className="max-w-4xl mx-auto px-6">
        <PromotionDetailMobile />
      </div>
    </div>
  );
}

