/** Order status codes aligned with tryly-server `domain.OrderStatus*`. */

export type AdminOrderStatusBadge = {
  label: string;
  variant: 'default' | 'pending' | 'info' | 'success' | 'error' | 'warning' | 'active' | 'outline';
};

export type AdminOrderStatusTab =
  | 'all'
  | 'verify_slip'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refund';

const STATUS_LABELS: Record<string, AdminOrderStatusBadge> = {
  WS: { label: 'รอแนบสลิป', variant: 'pending' },
  WA: { label: 'รอยืนยันสลิป', variant: 'warning' },
  PP: { label: 'รอชำระเงิน', variant: 'pending' },
  PE: { label: 'หมดกำหนดชำระ', variant: 'error' },
  PD: { label: 'ชำระแล้ว รอผลิต', variant: 'info' },
  PR: { label: 'กำลังผลิต', variant: 'active' },
  WF: { label: 'รอชำระส่วนที่เหลือ', variant: 'pending' },
  QC: { label: 'ตรวจสอบคุณภาพ', variant: 'info' },
  SH: { label: 'จัดส่งแล้ว', variant: 'info' },
  DL: { label: 'ส่งมอบแล้ว', variant: 'info' },
  AC: { label: 'ลูกค้ายืนยันรับ', variant: 'success' },
  CP: { label: 'เสร็จสิ้น', variant: 'success' },
  // Cancelled family
  CN: { label: 'ยกเลิกออเดอร์', variant: 'error' },
  CC: { label: 'ยกเลิกออเดอร์', variant: 'error' },
  CL: { label: 'ยกเลิกออเดอร์', variant: 'error' },
  // Refund request
  RJ: { label: 'ขอคืนเงิน', variant: 'warning' },
  // Legacy aliases still seen in older rows / UI filters
  CM: { label: 'เสร็จสิ้น', variant: 'success' },
  OP: { label: 'รอดำเนินการ', variant: 'pending' },
  CA: { label: 'ยกเลิกออเดอร์', variant: 'error' },
};

export function normalizeAdminOrderStatus(status: string | null | undefined): string {
  return String(status ?? '')
    .trim()
    .toUpperCase();
}

export function getAdminOrderStatusMeta(status: string | null | undefined): AdminOrderStatusBadge {
  const code = normalizeAdminOrderStatus(status);
  return STATUS_LABELS[code] ?? { label: code || 'ไม่ทราบสถานะ', variant: 'outline' };
}

export function inferAdminOrderStatusTab(status: string | null | undefined): AdminOrderStatusTab {
  const s = normalizeAdminOrderStatus(status);
  if (s === 'WA') return 'verify_slip';
  if (s === 'CP' || s === 'CM' || s === 'DONE' || s === 'COMPLETED' || s === 'AC') return 'completed';
  if (s === 'CL' || s === 'CC' || s === 'CN' || s === 'CA' || s === 'CANCELLED') return 'cancelled';
  if (s === 'RJ') return 'refund';
  if (s === 'WS' || s === 'PP' || s === 'PE' || s === 'OP' || s === 'PENDING') return 'pending';
  return 'processing';
}
