import React from 'react';
import { useParams } from 'react-router';
import { useData } from '@/stores/useDataStore';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { OrderDetailMobile } from '@/pages/order-detail/OrderDetail.mobile';
import { OrderDetailDesktop } from '@/pages/order-detail/OrderDetail.desktop';
import { OrderDetailProvider } from '@/pages/order-detail/OrderDetailContext';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const { render } = useResponsiveRender();
  if (!id) return null;
  return (
    <OrderDetailProvider orderId={id} factories={data.factories}>
      {render(<OrderDetailMobile />, <OrderDetailDesktop />)}
    </OrderDetailProvider>
  );
}
