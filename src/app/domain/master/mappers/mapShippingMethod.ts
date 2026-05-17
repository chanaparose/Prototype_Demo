import type { IShippingMethodResponse } from '@/services/api/types/master.types';

export type ShippingMethodRow = {
  id: number;
  name: string;
};

export function mapShippingMethodRow(row: IShippingMethodResponse): ShippingMethodRow | null {
  const id = Number(row.shipping_method_id ?? row.id ?? 0);
  const name = String(row.method_name ?? row.name_th ?? row.name ?? '').trim();
  if (!Number.isFinite(id) || id <= 0 || !name) return null;
  return { id, name };
}

export function mapShippingMethodsList(raw: unknown): ShippingMethodRow[] {
  if (!Array.isArray(raw)) return [];
  return (raw as IShippingMethodResponse[])
    .map(mapShippingMethodRow)
    .filter((row): row is ShippingMethodRow => row != null);
}

export function mapShippingMethodsToRecord(raw: unknown): Record<number, string> {
  const out: Record<number, string> = {};
  for (const row of mapShippingMethodsList(raw)) {
    out[row.id] = row.name;
  }
  return out;
}
