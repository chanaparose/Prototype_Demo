export const WALLET_CREDIT_TYPES = ['BU', 'SC', 'RF'] as const;
export const WALLET_DEBIT_TYPES = ['DP', 'WD'] as const;

export const WALLET_SUCCESS_STATUSES = ['ST', 'CM', 'SUCCESS', 'COMPLETED'] as const;
export const WALLET_PENDING_STATUSES = ['PT', 'PENDING', 'PROCESSING'] as const;
export const WALLET_FAILED_STATUSES = ['RJ', 'FL', 'FAILED', 'CN', 'CANCELLED'] as const;

export const WALLET_TRANSACTION_TYPE_LABELS: Record<string, string> = {
  DP: 'ชำระมัดจำ',
  WD: 'ถอนเงิน',
  BU: 'รับชำระจากออเดอร์',
  SC: 'รับโอนจากระบบ (Settlement)',
  RF: 'คืนเงิน',
};

export const WALLET_STATUS_LABELS: Record<string, string> = {
  ST: 'สำเร็จ',
  CM: 'สำเร็จ',
  SUCCESS: 'สำเร็จ',
  COMPLETED: 'สำเร็จ',
  PT: 'รอดำเนินการ',
  PENDING: 'รอดำเนินการ',
  PROCESSING: 'กำลังดำเนินการ',
  RJ: 'ถูกปฏิเสธ',
  FL: 'ล้มเหลว',
  FAILED: 'ล้มเหลว',
  CN: 'ยกเลิก',
  CANCELLED: 'ยกเลิก',
};

export function isWalletCreditType(type: string): boolean {
  const normalized = type.toUpperCase();
  if (WALLET_CREDIT_TYPES.includes(normalized as (typeof WALLET_CREDIT_TYPES)[number])) return true;
  if (WALLET_DEBIT_TYPES.includes(normalized as (typeof WALLET_DEBIT_TYPES)[number])) return false;
  return true;
}

export function isWalletPendingStatus(status: string): boolean {
  return WALLET_PENDING_STATUSES.includes(status.toUpperCase() as (typeof WALLET_PENDING_STATUSES)[number]);
}
