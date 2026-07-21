import { useMemo } from 'react';
import { useFactoryOrdersData } from '@/pages/factory-portal/factory-orders/useFactoryOrdersData';
import { deriveOrderCardState } from '@/pages/factory-portal/factory-orders/deriveOrderCardState';
import { countByTab } from '@/pages/factory-portal/factory-orders/factoryOrderKpi';
import { useFactoryRfqBoard } from '@/hooks/useFactoryRfqBoard';
import { usePaymentConfig } from '@/hooks/usePaymentConfig';

export type FactoryPendingCounts = {
  /** Open RFQs this factory hasn't quoted yet. */
  newRfqs: number;
  /** Orders needing factory action (confirm & start, overdue, rejected update, stale QC). */
  ordersNeedAction: number;
  /** Orders awaiting the factory's own slip verification (non-escrow mode only). */
  verifySlip: number;
};

/**
 * Pending-work counts for the factory (FT) sidebar badges — reuses the same
 * react-query cache and derive logic as the RFQ board and Orders pages, so the
 * badge number always matches what the linked page actually shows.
 */
export function useFactoryPendingCounts(enabled: boolean): FactoryPendingCounts {
  const { isEscrow } = usePaymentConfig();
  const { rows: rfqRows } = useFactoryRfqBoard(enabled);
  const ordersQ = useFactoryOrdersData(enabled);

  const orderCounts = useMemo(() => {
    const rows = ordersQ.data ?? [];
    if (!enabled || rows.length === 0) return { needs_action: 0, verify_slip: 0 };
    const now = new Date();
    const derived = rows.map((r) => deriveOrderCardState(r, now));
    const byTab = countByTab(rows, derived);
    return { needs_action: byTab.needs_action, verify_slip: byTab.verify_slip };
  }, [ordersQ.data, enabled]);

  const newRfqs = enabled ? rfqRows.filter((r) => !r.hasMyQuote).length : 0;

  return {
    newRfqs,
    ordersNeedAction: orderCounts.needs_action,
    // Non-escrow only: escrow mode routes slip verification to superadmin instead.
    verifySlip: !isEscrow ? orderCounts.verify_slip : 0,
  };
}
