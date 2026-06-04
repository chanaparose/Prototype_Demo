import type {
  DerivedCardState,
  FactoryOrderRow,
  SortKey,
  TabId,
} from '@/pages/factory-portal/factory-orders/types';

export function matchTab(row: FactoryOrderRow, derived: DerivedCardState, tabId: TabId): boolean {
  if (tabId === 'all') return true;

  const isShipping = row.status === 'SH';

  // PD = PaymentDone — โรงงานต้องยืนยันรับงานและเริ่มผลิต
  const isPendingStart = row.status === 'PD';

  const needsAction =
    isPendingStart ||
    derived.flags.isOverdue ||
    derived.flags.hasRejected ||
    derived.flags.isStaleUpdate ||
    (row.status === 'QC' &&
      [null, 'PD'].includes(row.production_summary?.current_update_status ?? null));

  // WS = รอลูกค้าแนบสลีป, PP = รอลูกค้าชำระเงิน (legacy)
  if (tabId === 'awaiting_customer') return row.status === 'WS' || row.status === 'PP';
  // WA = รอโรงงานยืนยันสลีป → tab เฉพาะ
  if (tabId === 'verify_slip') return row.status === 'WA';
  if (tabId === 'needs_action') return needsAction && !isShipping && row.status !== 'WA';
  if (tabId === 'in_production')
    return ['PR', 'QC'].includes(row.status) && !needsAction && !isShipping;
  if (tabId === 'shipped') return isShipping;
  if (tabId === 'completed') return row.status === 'CP';
  return ['CN', 'CC', 'CL', 'PE'].includes(row.status);
}

export function searchMatch(row: FactoryOrderRow, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    String(row.order_id).toLowerCase().includes(query) ||
    (row.rfq?.title ?? '').toLowerCase().includes(query) ||
    (row.customer?.display_name ?? '').toLowerCase().includes(query)
  );
}

export function sortCompare(a: FactoryOrderRow, b: FactoryOrderRow, key: SortKey): number {
  if (key === 'amount_desc') return b.total_amount - a.total_amount;
  if (key === 'deadline') {
    const da = a.estimated_delivery
      ? new Date(a.estimated_delivery).getTime()
      : Number.POSITIVE_INFINITY;
    const db = b.estimated_delivery
      ? new Date(b.estimated_delivery).getTime()
      : Number.POSITIVE_INFINITY;
    return da - db;
  }
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
