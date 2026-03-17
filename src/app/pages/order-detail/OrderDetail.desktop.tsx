import React from 'react';
import { OrderDetailMobile } from './OrderDetail.mobile';

export function OrderDetailDesktop() {
  return (
    <div className="hidden lg:block">
      <div className="max-w-5xl mx-auto px-6">
        <OrderDetailMobile />
      </div>
    </div>
  );
}

