import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { categoriesApi } from '@/services/api/masterApi';
import type { ISubCategoryResponse } from '@/services/api/types/master.types';
import { useLbiCategoriesByScope } from '@/hooks/master/useLbiCategoriesByScope';
import { pickScalarString } from '@/utils/pickScalarString';
import { rfqsApi } from '@/services/api/rfqApi';
import { useCreateRFQ } from '@/pages/rfq/useCreateRFQ';
import { useRFQDraft } from '@/pages/rfq/useRFQDraft';
import { Step1Basic } from '@/pages/rfq/steps/Step1Basic';
import { Step2Specifications } from '@/pages/rfq/steps/Step2Specifications';
import { Step3Commercial } from '@/pages/rfq/steps/Step3Commercial';
import { Step4QualityReview } from '@/pages/rfq/steps/Step4QualityReview';
import { RfqTargetingSelector } from '@/pages/rfq/steps/RfqTargetingSelector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/stores/useAuthStore';
import { AlertCircle, LogIn } from 'lucide-react';
import {
  RfqCollapsibleSection,
  RfqFormSection,
  RfqKindPicker,
  RfqMatchStrip,
  RfqSummaryCard,
  RfqSummaryItem,
} from '@/pages/rfq/rfqCreateWizardUi';

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
  const { isAuthenticated } = useAuth();
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
        const arr: ISubCategoryResponse[] = Array.isArray(raw) ? raw : [];
        const mapped = arr
          .map((r) => ({
            id: Number(r.sub_category_id ?? r.id ?? 0),
            name: pickScalarString(r.sub_category_name, r.name),
            sortOrder: Number(r.sort_order ?? NaN),
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

  const scopeFilter = draft.request_kind === 'MS' || draft.request_kind === 'MR' ? 'MT' : 'PD';
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
    if (
      (draft.request_kind === 'MS' || draft.request_kind === 'MR') &&
      draft.sub_category_id != null
    ) {
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
    if (draft.targeting === 'specific' && (!draft.target_factories || draft.target_factories.length === 0)) {
      issues.push('เพิ่มโรงงานที่ต้องการส่ง RFQ อย่างน้อย 1 รายการ');
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
    if ((kind === 'MS' || kind === 'MR') && !matchingLoading && (matchCount ?? 0) <= 0)
      return false;
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
    // Guest gate — preserve draft in sessionStorage via useRFQDraft so it
    // survives the login redirect, then return here automatically.
    if (!isAuthenticated) {
      navigate('/login?redirect=/create-rfq');
      return;
    }
    if (!step1Schema.safeParse(draft).success) return;
    await create.mutateAsync({
      ...draft,
      request_kind: draft.request_kind ?? 'PR',
      source_showcase_id: draft.source_showcase_id,
      title: draft.title,
      description: draft.description,
      category_id: Number(draft.category_id),
      qty: Number(draft.qty),
      sub_category_id: draft.sub_category_id,
      targeting: draft.targeting ?? 'all',
      factory_ids:
        draft.targeting === 'specific'
          ? (draft.target_factories ?? []).map((f) => f.id)
          : undefined,
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

  const showMatchStrip = Boolean(draft.category_id) && Number(draft.category_id) > 0;

  return (
    <div className='min-h-screen bg-[linear-gradient(180deg,var(--brand-lavender)_0%,var(--brand-page)_42%,var(--neutral-white)_100%)] pb-32'>
      <header className='sticky top-0 z-20 border-b border-white/70 bg-white/90 backdrop-blur-md'>
        <div className='mx-auto max-w-2xl px-4 py-3'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-[#C4A484]'>
            สร้างคำขอ
          </p>
          <div className='mt-0.5 flex items-center justify-between gap-2'>
            <h1 className='text-lg font-bold text-brand-navy-deep'>ขอใบเสนอราคา</h1>
            <span className='shrink-0 rounded-full bg-brand-lavender-chip px-2.5 py-0.5 text-[11px] font-semibold text-brand-violet-deep'>
              {step + 1}/{STEPS.length} · {STEPS[step]}
            </span>
          </div>
          <div className='mt-2.5 flex gap-1'>
            {STEPS.map((s, i) => (
              <Button
                variant='unstyled'
                key={s}
                type='button'
                onClick={() => {
                  if (i === 0 || isFormValid) setStep(i);
                }}
                aria-current={step === i ? 'step' : undefined}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-brand-violet-deep' : 'bg-gray-200'
                }`}
                aria-label={`ขั้นที่ ${i + 1}: ${s}`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-2xl space-y-3 px-4 py-4'>
        {step === 0 ? (
          <>
            <RfqFormSection
              title='ประเภทคำขอ'
              hint='เลือกประเภทก่อนกรอกรายละเอียด'
              required
              data-tour='request-kind'
            >
              <RfqKindPicker
                kind={kind}
                onSelect={(id) =>
                  setDraft({
                    request_kind: id,
                    category_id: null,
                    sub_category_id: undefined,
                  })
                }
              />
              {isSampleMode ? (
                <p className='mt-2.5 text-[11px] leading-snug text-neutral-subtle'>
                  โหมดตัวอย่าง: รายละเอียดอย่างน้อย 20 ตัวอักษร
                </p>
              ) : null}
            </RfqFormSection>

            <RfqFormSection
              title='ข้อมูลงาน'
              hint='โรงงานใช้ข้อมูลนี้ประเมินราคา'
              required
            >
              <Step1Basic
                draft={draft}
                setDraft={setDraft}
                categories={modeCategories}
                subCategories={subCategories}
                subCategoriesLoading={subCategoriesLoading}
                mode={kind}
              />
            </RfqFormSection>

            {showMatchStrip ? (
              <RfqMatchStrip
                loading={matchingLoading}
                count={matchCount}
                isMaterialKind={isMaterialKind}
              />
            ) : null}

            <RfqFormSection
              title='ส่งถึงโรงงาน'
              hint='เลือกว่าจะส่ง RFQ ให้ใคร'
            >
              <RfqTargetingSelector
                targeting={draft.targeting ?? 'all'}
                targetFactories={draft.target_factories ?? []}
                onTargetingChange={(t) =>
                  setDraft({ targeting: t, target_factories: t === 'all' ? [] : draft.target_factories ?? [] })
                }
                onFactoriesChange={(factories) => setDraft({ target_factories: factories })}
              />
            </RfqFormSection>

            <RfqFormSection
              title='จัดส่ง'
              hint='ที่อยู่และวิธีขนส่งที่ต้องการ'
              required
            >
              <Step3Commercial
                draft={draft}
                setDraft={setDraft}
                onLoaded={handleStep3Loaded}
                isGuest={!isAuthenticated}
              />
            </RfqFormSection>

            <RfqCollapsibleSection title='สเปกและไฟล์แนบ'>
              <Step2Specifications draft={draft} setDraft={setDraft} />
            </RfqCollapsibleSection>

            {!isSampleMode ? (
              <RfqCollapsibleSection title='มาตรฐานคุณภาพ'>
                <Step4QualityReview draft={draft} setDraft={setDraft} />
              </RfqCollapsibleSection>
            ) : null}

            {!isFormValid && blockingIssues.length > 0 ? (
              <div className='flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5'>
                <AlertCircle size={18} className='shrink-0 text-amber-600 mt-0.5' />
                <div>
                  <p className='text-[12px] font-semibold text-amber-900'>ยังส่งไม่ได้</p>
                  <p className='mt-0.5 text-[11px] text-amber-800'>{blockingIssues[0]}</p>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className='space-y-3'>
            <p className='text-[12px] text-neutral-subtle px-0.5'>
              ตรวจสอบข้อมูลก่อนส่ง — กดย้อนกลับเพื่อแก้ไข
            </p>

            <RfqSummaryCard title='งานและสินค้า'>
              <RfqSummaryItem label='ประเภทคำขอ' value={kindLabel} />
              <RfqSummaryItem label='ชื่อโปรเจกต์' value={draft.title} />
              <RfqSummaryItem label='หมวดหมู่' value={categoryName} />
              <RfqSummaryItem label='หมวดย่อย' value={subCategoryName} />
              <RfqSummaryItem label='จำนวน' value={draft.qty != null ? String(draft.qty) : undefined} />
              <RfqSummaryItem label='รายละเอียด' value={draft.description} />
            </RfqSummaryCard>

            <RfqSummaryCard title='ส่งถึงโรงงาน'>
              <RfqSummaryItem
                label='วิธีส่ง'
                value={
                  (draft.targeting ?? 'all') === 'all'
                    ? 'ส่งให้ทุกโรงงานที่รับงานประเภทนี้'
                    : `เลือกเฉพาะ ${(draft.target_factories ?? []).length} โรงงาน`
                }
              />
              {(draft.targeting ?? 'all') === 'specific' && (draft.target_factories ?? []).length > 0 && (
                <RfqSummaryItem
                  label='รายชื่อโรงงาน'
                  value={(draft.target_factories ?? []).map((f) => f.name).join(', ')}
                />
              )}
            </RfqSummaryCard>

            <RfqSummaryCard title='จัดส่งและงบ'>
              <RfqSummaryItem
                label='งบประมาณ'
                value={draft.target_price != null ? `${draft.target_price} บาท` : undefined}
              />
              <RfqSummaryItem
                label='ระยะเวลาผลิต'
                value={
                  draft.target_lead_time_days != null
                    ? `${draft.target_lead_time_days} วัน`
                    : undefined
                }
              />
              <RfqSummaryItem label='ที่อยู่จัดส่ง' value={deliveryAddressLabel} />
              <RfqSummaryItem label='วิธีจัดส่ง' value={shippingMethodLabel} />
            </RfqSummaryCard>

            {!isSampleMode ? (
              <RfqSummaryCard title='สเปกและคุณภาพ'>
                <RfqSummaryItem label='วัตถุดิบ / เกรด' value={draft.material_grade} />
                <RfqSummaryItem
                  label='มาตรฐาน'
                  value={draft.certifications_required.join(', ') || undefined}
                />
                <RfqSummaryItem
                  label='ไฟล์อ้างอิง'
                  value={`${draft.reference_images.length} ไฟล์`}
                />
              </RfqSummaryCard>
            ) : (
              <section className='rounded-2xl border border-white/80 bg-white px-3.5 py-3.5 shadow-[0_2px_12px_rgba(46,34,82,0.05)]'>
                <p className='text-[13px] font-bold text-brand-navy-deep mb-2'>ยืนยันการขอตัวอย่าง</p>
                <Label className='flex items-start gap-2 text-[12px] text-brand-navy-deep'>
                  <Checkbox
                    checked={acceptSampleTerms}
                    onCheckedChange={(checked) => setAcceptSampleTerms(checked === true)}
                    className='mt-0.5'
                  />
                  <span>
                    ยอมรับเงื่อนไขการสั่งตัวอย่าง และยืนยันว่ารายละเอียดเพียงพอให้โรงงานประเมินได้
                  </span>
                </Label>
                <p className='mt-2 text-[11px] text-neutral-subtle'>
                  ไฟล์อ้างอิง: {draft.reference_images.length} ไฟล์
                </p>
              </section>
            )}

            {optionalMissing.length > 0 ? (
              <p className='text-[11px] text-neutral-subtle px-0.5'>
                ยังไม่ระบุ (ไม่บังคับ): {optionalMissing.join(', ')}
              </p>
            ) : null}
          </div>
        )}
      </main>

      <div className='fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/90 bg-white/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'>
        <div className='mx-auto flex max-w-2xl items-center justify-between gap-3'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
            className='shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-navy-deep'
          >
            {step === 0 ? 'ยกเลิก' : 'แก้ไข'}
          </Button>
          {step === 0 ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setStep(1)}
              disabled={!isFormValid}
              className='min-w-[9rem] flex-1 max-w-[14rem] rounded-xl bg-brand-violet-deep px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(109,40,217,0.35)] disabled:opacity-45'
            >
              ตรวจสอบและส่ง
            </Button>
          ) : !isAuthenticated ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/login?redirect=/create-rfq')}
              className='flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-violet-deep px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(109,40,217,0.35)]'
            >
              <LogIn size={15} />
              ล็อกอินเพื่อส่ง
            </Button>
          ) : (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void submit()}
              disabled={!isFormValid || create.isPending || (isSampleMode && !acceptSampleTerms)}
              className='min-w-0 flex-1 rounded-xl bg-brand-violet-deep px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(109,40,217,0.35)] disabled:opacity-45'
            >
              {create.isPending ? 'กำลังส่ง…' : 'ส่งคำขอราคา'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
