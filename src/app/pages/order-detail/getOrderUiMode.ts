/**
 * ORDER_DETAIL_PP_STATE_FE §2 — derive UI from API `order.status` only (never from production_updates.length).
 */

export type LockReason =
  | 'PENDING_DEPOSIT'
  | 'DEPOSIT_EXPIRED'
  | 'ORDER_CANCELLED'
  | 'UNKNOWN';

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
    case 'PP':
      return {
        productionLocked: true,
        lockReason: 'PENDING_DEPOSIT',
        payableNow: true,
        readOnly: false,
        showActionBanner: true,
      };
    case 'PE':
      return {
        productionLocked: true,
        lockReason: 'DEPOSIT_EXPIRED',
        payableNow: true,
        readOnly: false,
        showActionBanner: true,
      };
    case 'CN':
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
