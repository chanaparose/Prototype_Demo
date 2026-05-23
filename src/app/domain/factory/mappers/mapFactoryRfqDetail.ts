import type { IQuotationResponse } from '@/services/api/types/rfq.types';
import { apiListAsRecords, asRecord, nestedRecord, type ApiRecord } from '@/lib/apiShape';
import { pickScalarString } from '@/utils/pickScalarString';

export type FactoryRfqQuoteRow = IQuotationResponse & {
  factoryId?: number | string;
  id?: number | string;
  mold_cost?: number | string;
  image_urls?: unknown;
  factory_highlight?: unknown;
  highlight?: unknown;
};

export type FactoryRfqDetailData = {
  rfqTitle: string;
  rfqBody: ApiRecord;
  quotes: FactoryRfqQuoteRow[];
  subCategoryName: string;
  commissionConfig: { vat_rate: number; commission_rate: number } | null;
};

export function quoteIdOf(q: FactoryRfqQuoteRow): string {
  return String(q.quote_id ?? q.id ?? '');
}

export function quoteFactoryIdOf(q: FactoryRfqQuoteRow): number | null {
  const row = asRecord(q);
  const factoryRaw = row.factory;
  const factoryObj = factoryRaw && typeof factoryRaw === 'object' ? asRecord(factoryRaw) : null;
  const n = Number(
    q.factory_id ??
      q.factoryId ??
      row.user_id ??
      row.factory_user_id ??
      factoryObj?.user_id ??
      factoryObj?.id,
  );
  return Number.isFinite(n) ? n : null;
}

export function quoteFactoryHighlight(q: FactoryRfqQuoteRow | null | undefined): string {
  if (!q) return '';
  const row = asRecord(q);
  return pickScalarString(row.factory_highlight, row.highlight);
}

export function quoteImageUrls(q: FactoryRfqQuoteRow | null | undefined): string[] {
  if (!q) return [];
  const urls = q.image_urls;
  if (!Array.isArray(urls)) return [];
  return urls.filter((u): u is string => typeof u === 'string');
}

export function mapFactoryRfqDetailFromApi(detail: unknown): FactoryRfqDetailData {
  const root = asRecord(detail);
  const rfq = nestedRecord(root, 'rfq');
  const commission = root.commission_config;
  return {
    rfqTitle: pickScalarString(rfq.title),
    rfqBody: rfq,
    quotes: apiListAsRecords(root.quotations) as unknown as FactoryRfqQuoteRow[],
    subCategoryName: pickScalarString(rfq.sub_category_name),
    commissionConfig:
      commission && typeof commission === 'object' && !Array.isArray(commission)
        ? (commission as { vat_rate: number; commission_rate: number })
        : null,
  };
}
