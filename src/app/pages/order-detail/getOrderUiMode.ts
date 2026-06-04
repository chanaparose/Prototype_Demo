/**
 * ORDER_DETAIL_PP_STATE_FE §2 — derive UI from API `order.status` only (never from production_updates.length).
 */

export type LockReason = 'WAITING_SLIP' | 'WAITING_SLIP_APPROVAL' | 'PENDING_DEPOSIT' | 'DEPOSIT_EXPIRED' | 'ORDER_CANCELLED' | 'UNKNOWN';

export type OrderUiMode = {
  productionLocked: boolean;
  lockReason?: LockReason;
  payableNow: boolean;
  readOnly: boolean;
  showActionBanner: boolean;
};

export function getOrderUiMode(status: string): OrderUiMode {
  const s = String(status ?? '').toUpperCase();
  switch (s) {
    case 'WS':
      return {
        productionLocked: true,
        lockReason: 'WAITING_SLIP',
        payableNow: true,
        readOnly: false,
        showActionBanner: true,
      };
    case 'WA':
      return {
        productionLocked: true,
        lockReason: 'WAITING_SLIP_APPROVAL',
        payableNow: false,
        readOnly: false,
        showActionBanner: true,
      };
    case 'PP':
      return {
        productionLocked: true,
        lockReason: 'PENDING_DEPOSIT',
        payableNow: true,
        readOnly: false,
        showActionBanner: true,
      };
    case 'PE':
      // PE = หมดกำหนดชำระแล้ว ไม่มี grace period — order จะถูก auto-cancel เป็น CL โดย background job
      return {
        productionLocked: true,
        lockReason: 'DEPOSIT_EXPIRED',
        payableNow: false,
        readOnly: true,
        showActionBanner: false,
      };
    case 'CN':
    case 'CC':
    case 'CL':
      return {
        productionLocked: true,
        lockReason: 'ORDER_CANCELLED',
        payableNow: false,
        readOnly: true,
        showActionBanner: false,
      };
    case 'CP':
      return {
        productionLocked: false,
        payableNow: false,
        readOnly: true,
        showActionBanner: false,
      };
    case 'PD':
    case 'PR':
    case 'QC':
    case 'SH':
    case 'WF':
      return {
        productionLocked: false,
        payableNow: false,
        readOnly: false,
        showActionBanner: false,
      };
    default:
      return {
        productionLocked: true,
        lockReason: 'UNKNOWN',
        payableNow: false,
        readOnly: true,
        showActionBanner: false,
      };
  }
}
