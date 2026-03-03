import React, { useState, useMemo } from 'react';
import { rfqs, orders } from '../data/mockData';
import {
  RfqSection,
  OrderSection,
  getRfqFilterId,
} from '../components/features/rfq-and-orders';
import type { RfqFilterId, OrderFilterId } from '../components/features/rfq-and-orders';
import { PRIMARY_BG } from '../components/features/rfq-and-orders/constants';

export function RfqAndOrders() {
  const [primaryTab, setPrimaryTab] = useState<'rfq' | 'orders'>('rfq');
  const [rfqFilter, setRfqFilter] = useState<RfqFilterId>('pending');
  const [orderFilter, setOrderFilter] = useState<OrderFilterId>('in_production');

  const filteredRfqs = useMemo(() => {
    return rfqs.filter((r) => {
      if (r.status === 'completed') return false;
      if (rfqFilter === 'cancelled_expired')
        return r.status === 'cancelled' || r.status === 'expired';
      const fid = getRfqFilterId(r.status);
      return fid === rfqFilter;
    });
  }, [rfqFilter]);

  const filteredOrders = orders.filter((o) => o.status === orderFilter);

  const rfqTagCounts = useMemo(
    () => ({
      pending: rfqs.filter((r) => r.status === 'pending').length,
      has_quote: rfqs.filter(
        (r) => r.status === 'offers_received' || r.status === 'reviewing'
      ).length,
      cancelled_expired: rfqs.filter(
        (r) => r.status === 'cancelled' || r.status === 'expired'
      ).length,
    }),
    []
  );

  const orderTagCounts = useMemo(
    () => ({
      inProduction: orders.filter((o) => o.status === 'in_production').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    }),
    []
  );

  return (
    <div className="pb-4 flex flex-col min-h-full pb-20">
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              คำขอ
            </p>
            <h1 className="text-gray-900" style={{ fontWeight: 700 }}>
              RFQ & คำสั่งซื้อ
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 flex-1 flex flex-col">
        {/* Primary Tabs: RFQ ของฉัน | คำสั่งซื้อ */}
        <div
          className="flex p-1 rounded-2xl mb-4"
          style={{ background: PRIMARY_BG }}
        >
          <button
            onClick={() => setPrimaryTab('rfq')}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: primaryTab === 'rfq' ? '#fff' : 'transparent',
              color: primaryTab === 'rfq' ? '#6C47FF' : '#6B7280',
              boxShadow:
                primaryTab === 'rfq' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            RFQ ของฉัน
          </button>
          <button
            onClick={() => setPrimaryTab('orders')}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: primaryTab === 'orders' ? '#fff' : 'transparent',
              color: primaryTab === 'orders' ? '#6C47FF' : '#6B7280',
              boxShadow:
                primaryTab === 'orders'
                  ? '0 2px 8px rgba(0,0,0,0.06)'
                  : 'none',
            }}
          >
            คำสั่งซื้อ
          </button>
        </div>

        {primaryTab === 'rfq' ? (
          <RfqSection
            rfqFilter={rfqFilter}
            setRfqFilter={setRfqFilter}
            filteredRfqs={filteredRfqs}
            rfqTagCounts={rfqTagCounts}
          />
        ) : (
          <OrderSection
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            filteredOrders={filteredOrders}
            orderTagCounts={orderTagCounts}
          />
        )}
      </div>
    </div>
  );
}
