import React from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { useData } from '../../contexts/DataContext';
import { categoriesApi } from '../../services/api';
import { useCreateRFQ } from './useCreateRFQ';
import { useRFQDraft } from './useRFQDraft';
import { Step1Basic } from './steps/Step1Basic';
import { Step2Specifications } from './steps/Step2Specifications';
import { Step3Commercial } from './steps/Step3Commercial';
import { Step4QualityReview } from './steps/Step4QualityReview';

const step1Schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category_id: z.number().int().positive(),
  qty: z.number().positive(),
});

const step2Schema = z.object({
  material_grade: z.string().optional(),
});

const step3Schema = z.object({
  delivery_address_id: z.number().int().positive(),  // maps to address_id on submit
  shipping_method_id: z.number().int().positive(),   // required — factory ต้องรู้วิธีจัดส่ง
  target_lead_time_days: z.number().optional(),
});

const step4Schema = z.object({
  sample_required: z.boolean(),
});

const STEPS = ['Basic', 'Specs', 'Commercial', 'Review'];

export function RFQCreateWizard() {
  const navigate = useNavigate();
  const { categories } = useData();
  const { draft, setDraft, reset } = useRFQDraft();
  const create = useCreateRFQ();
  const [step, setStep] = React.useState(0);
  const [subCategoriesLoading, setSubCategoriesLoading] = React.useState(false);
  const [subCategories, setSubCategories] = React.useState<
    { id: number; name: string; sortOrder?: number }[]
  >([]);

  React.useEffect(() => {
    const cid = Number(draft.category_id ?? 0);
    if (!Number.isFinite(cid) || cid <= 0) {
      setSubCategories([]);
      return;
    }
    let active = true;
    setSubCategoriesLoading(true);
    void categoriesApi
      .subCategories(cid)
      .then((raw) => {
        if (!active) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const mapped = arr
          .map((r) => ({
            id: Number(r.sub_category_id ?? r.id ?? 0),
            name: String(r.sub_category_name ?? r.name ?? r.name_th ?? '').trim(),
            sortOrder: Number(r.sort_order ?? r.sortOrder ?? NaN),
          }))
          .filter((s) => Number.isFinite(s.id) && s.id > 0 && s.name);
        setSubCategories(mapped);
      })
      .catch(() => {
        if (active) setSubCategories([]);
      })
      .finally(() => {
        if (active) setSubCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [draft.category_id]);

  const isStepValid = React.useMemo(() => {
    if (step === 0) return step1Schema.safeParse(draft).success;
    if (step === 1) return step2Schema.safeParse(draft).success;
    if (step === 2) return step3Schema.safeParse(draft).success;
    return step4Schema.safeParse(draft).success;
  }, [step, draft]);

  const submit = async () => {
    if (!step1Schema.safeParse(draft).success) return;
    await create.mutateAsync({
      ...draft,
      title: draft.title,
      description: draft.description,
      category_id: Number(draft.category_id),
      qty: Number(draft.qty),
      unit: 'ชิ้น',
      unit_id: undefined,
      sub_category_id: draft.sub_category_id,
      // Domestic only — not shown to customer
      incoterms: undefined,
      // Payment: 100% upfront enforced by platform — not shown to customer
      payment_terms: undefined,
    });
    reset();
    navigate('/orders');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i)}
              aria-current={step === i ? 'step' : undefined}
              className={`px-3 py-1 rounded-full text-xs ${
                step === i ? 'bg-violet-100 text-violet-700 font-semibold' : 'text-gray-500'
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>
        {step === 0 ? (
          <Step1Basic
            draft={draft}
            setDraft={setDraft}
            categories={categories}
            subCategories={subCategories}
            subCategoriesLoading={subCategoriesLoading}
          />
        ) : null}
        {step === 1 ? <Step2Specifications draft={draft} setDraft={setDraft} /> : null}
        {step === 2 ? <Step3Commercial draft={draft} setDraft={setDraft} /> : null}
        {step === 3 ? <Step4QualityReview draft={draft} setDraft={setDraft} /> : null}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!isStepValid}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!isStepValid || create.isPending}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm disabled:opacity-50"
          >
            {create.isPending ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}
