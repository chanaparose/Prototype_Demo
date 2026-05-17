import React from 'react';
import { OrderDetailMobile } from '@/pages/order-detail/OrderDetail.mobile';

export function OrderDetailDesktop() {
  return (
    <div className='hidden lg:block max-w-6xl mx-auto px-6 py-4'>
      <div className='space-y-4'>
        <main className='w-full space-y-4'>
          <OrderDetailMobile />
        </main>
      </div>
    </div>
  );
}
