import type { IQuotationResponse } from '@/services/api/types/rfq.types';
import { apiListAsRecords, asRecord, nestedRecord, type ApiRecord } from '@/lib/apiShape';
import { pickScalarString } from '@/utils/pickScalarString';

export type FactoryRfqQuoteRow = IQuotationResponse & {
  factoryId?: number | string;
  id?: number | string;
  mold_cost?: number | string;
  image_urls?: unknown;
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
