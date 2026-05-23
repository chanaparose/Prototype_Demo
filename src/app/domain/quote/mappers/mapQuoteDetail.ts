type ApiRecord = Record<string, unknown>;

export type QuoteDetailItem = {
  itemNo: string;
  description: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type QuoteBreakdown = {
  subtotal: number;
  shippingCost: number;
  packagingCost: number;
  toolingMoldCost: number;
  vatAmount: number;
  grandTotal: number;
  leadTimeDays: string;
};

export type QuoteHistoryEntry = QuoteBreakdown & {
  quotationId: string;
  version: string;
};

export type QuoteDetailModel = {
  factoryName: string;
  version: string;
  validUntil: string;
  accepted: boolean;
  acceptedAt: string;
  orderId: string;
  currencyCode: string;
  items: QuoteDetailItem[];
  breakdown: QuoteBreakdown;
};

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' ? (value as ApiRecord) : {};
}

function asNumber(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function asString(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function mapBreakdown(row: ApiRecord): QuoteBreakdown {
  return {
    subtotal: asNumber(row.subtotal),
    shippingCost: asNumber(row.shipping_cost),
    packagingCost: asNumber(row.packaging_cost),
    toolingMoldCost: asNumber(row.tooling_mold_cost),
    vatAmount: asNumber(row.vat_amount),
    grandTotal: asNumber(row.grand_total),
    leadTimeDays: asString(row.lead_time_days, '-'),
  };
}

export function mapQuoteDetail(raw: unknown): QuoteDetailModel {
  const row = asRecord(raw);
  const breakdown = mapBreakdown(asRecord(row.breakdown ?? row));
  const items = Array.isArray(row.items)
    ? row.items.map((item, index) => {
        const r = asRecord(item);
        return {
          itemNo: asString(r.item_no, String(index + 1)),
          description: asString(r.description, '-'),
          qty: asNumber(r.qty),
          unitPrice: asNumber(r.unit_price),
          lineTotal: asNumber(r.line_total),
        };
      })
    : [];

  return {
    factoryName: asString(row.factory_name ?? row.factoryName, 'Factory quotation'),
    version: asString(row.version, '1'),
    validUntil: asString(row.valid_until, '-'),
    accepted: asString(row.status).toUpperCase() === 'AC',
    acceptedAt: asString(row.accepted_at, '-'),
    orderId: asString(row.order_id, '-'),
    currencyCode: asString(row.currency_code, 'THB'),
    items,
    breakdown,
  };
}

export function mapQuoteHistory(raw: unknown): QuoteHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = asRecord(item);
    return {
      ...mapBreakdown(row),
      quotationId: asString(row.quotation_id, String(index)),
      version: asString(row.version, String(index + 1)),
    };
  });
}
