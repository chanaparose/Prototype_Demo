import React from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { type Rfq, type Order } from '@/stores/types';
import { getRfqFilterId } from '@/components/features/rfq-and-orders/utils';
import {
  type RfqFilterId,
  type OrderFilterId,
} from '@/components/features/rfq-and-orders/constants';
import { useRfqListQuery } from '@/domain/rfq/queries/useRfqListQuery';
import { isPendingPaymentStatus } from '@/domain/order/status';
import { rfqKeys } from '@/lib/queryKeys';

type PrimaryTab = 'rfq' | 'orders';

type InitialState = {
  primaryTab?: PrimaryTab;
  rfqFilter?: RfqFilterId;
  orderFilter?: OrderFilterId;
};

export function useRfqAndOrdersState(initial?: InitialState) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get('tab') as PrimaryTab | null;
  const primaryTab: PrimaryTab =
    tabFromUrl === 'orders' || tabFromUrl === 'rfq' ? tabFromUrl : (initial?.primaryTab ?? 'rfq');

  const setPrimaryTab = (tab: PrimaryTab) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    }, { replace: true });
  };
  const [rfqFilter, setRfqFilter] = React.useState<RfqFilterId>(initial?.rfqFilter ?? 'pending');

  const ORDER_FILTER_VALUES: OrderFilterId[] = ['pending_payment', 'in_production', 'shipped', 'completed', 'disputed', 'cancelled_expired'];
  const orderFilterFromUrl = searchParams.get('order_filter') as OrderFilterId | null;
  const orderFilter: OrderFilterId = ORDER_FILTER_VALUES.includes(orderFilterFromUrl as OrderFilterId)
    ? (orderFilterFromUrl as OrderFilterId)
    : (initial?.orderFilter ?? 'pending_payment');

  const setOrderFilter = (filter: OrderFilterId) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('order_filter', filter);
      return p;
    }, { replace: true });
  };

  const rfqListQuery = useRfqListQuery();
  const result = rfqListQuery.data ?? { rfqs: [], orders: [] };

  const rfqs: Rfq[] = isAuthenticated ? result.rfqs : [];
  const orders: Order[] = isAuthenticated ? result.orders : [];

  const loading = isAuthenticated && rfqListQuery.isLoading;
  const error = rfqListQuery.error instanceof Error ? rfqListQuery.error.message : null;

  const filteredRfqs = React.useMemo(() => {
    return rfqs.filter((r) => {
      if (r.status === 'completed') return false;
      if (rfqFilter === 'cancelled_expired') {
        return r.status === 'cancelled' || r.status === 'expired';
      }
      const fid = getRfqFilterId(r.status);
      return fid === rfqFilter;
    });
  }, [rfqFilter, rfqs]);

  /**
   * order อยู่ใน tab "จัดส่ง" เมื่อ:
   * 1. status === 'shipped' (order status = SH) หรือ
   * 2. currentStepId >= 4 (step จัดส่ง CD แล้ว — BE ส่ง 4 แม้ step 5 = IP รอยืนยัน)
   */
  const isShippingOrder = React.useCallback(
    (o: Order) =>
      o.status !== 'completed' &&
      (o.status === 'shipped' || (o.currentStepId != null && o.currentStepId >= 4)),
    [],
  );

  const filteredOrders = React.useMemo(() => {
    if (orderFilter === 'shipped') return orders.filter(isShippingOrder);
    if (orderFilter === 'in_production')
      return orders.filter((o) => o.status === 'in_production' && !isShippingOrder(o));
    if (orderFilter === 'pending_payment')
      return orders.filter((o) => isPendingPaymentStatus(o.status));
    // "ขอคืนเงิน" tab รวมทั้งคำขอที่เปิดอยู่ (disputed) และที่คืนเงินสำเร็จแล้ว (refunded)
    if (orderFilter === 'disputed')
      return orders.filter((o) => o.status === 'disputed' || o.status === 'refunded');
    return orders.filter((o) => o.status === orderFilter);
  }, [orderFilter, orders, isShippingOrder]);

  const rfqTagCounts = React.useMemo(
    () => ({
      pending: rfqs.filter((r) => r.status === 'pending').length,
      has_quote: rfqs.filter((r) => r.status === 'offers_received' || r.status === 'reviewing')
        .length,
      cancelled_expired: rfqs.filter((r) => r.status === 'cancelled' || r.status === 'expired')
        .length,
    }),
    [rfqs],
  );

  const orderTagCounts = React.useMemo(
    () => ({
      pendingPayment: orders.filter((o) => isPendingPaymentStatus(o.status)).length,
      inProduction: orders.filter((o) => o.status === 'in_production' && !isShippingOrder(o))
        .length,
      shipped: orders.filter(isShippingOrder).length,
      completed: orders.filter((o) => o.status === 'completed').length,
      disputed: orders.filter((o) => o.status === 'disputed' || o.status === 'refunded').length,
      cancelledExpired: orders.filter((o) => o.status === 'cancelled_expired').length,
    }),
    [orders, isShippingOrder],
  );

  return {
    primaryTab,
    setPrimaryTab,
    rfqFilter,
    setRfqFilter,
    orderFilter,
    setOrderFilter,
    filteredRfqs,
    filteredOrders,
    rfqTagCounts,
    orderTagCounts,
    rfqs,
    orders,
    loading,
    error,
    refetch: async () => {
      if (!isAuthenticated) return;
      await queryClient.invalidateQueries({ queryKey: rfqKeys.list() });
    },
  };
}
