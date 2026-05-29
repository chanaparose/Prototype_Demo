import type {
  DerivedCardState,
  FactoryOrderRow,
  SortKey,
  TabId,
} from '@/pages/factory-portal/factory-orders/types';

export function matchTab(row: FactoryOrderRow, derived: DerivedCardState, tabId: TabId): boolean {
  if (tabId === 'all') return true;

  // step_id >= 4 (step จัดส่ง (4) ดำเนินการแล้ว หรือ step 5 (รอยืนยัน) active)
  // เมื่อ step 4 = CD, BE auto-progress step 5 → IP ทำให้ current_step_id = 5
  const isShipping = (row.production_summary?.current_step_id ?? 0) >= 4;

  // PD = PaymentDone — โรงงานต้องยืนยันรับงานและเริ่มผลิต
  const isPendingStart = row.status === 'PD';

  const needsAction =
    isPendingStart ||
    derived.flags.isOverdue ||
    derived.flags.hasRejected ||
    derived.flags.isStaleUpdate ||
    (row.status === 'QC' &&
      [null, 'PD'].includes(row.production_summary?.current_update_status ?? null));

  if (tabId === 'needs_action') return needsAction && !isShipping;
  if (tabId === 'in_production')
    return ['PR', 'QC'].includes(row.status) && !needsAction && !isShipping;
  if (tabId === 'awaiting_customer') return row.status === 'PP';
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
