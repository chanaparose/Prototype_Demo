import React from 'react';
import { OrderDetailMobile } from '@/pages/order-detail/OrderDetail.mobile';

export function OrderDetailDesktop() {
  return (
    <div className='hidden lg:block'>
      <div className='mx-auto max-w-[1600px] px-8 py-5 2xl:px-10'>
        <OrderDetailMobile />
      </div>
    </div>
  );
}
