import React from 'react';
import { OrderDetailMobile } from '@/pages/order-detail/OrderDetail.mobile';

export function OrderDetailDesktop() {
  return (
    <div className='hidden w-full lg:block'>
      <OrderDetailMobile />
    </div>
  );
}
