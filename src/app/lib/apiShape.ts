export type ApiRecord = Record<string, unknown>;

const DEFAULT_LIST_KEYS = ['data', 'items', 'results'] as const;

export function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};
}

export function unwrapApiList(raw: unknown, listKeys: string[] = []): unknown[] {
  if (Array.isArray(raw)) return raw;
  const record = asRecord(raw);
  for (const key of [...listKeys, ...DEFAULT_LIST_KEYS]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

export function apiListAsRecords(raw: unknown, listKeys: string[] = []): ApiRecord[] {
  return unwrapApiList(raw, listKeys).filter(
    (item): item is ApiRecord =>
      item != null && typeof item === 'object' && !Array.isArray(item),
  );
}

export function unwrapApiEntity(raw: unknown, entityKeys: string[]): ApiRecord {
  const root = asRecord(raw);
  for (const key of entityKeys) {
    const nested = root[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return asRecord(nested);
    }
  }
  return root;
}

export function nestedRecord(row: ApiRecord, key: string): ApiRecord {
  const nested = row[key];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return asRecord(nested);
  }
  return row;
}
