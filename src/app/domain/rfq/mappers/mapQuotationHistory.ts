import { apiListAsRecords, asRecord } from '@/lib/apiShape';
import type { IQuotationHistoryEntry } from '@/services/api/types/rfq.types';
import { pickScalarString } from '@/utils/pickScalarString';

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapQuotationHistoryEntry(raw: unknown): IQuotationHistoryEntry | null {
  const r = asRecord(raw);
  const historyId = Number(r.history_id ?? 0);
  const quoteId = Number(r.quote_id ?? 0);
  if (!Number.isFinite(historyId) || historyId <= 0 || !Number.isFinite(quoteId) || quoteId <= 0) {
    return null;
  }
  return {
    history_id: historyId,
    quote_id: quoteId,
    event_type: pickScalarString(r.event_type, 'UP') as IQuotationHistoryEntry['event_type'],
    version_after: Number(r.version_after ?? 0),
    price_per_piece: toNum(r.price_per_piece),
    mold_cost: toNum(r.mold_cost),
    lead_time_days: toNum(r.lead_time_days),
    shipping_method_id: toNum(r.shipping_method_id),
    status: r.status == null ? null : pickScalarString(r.status),
    reason: r.reason == null ? null : pickScalarString(r.reason),
    edited_by: toNum(r.edited_by),
    created_at: pickScalarString(r.created_at),
  };
}

export function mapQuotationHistoryList(raw: unknown): IQuotationHistoryEntry[] {
  return apiListAsRecords(raw)
    .map(mapQuotationHistoryEntry)
    .filter((v): v is IQuotationHistoryEntry => v != null);
}
