import React from 'react';
import type { IQuotationCreateRequest } from '@/services/api/types/rfq.types';

export type QuoteBuilderState = IQuotationCreateRequest;

const initialState: QuoteBuilderState = {
  rfq_id: 0,
  items: [{ item_no: 1, description: '', qty: 1, unit: 'pcs', unit_price: 0, discount_pct: 0 }],
  discount_amount: 0,
  shipping_cost: 0,
  packaging_cost: 0,
  tooling_mold_cost: 0,
  validity_days: 30,
};

export function useQuoteBuilder(rfqId: number) {
  const [state, setState] = React.useState<QuoteBuilderState>({ ...initialState, rfq_id: rfqId });
  const setPartial = React.useCallback((next: Partial<QuoteBuilderState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);
  return { state, setState, setPartial };
}
