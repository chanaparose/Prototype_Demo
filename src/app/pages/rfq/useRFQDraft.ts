import React from 'react';

const KEY = 'rfq_draft_v1';

export type RFQDraft = {
  request_kind?: 'PR' | 'PS' | 'MS';
  title: string;
  description: string;
  category_id: number | null;
  sub_category_id?: number;
  qty: number | null;
  material_grade: string;
  tolerance: string;
  color_finish: string;
  dimension_spec?: { L: number; W: number; H: number; unit: 'mm' | 'cm' | 'm' };
  weight_target_g?: number;
  packaging_spec: string;
  target_unit_price?: number;
  target_lead_time_days?: number;
  required_delivery_date?: string;
  incoterms?: string;
  payment_terms?: string;
  delivery_address_id?: number;
  shipping_method_id?: number;
  certifications_required: string[];
  sample_required: boolean;
  sample_qty?: number;
  inspection_type?: 'self' | 'third_party' | 'buyer_onsite';
  tech_drawing_url?: string;
  reference_images: string[];
  spec_sheet_url?: string;
  source_showcase_id?: number;
};

const initialDraft: RFQDraft = {
  request_kind: 'PR',
  title: '',
  description: '',
  category_id: null,
  qty: null,
  material_grade: '',
  tolerance: '',
  color_finish: '',
  packaging_spec: '',
  certifications_required: [],
  sample_required: false,
  reference_images: [],
};

type UseRFQDraft = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
  reset: () => void;
};

export function useRFQDraft(): UseRFQDraft {
  const [draft, setDraftState] = React.useState<RFQDraft>(initialDraft);

  React.useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<RFQDraft>;
      setDraftState({ ...initialDraft, ...parsed });
    } catch {
      setDraftState(initialDraft);
    }
  }, []);

  const setDraft = React.useCallback((next: Partial<RFQDraft>) => {
    setDraftState((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const reset = React.useCallback(() => {
    localStorage.removeItem(KEY);
    setDraftState(initialDraft);
  }, []);

  return { draft, setDraft, reset };
}
