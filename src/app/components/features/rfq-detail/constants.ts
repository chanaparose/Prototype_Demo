export const HISTORY_STATUSES = ['completed', 'cancelled', 'expired'] as const;
export const STATUS_LABEL: Record<string, string> = {
  /** RFQ ปิดแล้วหลังยอมรับใบเสนอราคา (สถานะ CL) */
  completed: 'ปิดคำขอแล้ว',
  cancelled: 'ยกเลิก',
  expired: 'หมดอายุ',
};
