export const HISTORY_STATUSES = ['completed', 'cancelled', 'expired'] as const;
export const STATUS_LABEL: Record<string, string> = {
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
  expired: 'หมดอายุ',
};
