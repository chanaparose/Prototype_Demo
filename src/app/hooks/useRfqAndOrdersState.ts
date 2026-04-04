import React from 'react';
import { useData } from '../contexts/DataContext';
import {
  getRfqFilterId,
} from '../components/features/rfq-and-orders';
import type {
  RfqFilterId,
  OrderFilterId,
} from '../components/features/rfq-and-orders';

type PrimaryTab = 'rfq' | 'orders';

type InitialState = {
  primaryTab?: PrimaryTab;
  rfqFilter?: RfqFilterId;
  orderFilter?: OrderFilterId;
};

export function useRfqAndOrdersState(initial?: InitialState) {
  const data = useData();
  const rfqs = data.rfqs;
  const orders = data.orders;

  const [primaryTab, setPrimaryTab] = React.useState<PrimaryTab>(
    initial?.primaryTab ?? 'rfq',
  );

  // Unified filters for both mobile & desktop
  const [rfqFilter, setRfqFilter] = React.useState<RfqFilterId>(
    initial?.rfqFilter ?? 'pending',
  );
  const [orderFilter, setOrderFilter] = React.useState<OrderFilterId>(
    initial?.orderFilter ?? 'in_production',
  );

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
      has_quote: rfqs.filter(
        (r) => r.status === 'offers_received' || r.status === 'reviewing',
      ).length,
      cancelled_expired: rfqs.filter(
        (r) => r.status === 'cancelled' || r.status === 'expired',
      ).length,
    }),
    [rfqs],
  );

  const orderTagCounts = React.useMemo(
    () => ({
      inProduction: orders.filter((o) => o.status === 'in_production').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    }),
    [orders],
  );

  return {
    // tabs
    primaryTab,
    setPrimaryTab,

    // filters
    rfqFilter,
    setRfqFilter,
    orderFilter,
    setOrderFilter,

    // filtered data
    filteredRfqs,
    filteredOrders,

    // tag counts
    rfqTagCounts,
    orderTagCounts,

    // raw data (if needed by UI)
    rfqs,
    orders,
  };
}

