import React from 'react';
import { OrderDetailMobile } from './OrderDetail.mobile';
import { useOrderDetail } from './OrderDetailContext';
import { formatDateTh } from '../../components/features/order-detail';

export function OrderDetailDesktop() {
  const { mappedOrder: order, rfq } = useOrderDetail();

  return (
    <div className="hidden lg:block max-w-6xl mx-auto px-6 py-4">
      <div className="space-y-4">
        <main className="w-full space-y-4">
          <header>
            <h1 className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
              {rfq?.title ?? order.projectName}
            </h1>
            <p className="text-xs text-gray-500">
              คำสั่งซื้อ #{order.id} · สร้างเมื่อ {formatDateTh(order.createdAt)}
            </p>
          </header>
          <OrderDetailMobile />
        </main>
      </div>
    </div>
  );
}
