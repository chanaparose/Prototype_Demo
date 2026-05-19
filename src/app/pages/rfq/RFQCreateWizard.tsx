import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { categoriesApi } from '@/services/api/masterApi';
import { useLbiCategoriesByScope } from '@/hooks/master/useLbiCategoriesByScope';
import { pickScalarString } from '@/utils/pickScalarString';
import { rfqsApi } from '@/services/api/rfqApi';
import { useCreateRFQ } from '@/pages/rfq/useCreateRFQ';
import { useRFQDraft } from '@/pages/rfq/useRFQDraft';
import { Step1Basic } from '@/pages/rfq/steps/Step1Basic';
import { Step2Specifications } from '@/pages/rfq/steps/Step2Specifications';
import { Step3Commercial } from '@/pages/rfq/steps/Step3Commercial';
import { Step4QualityReview } from '@/pages/rfq/steps/Step4QualityReview';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  delivery_address_id: z.number().int().positive(), // maps to address_id on submit
  shipping_method_id: z.number().int().positive(), // required — factory ต้องรู้วิธีจัดส่ง
  target_lead_time_days: z.number().optional(),
});

const step4Schema = z.object({});

const STEPS = ['กรอกข้อมูล', 'สรุปข้อมูล'];

export function RFQCreateWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { draft, setDraft, reset } = useRFQDraft();
  const create = useCreateRFQ();
  const [step, setStep] = React.useState(0);
  const [subCategoriesLoading, setSubCategoriesLoading] = React.useState(false);
  const [subCategories, setSubCategories] = React.useState<
    { id: number; name: string; sortOrder?: number }[]
  >([]);
  const [matchCount, setMatchCount] = React.useState<number | null>(null);
  const [matchingLoading, setMatchingLoading] = React.useState(false);
  const [acceptSampleTerms, setAcceptSampleTerms] = React.useState(false);
  const [addressMap, setAddressMap] = React.useState<Record<number, string>>({});
  const [shippingMap, setShippingMap] = React.useState<Record<number, string>>({});
  const { data: allCategories = [] } = useLbiCategoriesByScope('ALL');

  React.useEffect(() => {
    const mode = (searchParams.get('mode') || '').trim();
    const showcaseId = Number(searchParams.get('showcaseId') || 0);
    if (mode === 'sample-product') {
      setDraft({ request_kind: 'PS' });
    } else if (mode === 'sample-material') {
      setDraft({ request_kind: 'MS' });
    } else {
      setDraft({ request_kind: 'PR' });
    }
    if (Number.isFinite(showcaseId) && showcaseId > 0) {
      setDraft({ source_showcase_id: showcaseId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            name: pickScalarString(r.sub_category_name, r.name, r.name_th),
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

  const scopeFilter = (draft.request_kind === 'MS' || draft.request_kind === 'MR') ? 'MT' : 'PD';
  const modeCategories = React.useMemo(
    () => allCategories.filter((c) => !c.scope || c.scope === scopeFilter),
    [allCategories, scopeFilter],
  );
  const categoryMap = React.useMemo(
    () => Object.fromEntries(modeCategories.map((c) => [c.id, c.name])),
    [modeCategories],
  );

  React.useEffect(() => {
    const cid = Number(draft.category_id ?? 0);
    if (!cid) return;
    const exists = modeCategories.some((c) => c.id === cid);
    if (!exists) {
      setDraft({ category_id: null, sub_category_id: undefined });
    }
  }, [draft.category_id, modeCategories, setDraft]);

  React.useEffect(() => {
    if ((draft.request_kind === 'MS' || draft.request_kind === 'MR') && draft.sub_category_id != null) {
      setDraft({ sub_category_id: undefined });
    }
  }, [draft.request_kind, draft.sub_category_id, setDraft]);

  React.useEffect(() => {
    const cid = Number(draft.category_id ?? 0);
    if (!cid || !draft.request_kind) {
      setMatchCount(null);
      return;
    }
    // Skip if category doesn't belong to current scope (stale draft or mid-switch)
    if (allCategories.length > 0 && !modeCategories.some((c) => c.id === cid)) {
      setMatchCount(null);
      return;
    }
    let active = true;
    setMatchingLoading(true);
    void rfqsApi
      .previewFactories({
        kind: draft.request_kind,
        category_id: cid,
        sub_category_id:
          draft.sub_category_id != null && Number.isFinite(Number(draft.sub_category_id))
            ? Number(draft.sub_category_id)
            : undefined,
      })
      .then((raw) => {
        if (!active) return;
        const n = Number(
          (raw as Record<string, unknown>)?.match_count ??
            (raw as Record<string, unknown>)?.count ??
            (raw as Record<string, unknown>)?.total ??
            (raw as Record<string, unknown>)?.matched_factory_count ??
            0,
        );
        setMatchCount(Number.isFinite(n) ? n : 0);
      })
      .catch(() => {
        if (active) setMatchCount(null);
      })
      .finally(() => {
        if (active) setMatchingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [draft.request_kind, draft.category_id, draft.sub_category_id]);

  const handleStep3Loaded = React.useCallback(
    (addrMap: Record<number, string>, shipMap: Record<number, string>) => {
      if (Object.keys(addrMap).length > 0) setAddressMap(addrMap);
      if (Object.keys(shipMap).length > 0) setShippingMap(shipMap);
    },
    [],
  );

  const blockingIssues = React.useMemo(() => {
    const issues: string[] = [];
    const kind = draft.request_kind ?? 'PR';
    const qty = Number(draft.qty ?? 0);
    const descLen = draft.description?.trim().length ?? 0;
    if (!draft.title?.trim()) issues.push('กรอกชื่อโปรเจกต์');
    if (!draft.category_id || Number(draft.category_id) <= 0) issues.push('เลือกหมวดหมู่');
    if (!Number.isFinite(qty) || qty <= 0) {
      issues.push('กรอกจำนวน');
    } else if (kind === 'PS' && (qty < 1 || qty > 10)) {
      issues.push('จำนวนโหมดขอตัวอย่างสินค้า ต้องอยู่ระหว่าง 1-10 ชิ้น');
    } else if (kind === 'MS' && (qty < 1 || qty > 5)) {
      issues.push('จำนวนโหมดขอตัวอย่างวัตถุดิบ ต้องอยู่ระหว่าง 1-5 ชิ้น');
    }
    if (kind === 'PS' || kind === 'MS') {
      if (descLen < 20) issues.push('รายละเอียดต้องอย่างน้อย 20 ตัวอักษร');
    } else if (descLen < 1) {
      issues.push('กรอกรายละเอียดงาน');
    }
    if (!draft.delivery_address_id || Number(draft.delivery_address_id) <= 0) {
      issues.push('เลือกที่อยู่จัดส่ง');
    }
    if (!draft.shipping_method_id || Number(draft.shipping_method_id) <= 0) {
      issues.push('เลือกวิธีจัดส่ง');
    }
    return issues;
  }, [draft]);

  const isFormValid = React.useMemo(() => {
    const qty = Number(draft.qty ?? 0);
    const kind = draft.request_kind ?? 'PR';
    const withinKindQty =
      kind === 'PS' ? qty >= 1 && qty <= 10 : kind === 'MS' ? qty >= 1 && qty <= 5 : qty > 0;
    if (!withinKindQty) return false;
    if ((kind === 'PS' || kind === 'MS') && (draft.description?.trim()?.length ?? 0) < 20)
      return false;
    if ((kind === 'MS' || kind === 'MR') && !matchingLoading && (matchCount ?? 0) <= 0) return false;
    return blockingIssues.length === 0;
  }, [blockingIssues, draft, matchingLoading, matchCount]);

  const categoryName = React.useMemo(() => {
    const id = Number(draft.category_id ?? 0);
    if (!id) return '-';
    return categoryMap[id] ?? String(id);
  }, [categoryMap, draft.category_id]);

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

  const optionalMissing = React.useMemo(() => {
    const missing: string[] = [];
    const k = draft.request_kind ?? 'PR';
    if (k !== 'MS' && k !== 'MR' && !draft.sub_category_id) missing.push('หมวดย่อย');
    if (!draft.material_grade?.trim()) missing.push('วัตถุดิบ');
    if (!draft.target_price) missing.push('งบประมาณรวม');
    if (!draft.target_lead_time_days) missing.push('ระยะเวลาผลิต');
    if (!draft.certifications_required.length) missing.push('Certification');
    if (!draft.reference_images.length) missing.push('รูปอ้างอิง');
    return missing;
  }, [draft]);

  const submit = async () => {
    if (!step1Schema.safeParse(draft).success) return;
    await create.mutateAsync({
      ...draft,
      request_kind: draft.request_kind ?? 'PR',
      source_showcase_id: draft.source_showcase_id,
      title: draft.title,
      description: draft.description,
      category_id: Number(draft.category_id),
      qty: Number(draft.qty),
      unit: 'ชิ้น',
      unit_id: undefined,
      sub_category_id: draft.sub_category_id,
      // Domestic only — not shown to customer
      incoterms: undefined,

      payment_terms: undefined,
    });
    reset();
    navigate('/orders');
  };

  const kind = draft.request_kind ?? 'PR';
  const KIND_LABEL: Record<string, string> = {
    PR: 'ขอราคาผลิต OEM',
    MR: 'ขอราคาสั่งวัตถุดิบ',
    PS: 'ขอตัวอย่างสินค้า',
    MS: 'ขอตัวอย่างวัตถุดิบ',
  };
  const kindLabel = KIND_LABEL[kind] ?? kind;
  const isSampleMode = kind === 'PS' || kind === 'MS';
  const isMaterialKind = kind === 'MS' || kind === 'MR';

  return (
    <div className='max-w-5xl mx-auto px-4 py-6 pb-28'>
      <div className='mb-4'>
        <h1 className='text-xl font-bold text-brand-navy'>สร้างคำขอใบเสนอราคา (RFQ)</h1>
        <p className='text-sm text-gray-500 mt-1'>
          {step === 0 ? 'กรอกรายละเอียดที่โรงงานต้องรู้' : 'ตรวจสอบข้อมูลก่อนส่ง'}
        </p>
      </div>

      <div className='bg-white rounded-2xl border border-gray-100 p-4 mb-4'>
        <div className='mb-4'>
          <div className='flex items-center gap-2'>
            {STEPS.map((s, i) => (
              <Button
                variant='unstyled'
                key={s}
                type='button'
                onClick={() => {
                  if (i === 0 || isFormValid) setStep(i);
                }}
                aria-current={step === i ? 'step' : undefined}
                className={`px-3 py-1 rounded-full text-xs ${
                  step === i
                    ? 'bg-violet-600 text-white font-semibold'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {i + 1}. {s}
              </Button>
            ))}
          </div>
          <div className='mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden'>
            <div
              className='h-full bg-violet-600 transition-all'
              style={{ width: `${((step + 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {step === 0 ? (
          <div className='space-y-4'>
            <section
              data-tour='request-kind'
              className='rounded-xl border border-gray-100 p-3 sm:p-4'
            >
              <p className='text-sm font-semibold text-brand-navy mb-3'>ประเภทคำขอ</p>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {/* กลุ่ม 1: ขอราคาสั่งซื้อ */}
                <div className='rounded-xl border border-gray-100 bg-gray-50/60 p-3'>
                  <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2'>
                    ขอราคาสั่งซื้อ
                  </p>
                  <div className='flex flex-col gap-1.5'>
                    {(
                      [
                        { id: 'PR', label: 'ขอราคาผลิต OEM', desc: 'สินค้าตามสเปกที่กำหนด' },
                        { id: 'MR', label: 'ขอราคาวัตถุดิบ', desc: 'วัตถุดิบ' },
                      ] as const
                    ).map((opt) => {
                      const active = kind === opt.id;
                      return (
                        <Button
                          variant='unstyled'
                          key={opt.id}
                          type='button'
                          onClick={() =>
                            setDraft({
                              request_kind: opt.id,
                              category_id: null,
                              sub_category_id: undefined,
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                            active
                              ? 'bg-violet-50 border-violet-500'
                              : 'bg-white border-gray-200 hover:border-violet-300'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${active ? 'text-violet-700' : 'text-gray-700'}`}>
                            {opt.label}
                          </p>
                          <p className='text-[11px] text-gray-400 mt-0.5'>{opt.desc}</p>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* กลุ่ม 2: ขอสั่งซื้อตัวอย่าง */}
                <div className='rounded-xl border border-gray-100 bg-gray-50/60 p-3'>
                  <p className='text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2'>
                    ขอสั่งซื้อตัวอย่าง
                  </p>
                  <div className='flex flex-col gap-1.5'>
                    {(
                      [
                        { id: 'PS', label: 'ตัวอย่างสินค้า', desc: '1–10 ชิ้น' },
                        { id: 'MS', label: 'ตัวอย่างวัตถุดิบ', desc: '1–5 ชิ้น' },
                      ] as const
                    ).map((opt) => {
                      const active = kind === opt.id;
                      return (
                        <Button
                          variant='unstyled'
                          key={opt.id}
                          type='button'
                          onClick={() =>
                            setDraft({
                              request_kind: opt.id,
                              category_id: null,
                              sub_category_id: undefined,
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                            active
                              ? 'bg-amber-50 border-amber-400'
                              : 'bg-white border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${active ? 'text-amber-700' : 'text-gray-700'}`}>
                            {opt.label}
                          </p>
                          <p className='text-[11px] text-gray-400 mt-0.5'>{opt.desc}</p>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {isSampleMode && (
                <p className='text-xs text-gray-500 mt-2'>
                  โหมดตัวอย่าง: กรุณาระบุรายละเอียดสินค้า/วัตถุดิบให้ชัดเจนในช่องรายละเอียด
                  (อย่างน้อย 20 ตัวอักษร)
                </p>
              )}
            </section>

            <section className='rounded-xl border border-gray-100 p-3 sm:p-4'>
              <p className='text-sm font-semibold text-brand-navy mb-3'>ข้อมูลสินค้า</p>
              <Step1Basic
                draft={draft}
                setDraft={setDraft}
                categories={modeCategories}
                subCategories={subCategories}
                subCategoriesLoading={subCategoriesLoading}
                mode={kind}
              />
            </section>

            <section className='rounded-xl border border-gray-100 p-3 sm:p-4'>
              <p className='text-sm font-semibold text-brand-navy mb-3'>สเปกเพิ่มเติม</p>
              <Step2Specifications draft={draft} setDraft={setDraft} />
            </section>

            <section
              className={`rounded-xl border p-3 sm:p-4 ${isMaterialKind ? 'border-emerald-100 bg-emerald-50' : 'border-violet-100 bg-violet-50'}`}
            >
              <p
                className={`text-sm font-semibold ${isMaterialKind ? 'text-emerald-700' : 'text-violet-700'}`}
              >
                {matchingLoading
                  ? 'กำลังค้นหาโรงงานที่ตรงสเปก...'
                  : `พบ ${matchCount ?? 0} โรงงานที่ตรงกับสเปก`}
              </p>
              {!matchingLoading && isMaterialKind && (matchCount ?? 0) <= 0 ? (
                <div className='mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2'>
                  <p className='text-xs font-semibold text-amber-800'>
                    ยังไม่มีโรงงานที่ลงทะเบียนวัตถุดิบนี้
                  </p>
                  <p className='text-xs text-amber-700 mt-0.5'>
                    ลองเปลี่ยนเป็นโหมดขอราคาผลิต OEM หรือเลือกหมวดวัตถุดิบอื่น
                  </p>
                </div>
              ) : null}
            </section>

            <section className='rounded-xl border border-gray-100 p-3 sm:p-4'>
              <p className='text-sm font-semibold text-brand-navy mb-3'>เงื่อนไขส่งมอบ</p>
              <Step3Commercial draft={draft} setDraft={setDraft} onLoaded={handleStep3Loaded} />
            </section>

            {!isSampleMode ? (
              <section className='rounded-xl border border-gray-100 p-3 sm:p-4'>
                <p className='text-sm font-semibold text-brand-navy mb-3'>เงื่อนไขคุณภาพ</p>
                <Step4QualityReview draft={draft} setDraft={setDraft} />
              </section>
            ) : null}
            {!isFormValid && blockingIssues.length > 0 ? (
              <section className='rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4'>
                <p className='text-sm font-semibold text-amber-800'>ยังไปขั้นถัดไปไม่ได้</p>
                <p className='text-xs text-amber-700 mt-1'>{blockingIssues[0]}</p>
              </section>
            ) : null}
          </div>
        ) : (
          <div className='space-y-4 text-sm'>
            <section className='rounded-xl border border-gray-100 p-4'>
              <p className='font-semibold text-brand-navy mb-3'>ข้อมูลสินค้า</p>
              <div className='grid sm:grid-cols-2 gap-2 text-gray-700'>
                <p>
                  <span className='text-gray-500'>ชื่อสินค้า:</span> {draft.title || '-'}
                </p>
                <p>
                  <span className='text-gray-500'>หมวดหมู่:</span> {categoryName}
                </p>
                <p>
                  <span className='text-gray-500'>หมวดย่อย:</span> {subCategoryName}
                </p>
                <p>
                  <span className='text-gray-500'>ประเภทคำขอ:</span> {kindLabel}
                </p>
                <p>
                  <span className='text-gray-500'>จำนวน:</span> {draft.qty ?? '-'}
                </p>
              </div>
              <p className='mt-2'>
                <span className='text-gray-500'>รายละเอียด:</span> {draft.description || '-'}
              </p>
            </section>

            <section className='rounded-xl border border-gray-100 p-4'>
              <p className='font-semibold text-brand-navy mb-3'>เงื่อนไขส่งมอบและงบ</p>
              <div className='grid sm:grid-cols-2 gap-2 text-gray-700'>
                <p>
                  <span className='text-gray-500'>งบประมาณรวม:</span> {draft.target_price ?? '-'}
                </p>
                <p>
                  <span className='text-gray-500'>ระยะเวลาผลิต:</span>{' '}
                  {draft.target_lead_time_days ?? '-'} วัน
                </p>
                <p>
                  <span className='text-gray-500'>ที่อยู่จัดส่ง:</span> {deliveryAddressLabel}
                </p>
                <p>
                  <span className='text-gray-500'>วิธีจัดส่ง:</span> {shippingMethodLabel}
                </p>
              </div>
            </section>

            {!isSampleMode ? (
              <section className='rounded-xl border border-gray-100 p-4'>
                <p className='font-semibold text-brand-navy mb-3'>สเปกและคุณภาพ</p>
                <div className='grid sm:grid-cols-2 gap-2 text-gray-700'>
                  <p>
                    <span className='text-gray-500'>วัตถุดิบ:</span> {draft.material_grade || '-'}
                  </p>
                  <p>
                    <span className='text-gray-500'>Certifications:</span>{' '}
                    {draft.certifications_required.join(', ') || '-'}
                  </p>
                </div>
                <p className='mt-2 text-gray-500'>
                  รูปอ้างอิง: {draft.reference_images.length} รูป
                </p>
              </section>
            ) : (
              <section className='rounded-xl border border-gray-100 p-4'>
                <p className='font-semibold text-brand-navy mb-2'>ยืนยันการขอตัวอย่าง</p>
                <Label className='flex items-start gap-2 text-sm text-gray-700'>
                  <Checkbox
                    checked={acceptSampleTerms}
                    onCheckedChange={(checked) => setAcceptSampleTerms(checked === true)}
                    className='mt-1'
                  />
                  <span>
                    ยอมรับเงื่อนไขการสั่งตัวอย่าง และยืนยันว่ารายละเอียดเพียงพอให้โรงงานประเมินได้
                  </span>
                </Label>
                <p className='mt-2 text-gray-500'>
                  รูปอ้างอิง: {draft.reference_images.length} รูป
                </p>
              </section>
            )}
          </div>
        )}
      </div>

      <div className='fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 z-30'>
        <div className='max-w-5xl mx-auto flex items-center justify-between gap-3'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
            className='px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium'
          >
            {step === 0 ? 'ย้อนกลับ' : 'ย้อนกลับแก้ไข'}
          </Button>
          {step === 0 ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setStep(1)}
              disabled={!isFormValid}
              className='px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50'
            >
              ถัดไป: ตรวจสอบข้อมูล
            </Button>
          ) : (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void submit()}
              disabled={!isFormValid || create.isPending || (isSampleMode && !acceptSampleTerms)}
              className='px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50'
            >
              {create.isPending ? 'กำลังส่ง...' : 'ส่งคำขอราคา'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
