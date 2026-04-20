import React from 'react';
import { useParams } from 'react-router';
import { useData } from '../../contexts/DataContext';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { OrderDetailMobile } from './OrderDetail.mobile.tsx';
import { OrderDetailDesktop } from './OrderDetail.desktop.tsx';
import { OrderDetailProvider } from './OrderDetailContext';

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

