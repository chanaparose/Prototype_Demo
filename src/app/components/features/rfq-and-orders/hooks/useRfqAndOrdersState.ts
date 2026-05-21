import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { type Rfq, type Order } from '@/stores/types';
import { getRfqFilterId } from '@/components/features/rfq-and-orders/utils';
import { type RfqFilterId, type OrderFilterId } from '@/components/features/rfq-and-orders/constants';
import { useRfqListQuery } from '@/domain/rfq/queries/useRfqListQuery';
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

  const [primaryTab, setPrimaryTab] = React.useState<PrimaryTab>(initial?.primaryTab ?? 'rfq');
  const [rfqFilter, setRfqFilter] = React.useState<RfqFilterId>(initial?.rfqFilter ?? 'pending');
  const [orderFilter, setOrderFilter] = React.useState<OrderFilterId>(
    initial?.orderFilter ?? 'pending_payment',
  );

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

  const filteredOrders = React.useMemo(
    () => orders.filter((o) => o.status === orderFilter),
    [orderFilter, orders],
  );

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
      pendingPayment: orders.filter((o) => o.status === 'pending_payment').length,
      inProduction: orders.filter((o) => o.status === 'in_production').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelledExpired: orders.filter((o) => o.status === 'cancelled_expired').length,
    }),
    [orders],
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
