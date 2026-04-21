import React from 'react';
import { OrderDetailMobile } from './OrderDetail.mobile';
import { useOrderDetail } from './OrderDetailContext';
import { RfqReferenceCard, formatDateTh } from '../../components/features/order-detail';

export function OrderDetailDesktop() {
  const { mappedOrder: order, rfq } = useOrderDetail();

  return (
    <div className="hidden lg:block max-w-6xl mx-auto px-6 py-4">
      <div className="grid grid-cols-12 gap-6">
        <main className="col-span-12 lg:col-span-8 space-y-4">
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
        <aside className="col-span-12 lg:col-span-4">
          {rfq ? <RfqReferenceCard rfq={rfq} variant="panel" /> : null}
        </aside>
      </div>
    </div>
  );
}

