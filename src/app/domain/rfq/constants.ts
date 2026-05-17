export const HISTORY_STATUSES = ['completed', 'cancelled', 'expired'] as const;

export const CLOSEABLE_STATUSES = new Set(['pending', 'offers_received', 'reviewing']);

export const STATUS_LABEL: Record<string, string> = {
  completed: 'ปิดคำขอแล้ว',
  cancelled: 'ยกเลิก',
  expired: 'หมดอายุ',
};

/** รหัสสถานะใบเสนอราคา (API) — มุมมองลูกค้า / ประวัติ */
export const QUOTATION_STATUS_LABEL: Record<string, string> = {
  PD: 'รอการตอบรับ',
  AC: 'ยืนยันแล้ว',
  RJ: 'ปฏิเสธ',
  EX: 'หมดอายุ',
};

/** รหัสสถานะใบเสนอราคา — มุมมองโรงงาน (รายการใบเสนอราคา) */
export const QUOTATION_STATUS_LABEL_FACTORY: Record<string, string> = {
  PD: 'รอลูกค้าตัดสินใจ',
  AC: 'ลูกค้ารับแล้ว',
  RJ: 'ปิด / ถูกปฏิเสธ',
  EX: 'หมดอายุ',
};

export const QUOTATION_STATUS_BADGE_FACTORY: Record<string, { bg: string; color: string }> = {
  PD: { bg: 'rgba(162,56,255,0.12)', color: 'var(--brand-indigo)' },
  AC: { bg: 'rgba(16,185,129,0.12)', color: 'var(--status-success)' },
  RJ: { bg: 'rgba(239,68,68,0.10)', color: 'var(--status-danger-deep)' },
  EX: { bg: 'rgba(107,114,128,0.12)', color: 'var(--text-muted)' },
};
