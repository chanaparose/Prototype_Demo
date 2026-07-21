import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';

/**
 * Dedicated superadmin queue for payment slips. Two tabs:
 *   • รอตรวจสลิป (WA)        — สลิปที่ลูกค้าแนบแล้วรอ admin ตรวจ
 *   • รอลูกค้าแนบใหม่ (WS+RJ) — สลิปที่ admin reject ไปแล้ว รอลูกค้าแนบสลิปใหม่
 * Reuses the orders page scoped to slip-related tabs so slips are reachable from
 * their own sidebar entry instead of being buried in Orders.
 */
export function AdminSlipsPage() {
  return (
    <AdminOrdersPage
      tabScope={['verify_slip', 'slip_rejected']}
      title='ยืนยันสลิปการชำระเงิน'
    />
  );
}
