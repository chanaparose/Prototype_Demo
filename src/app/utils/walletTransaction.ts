/** Order-related wallet tx — show as plain history row, link to order detail */
export const ORDER_HISTORY_TX_TYPES = new Set(['BU', 'SE']);

export type WalletTransactionView = {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit';
  isOrderHistory: boolean;
  orderHref: string | null;
};

function resolveOrderId(row: Record<string, unknown>): number | null {
  const txType = String(row.transaction_type ?? row.type ?? '').toUpperCase();
  const refType = String(row.reference_type ?? '').toLowerCase();
  const refId = Number(row.reference_id ?? 0);
  if (refType === 'order' && Number.isFinite(refId) && refId > 0) return refId;

  const orderId = Number(row.order_id ?? 0);
  if (Number.isFinite(orderId) && orderId > 0) return orderId;

  if (ORDER_HISTORY_TX_TYPES.has(txType) && Number.isFinite(refId) && refId > 0) return refId;

  return null;
}

export function mapWalletTransactionLabel(row: Record<string, unknown>): string {
  const txType = String(row.transaction_type ?? row.type ?? '').toUpperCase();
  const orderId = resolveOrderId(row);

  if (ORDER_HISTORY_TX_TYPES.has(txType)) {
    if (orderId != null) return `มีการสั่งซื้อ · คำสั่งซื้อ #${orderId}`;
    return 'มีการสั่งซื้อ';
  }

  if (txType === 'DP') return 'มัดจำ';
  if (txType === 'WD') return 'ถอนเงิน';
  if (txType === 'SC') return 'รับเงิน';
  if (txType === 'RF') return 'คืนเงิน';
  return String(row.description ?? row.type_label ?? row.label ?? row.note ?? 'รายการ');
}

export function parseWalletTransaction(
  row: Record<string, unknown>,
  isCustomer: boolean,
): WalletTransactionView {
  const txTypeRaw = String(row.transaction_type ?? row.type ?? '').toUpperCase();
  const amount = Number(row.amount ?? 0);
  const direction = String(row.direction ?? '').toLowerCase();
  const orderId = resolveOrderId(row);
  const isOrderHistory = ORDER_HISTORY_TX_TYPES.has(txTypeRaw);

  let type: 'credit' | 'debit';
  if (amount < 0) type = 'debit';
  else if (amount > 0) type = 'credit';
  else if (isCustomer && txTypeRaw === 'BU') type = 'debit';
  else if (direction === 'in') type = 'credit';
  else if (direction === 'out') type = 'debit';
  else {
    const txType = txTypeRaw.toLowerCase();
    type = txType === 'credit' || txType === 'topup' || txType === 'refund' ? 'credit' : 'debit';
  }

  const rawDate = String(row.created_at ?? row.date ?? '');
  let date = rawDate;
  if (rawDate && !Number.isNaN(Date.parse(rawDate))) {
    date = new Date(rawDate).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return {
    id: String(row.tx_id ?? row.transaction_id ?? row.id ?? ''),
    label: mapWalletTransactionLabel(row),
    amount: Math.abs(amount),
    date,
    type,
    isOrderHistory,
    orderHref: isOrderHistory && orderId != null ? `/orders/${orderId}` : null,
  };
}
