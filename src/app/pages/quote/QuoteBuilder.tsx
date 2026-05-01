import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { quotationApi } from '../../services/api';
import { useQuoteBuilder } from './useQuoteBuilder';
import { usePreviewBreakdown } from './usePreviewBreakdown';
import { RFQReferencePanel } from './components/RFQReferencePanel';
import { LineItemTable } from './components/LineItemTable';
import { ExtraChargesForm } from './components/ExtraChargesForm';
import { CommercialTermsForm } from './components/CommercialTermsForm';
import { BreakdownCard } from './components/BreakdownCard';

export function QuoteBuilder() {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const rid = Number(rfqId ?? 0);
  const { state, setPartial } = useQuoteBuilder(rid);
  const { loading, error, breakdown } = usePreviewBreakdown(state);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <RFQReferencePanel rfqId={rid} />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <LineItemTable items={state.items} onChange={(items) => setPartial({ items })} />
          <ExtraChargesForm
            discount_amount={state.discount_amount}
            shipping_cost={state.shipping_cost}
            packaging_cost={state.packaging_cost}
            tooling_mold_cost={state.tooling_mold_cost}
            onChange={(next) => setPartial(next)}
          />
          <CommercialTermsForm
            lead_time_days={state.lead_time_days}
            incoterms={state.incoterms}
            payment_terms={state.payment_terms}
            validity_days={state.validity_days}
            onChange={(next) => setPartial(next)}
          />
          <BreakdownCard loading={loading} breakdown={breakdown} />
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                const q = await quotationApi.create(state);
                const id = Number(q.quotation_id ?? q.id ?? 0);
                if (id > 0) navigate(`/factory/quotations/${id}`);
              } finally {
                setSubmitting(false);
              }
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 disabled:opacity-50"
          >
            {submitting ? 'กำลังบันทึก...' : 'Create quotation'}
          </button>
        </div>
      </div>
    </div>
  );
}
