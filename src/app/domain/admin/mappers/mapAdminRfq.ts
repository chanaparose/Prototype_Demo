import { apiListAsRecords, asRecord, nestedRecord, type ApiRecord } from '@/lib/apiShape';

export function parseAdminRfqRows<T = ApiRecord>(raw: unknown): T[] {
  return apiListAsRecords(raw, ['items', 'rows']) as T[];
}

export function extractAdminRfqDetailBody(raw: unknown): ApiRecord {
  const root = asRecord(raw);
  const nested = nestedRecord(root, 'rfq');
  return Object.keys(nested).length > 0 ? nested : root;
}
