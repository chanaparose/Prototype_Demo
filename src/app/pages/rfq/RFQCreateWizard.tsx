import React from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { useData } from '../../contexts/DataContext';
import { addressesApi, categoriesApi, masterApi } from '../../services/api';
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

const STEPS = ['กรอกข้อมูล', 'สรุปข้อมูล'];
const INSPECTION_LABEL: Record<'self' | 'third_party' | 'buyer_onsite', string> = {
  self: 'ตรวจสอบโดยโรงงาน',
  third_party: 'ตรวจสอบโดยหน่วยงานภายนอก',
  buyer_onsite: 'ผู้ซื้อเข้าตรวจที่โรงงาน',
};

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
  const [addressMap, setAddressMap] = React.useState<Record<number, string>>({});
  const [shippingMap, setShippingMap] = React.useState<Record<number, string>>({});
  const [categoryMap, setCategoryMap] = React.useState<Record<number, string>>({});

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

  React.useEffect(() => {
    let active = true;
    void addressesApi.list()
      .then((raw) => {
        if (!active) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const mapped: Record<number, string> = {};
        for (const r of arr) {
          const id = Number(r.address_id ?? r.id ?? 0);
          if (!Number.isFinite(id) || id <= 0) continue;
          const label = [
            String(r.address_detail ?? '').trim(),
            String(r.sub_district_name ?? r.sub_district ?? '').trim(),
            String(r.district_name ?? r.district ?? '').trim(),
            String(r.province_name ?? r.province ?? '').trim(),
            String(r.zip_code ?? '').trim(),
          ].filter(Boolean).join(', ');
          mapped[id] = label || `ที่อยู่ #${id}`;
        }
        setAddressMap(mapped);
      })
      .catch(() => {
        if (active) setAddressMap({});
      });

    void categoriesApi.list()
      .then((raw) => {
        if (!active) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const mapped: Record<number, string> = {};
        for (const r of arr) {
          const id = Number(r.category_id ?? r.id ?? 0);
          const name = String(r.category_name ?? r.name ?? '').trim();
          if (Number.isFinite(id) && id > 0 && name) mapped[id] = name;
        }
        setCategoryMap(mapped);
      })
      .catch(() => {
        if (active) setCategoryMap({});
      });

    void masterApi.shippingMethods()
      .then((raw) => {
        if (!active) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const mapped: Record<number, string> = {};
        for (const r of arr) {
          const id = Number(r.shipping_method_id ?? r.id ?? 0);
          const name = String(r.method_name ?? r.name ?? '').trim();
          if (Number.isFinite(id) && id > 0 && name) mapped[id] = name;
        }
        setShippingMap(mapped);
      })
      .catch(() => {
        if (active) setShippingMap({});
      });

    return () => {
      active = false;
    };
  }, []);

  const isFormValid = React.useMemo(() => {
    return (
      step1Schema.safeParse(draft).success &&
      step2Schema.safeParse(draft).success &&
      step3Schema.safeParse(draft).success &&
      step4Schema.safeParse(draft).success
    );
  }, [draft]);

  const categoryName = React.useMemo(() => {
    const id = Number(draft.category_id ?? 0);
    if (!id) return '-';
    const fromContext = categories.find((c) => Number(c.id) === id)?.name;
    return fromContext ?? categoryMap[id] ?? String(id);
  }, [categories, categoryMap, draft.category_id]);

  const subCategoryName = React.useMemo(() => {
    const id = Number(draft.sub_category_id ?? 0);
    if (!id) return '-';
    return subCategories.find((s) => s.id === id)?.name ?? String(id);
  }, [subCategories, draft.sub_category_id]);

  const deliveryAddressLabel = React.useMemo(() => {
    const id = Number(draft.delivery_address_id ?? 0);
    if (!id) return '-';
    return addressMap[id] ?? `ที่อยู่ #${id}`;
  }, [addressMap, draft.delivery_address_id]);

  const shippingMethodLabel = React.useMemo(() => {
    const id = Number(draft.shipping_method_id ?? 0);
    if (!id) return '-';
    return shippingMap[id] ?? `วิธีจัดส่ง #${id}`;
  }, [shippingMap, draft.shipping_method_id]);

  const inspectionTypeLabel = React.useMemo(() => {
    if (!draft.inspection_type) return '-';
    return INSPECTION_LABEL[draft.inspection_type] ?? draft.inspection_type;
  }, [draft.inspection_type]);

  const optionalMissing = React.useMemo(() => {
    const missing: string[] = [];
    if (!draft.sub_category_id) missing.push('หมวดย่อย');
    if (!draft.material_grade?.trim()) missing.push('วัตถุดิบ');
    if (!draft.target_unit_price) missing.push('งบประมาณรวม');
    if (!draft.target_lead_time_days) missing.push('ระยะเวลาผลิต');
    if (!draft.required_delivery_date) missing.push('วันที่ต้องการรับสินค้า');
    if (!draft.certifications_required.length) missing.push('Certification');
    if (!draft.reference_images.length) missing.push('รูปอ้างอิง');
    if (!draft.inspection_type) missing.push('รูปแบบตรวจคุณภาพ');
    if (!draft.sample_required) missing.push('ตัวอย่างสินค้า');
    return missing;
  }, [draft]);

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
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#2E2252]">สร้างคำขอใบเสนอราคา (RFQ)</h1>
        <p className="text-sm text-gray-500 mt-1">{step === 0 ? 'กรอกรายละเอียดที่โรงงานต้องรู้' : 'ตรวจสอบข้อมูลก่อนส่ง'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (i === 0 || isFormValid) setStep(i);
                }}
                aria-current={step === i ? 'step' : undefined}
                className={`px-3 py-1 rounded-full text-xs ${
                  step === i ? 'bg-violet-600 text-white font-semibold' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-violet-600 transition-all" style={{ width: `${((step + 1) / 2) * 100}%` }} />
          </div>
        </div>

        {step === 0 ? (
          <div className="space-y-4">
            <section className="rounded-xl border border-gray-100 p-3 sm:p-4">
              <p className="text-sm font-semibold text-[#2E2252] mb-3">ข้อมูลโปรเจกต์</p>
              <Step1Basic
                draft={draft}
                setDraft={setDraft}
                categories={categories}
                subCategories={subCategories}
                subCategoriesLoading={subCategoriesLoading}
              />
            </section>

            <section className="rounded-xl border border-gray-100 p-3 sm:p-4">
              <p className="text-sm font-semibold text-[#2E2252] mb-3">สเปกเพิ่มเติม</p>
              <Step2Specifications draft={draft} setDraft={setDraft} />
            </section>

            <section className="rounded-xl border border-gray-100 p-3 sm:p-4">
              <p className="text-sm font-semibold text-[#2E2252] mb-3">เงื่อนไขส่งมอบ</p>
              <Step3Commercial draft={draft} setDraft={setDraft} />
            </section>

            <section className="rounded-xl border border-gray-100 p-3 sm:p-4">
              <p className="text-sm font-semibold text-[#2E2252] mb-3">เงื่อนไขคุณภาพ</p>
              <Step4QualityReview draft={draft} setDraft={setDraft} />
            </section>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <section className="rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-[#2E2252] mb-3">ข้อมูลโปรเจกต์</p>
              <div className="grid sm:grid-cols-2 gap-2 text-gray-700">
                <p><span className="text-gray-500">ชื่อโปรเจกต์:</span> {draft.title || '-'}</p>
                <p><span className="text-gray-500">หมวดหมู่:</span> {categoryName}</p>
                <p><span className="text-gray-500">หมวดย่อย:</span> {subCategoryName}</p>
                <p><span className="text-gray-500">จำนวน:</span> {draft.qty ?? '-'}</p>
              </div>
              <p className="mt-2"><span className="text-gray-500">รายละเอียด:</span> {draft.description || '-'}</p>
            </section>

            <section className="rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-[#2E2252] mb-3">เงื่อนไขส่งมอบและงบ</p>
              <div className="grid sm:grid-cols-2 gap-2 text-gray-700">
                <p><span className="text-gray-500">งบประมาณรวม:</span> {draft.target_unit_price ?? '-'}</p>
                <p><span className="text-gray-500">ระยะเวลาผลิต:</span> {draft.target_lead_time_days ?? '-'} วัน</p>
                <p><span className="text-gray-500">วันที่ต้องการรับ:</span> {draft.required_delivery_date || '-'}</p>
                <p><span className="text-gray-500">ที่อยู่จัดส่ง:</span> {deliveryAddressLabel}</p>
                <p><span className="text-gray-500">วิธีจัดส่ง:</span> {shippingMethodLabel}</p>
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-[#2E2252] mb-3">สเปกและคุณภาพ</p>
              <div className="grid sm:grid-cols-2 gap-2 text-gray-700">
                <p><span className="text-gray-500">วัตถุดิบ:</span> {draft.material_grade || '-'}</p>
                <p><span className="text-gray-500">Certifications:</span> {draft.certifications_required.join(', ') || '-'}</p>
                <p><span className="text-gray-500">ต้องการตัวอย่าง:</span> {draft.sample_required ? `ใช่ (${draft.sample_qty ?? '-'})` : 'ไม่'}</p>
                <p><span className="text-gray-500">รูปแบบตรวจคุณภาพ:</span> {inspectionTypeLabel}</p>
              </div>
              <p className="mt-2 text-gray-500">รูปอ้างอิง: {draft.reference_images.length} รูป</p>
            </section>

            {optionalMissing.length > 0 ? (
              <section className="rounded-xl border border-dashed border-gray-200 p-4">
                <p className="font-semibold text-[#2E2252] mb-2">ข้อมูลที่ยังไม่ได้กรอก (ไม่บังคับ)</p>
                <div className="flex flex-wrap gap-2">
                  {optionalMissing.map((m) => (
                    <span key={m} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {m}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium"
          >
            {step === 0 ? 'ย้อนกลับ' : 'ย้อนกลับแก้ไข'}
          </button>
          {step === 0 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!isFormValid}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              ถัดไป: ตรวจสอบข้อมูล
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!isFormValid || create.isPending}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {create.isPending ? 'กำลังส่ง...' : 'ส่งคำขอราคา'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
