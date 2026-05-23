export function getOrderIdFromCreateResult(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as { order_id?: unknown; id?: unknown };
  const id = row.order_id ?? row.id;
  if (id == null || String(id).trim() === '') return undefined;
  return String(id);
}
