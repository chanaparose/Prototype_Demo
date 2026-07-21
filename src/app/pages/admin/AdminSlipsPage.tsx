import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';

/**
 * Dedicated superadmin queue for orders awaiting slip verification (status WA).
 * Reuses the orders page locked to the verify-slip tab so pending slips are
 * reachable from their own sidebar entry instead of being buried in Orders.
 */
export function AdminSlipsPage() {
  return <AdminOrdersPage lockedTab='verify_slip' title='ยืนยันสลิปการชำระเงิน' />;
}
