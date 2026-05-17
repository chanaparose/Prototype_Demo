import React from 'react';
import { useParams } from 'react-router';
import { useData } from '@/stores';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { OrderDetailMobile } from '@/pages/order-detail/OrderDetail.mobile';
import { OrderDetailDesktop } from '@/pages/order-detail/OrderDetail.desktop';
import { OrderDetailProvider } from '@/pages/order-detail/OrderDetailContext';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const isDesktop = useIsDesktop();
  if (!id) return null;
  return (
    <OrderDetailProvider orderId={id} factories={data.factories}>
      {isDesktop ? <OrderDetailDesktop /> : <OrderDetailMobile />}
    </OrderDetailProvider>
  );
}
