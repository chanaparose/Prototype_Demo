import { apiListAsRecords, asRecord, type ApiRecord } from '@/lib/apiShape';

export type WalletSummary = {
  goodFund: number;
  pendingFund: number;
};

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  description: string;
  reference: string;
};

function asNumber(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function mapWalletSummary(raw: unknown): WalletSummary {
  const row = asRecord(raw);
  return {
    goodFund: asNumber(row.good_fund ?? row.walletBalance),
    pendingFund: asNumber(row.pending_fund ?? row.pendingBalance),
  };
}

export function mapWalletTransaction(raw: unknown): WalletTransaction {
  const row = asRecord(raw);
  const rawAmount = asNumber(row.amount);
  return {
    id: String(row.tx_id ?? row.transaction_id ?? row.id ?? ''),
    type: String(row.type ?? row.transaction_type ?? '').toUpperCase(),
    amount: Math.abs(rawAmount),
    status: String(row.status ?? '').toUpperCase(),
    date: String(row.created_at ?? row.uploaded_at ?? row.date ?? ''),
    description: String(row.description ?? ''),
    reference: String(row.reference ?? row.order_id ?? row.rfq_id ?? ''),
  };
}

export function mapWalletTransactions(raw: unknown): WalletTransaction[] {
  return apiListAsRecords(raw).map(mapWalletTransaction).filter((tx) => tx.id);
}
