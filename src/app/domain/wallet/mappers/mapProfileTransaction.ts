import { apiListAsRecords, asRecord } from '@/lib/apiShape';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export function mapProfileTxLabel(raw: unknown): string {
  const row = asRecord(raw);
  const txType = pickScalarString(row.transaction_type, row.type).toUpperCase();
  const refType = pickScalarString(row.reference_type).toLowerCase();
  const refId = pickScalarNumber(row.reference_id) ?? 0;
  if (txType === 'BU') {
    if (refType === 'order' && refId > 0) return `สั่งซื้อ Order #${refId}`;
    return 'สั่งซื้อ';
  }
  if (txType === 'DP') return 'มัดจำ';
  if (txType === 'WD') return 'ถอนเงิน';
  if (txType === 'SC') return 'รับเงิน';
  if (txType === 'RF') return 'คืนเงิน';
  return pickScalarString(row.description, row.type_label, row.label, row.note, 'รายการ');
}

export type ProfileWalletSummaryTx = {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit';
};

function resolveTxDirection(
  row: ReturnType<typeof asRecord>,
  isCustomer: boolean,
): 'credit' | 'debit' {
  const amount = Number(row.amount ?? 0);
  const direction = pickScalarString(row.direction).toLowerCase();
  const txTypeRaw = pickScalarString(row.transaction_type, row.type).toUpperCase();
  if (amount < 0) return 'debit';
  if (amount > 0) return 'credit';
  if (isCustomer && txTypeRaw === 'BU') return 'debit';
  if (direction === 'in') return 'credit';
  if (direction === 'out') return 'debit';
  const txType = pickScalarString(row.transaction_type, row.type).toLowerCase();
  return txType === 'credit' || txType === 'topup' || txType === 'refund' ? 'credit' : 'debit';
}

export function mapProfileWalletSummaryTx(
  raw: unknown,
  isCustomer: boolean,
): ProfileWalletSummaryTx {
  const row = asRecord(raw);
  const amount = Number(row.amount ?? 0);
  const rawDate = pickScalarString(row.created_at, row.date);
  let date = rawDate;
  if (rawDate && !Number.isNaN(Date.parse(rawDate))) {
    date = new Date(rawDate).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return {
    id: pickScalarString(row.tx_id, row.transaction_id, row.id),
    label: mapProfileTxLabel(row),
    amount: Math.abs(amount),
    date,
    type: resolveTxDirection(row, isCustomer),
  };
}

export function mapProfileWalletSummaryTxList(
  raw: unknown,
  isCustomer: boolean,
): ProfileWalletSummaryTx[] {
  return apiListAsRecords(raw, ['data'])
    .map((row) => mapProfileWalletSummaryTx(row, isCustomer))
    .filter((t) => t.id);
}

export type ProfileWalletHistoryTx = {
  id: string;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  status_label: string;
  created_at: string;
};

export function mapProfileWalletHistoryTx(
  raw: unknown,
  isCustomer: boolean,
): ProfileWalletHistoryTx {
  const row = asRecord(raw);
  const txType = pickScalarString(row.type, row.transaction_type).toUpperCase();
  const apiDir = pickScalarString(row.direction).toLowerCase();
  const amount = Number(row.amount ?? 0);
  const effectiveDirection: 'in' | 'out' =
    amount < 0
      ? 'out'
      : amount > 0
        ? 'in'
        : isCustomer && txType === 'BU'
          ? 'out'
          : apiDir === 'in'
            ? 'in'
            : 'out';
  return {
    id: pickScalarString(row.tx_id, row.transaction_id, row.id),
    description: mapProfileTxLabel(row),
    amount,
    direction: effectiveDirection,
    status_label: pickScalarString(row.status_label, row.status, '-'),
    created_at: pickScalarString(row.created_at, row.date),
  };
}

export function mapProfileWalletHistoryTxList(
  raw: unknown,
  isCustomer: boolean,
): ProfileWalletHistoryTx[] {
  return apiListAsRecords(raw, ['data'])
    .map((row) => mapProfileWalletHistoryTx(row, isCustomer))
    .filter((t) => t.id);
}
