import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, FileText, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  CreateRfqStep1,
  CreateRfqStep2,
  CreateRfqStep3Summary,
} from '../../components/features/create-rfq';
import type { useCreateRfqState } from '../../hooks/useCreateRfqState';

type CreateRfqState = ReturnType<typeof useCreateRfqState>;
type CreateRfqDesktopProps = { state: CreateRfqState };

export function CreateRfqDesktop({ state }: CreateRfqDesktopProps) {
  const {
    STEPS,
    currentStep,
    form,
    displayCategoryName,
    displaySubCategoryName,
    categories,
    subCategories,
    subCategoriesLoading,
    subCategoriesError,
    reloadSubCategories,
    units,
    shippingMethods,
    addresses,
    openAddressModal,
    updateForm,
    canProceed,
    submitting,
    submitError,
    handleNext,
    handleBack,
  } = state;

  const unitName = units.find((u) => u.id === form.unitId)?.name ?? 'หน่วย';
  const shippingName = shippingMethods.find((m) => m.id === form.shippingMethodId)?.name;

  return (
    <div className="hidden lg:flex min-h-[calc(100vh-4rem)] flex-col bg-slate-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleBack}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase mb-0.5">
                คำขอใบเสนอราคา
              </p>
              <h1 className="text-[20px] font-bold text-slate-900">สร้างคำขอราคาใหม่</h1>
            </div>
          </div>

          {/* Step indicator pills */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((label, idx) => {
              const stepNum = idx + 1;
              const isDone    = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all',
                    isDone    ? 'bg-violet-100 text-violet-600' :
                    isCurrent ? 'bg-violet-600 text-white shadow-md shadow-violet-200' :
                                'bg-slate-100 text-slate-400'
                  )}>
                    {isDone
                      ? <CheckCircle2 size={13} />
                      : <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px]"
                          style={{ borderColor: isCurrent ? 'rgba(255,255,255,0.6)' : '#CBD5E1' }}>
                          {stepNum}
                        </span>
                    }
                    {label}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn('w-6 h-0.5 rounded-full', currentStep > stepNum ? 'bg-violet-400' : 'bg-slate-200')} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex px-8 py-7 gap-6">

        {/* ── Left: form ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5 max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-7 flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6">
                  <CreateRfqStep1
                    form={form}
                    categories={categories}
                    subCategories={subCategories}
                    subCategoriesLoading={subCategoriesLoading}
                    subCategoriesError={subCategoriesError}
                    onRetrySubCategories={() => void reloadSubCategories()}
                    onUpdate={updateForm}
                  />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6">
                  <CreateRfqStep2
                    form={form}
                    units={units}
                    onUpdate={updateForm}
                  />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div key="step3"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6">
                  <CreateRfqStep3Summary
                    form={form}
                    categoryName={displayCategoryName}
                    subCategoryName={displaySubCategoryName}
                    categoryId={form.categoryId}
                    units={units}
                    addresses={addresses}
                    shippingMethods={shippingMethods}
                    onUpdate={updateForm}
                    onAddAddress={openAddressModal}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation row */}
          <div className="flex justify-between items-center">
            <button type="button" onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 transition-colors font-medium px-4 py-2.5 rounded-xl hover:bg-slate-100">
              <ArrowLeft size={15} /> ย้อนกลับ
            </button>
            {submitError && (
              <p className="text-[12px] text-red-500 font-medium">{submitError}</p>
            )}
            <motion.button type="button"
              whileHover={{ scale: canProceed && !submitting ? 1.02 : 1 }}
              whileTap={{ scale: canProceed && !submitting ? 0.98 : 1 }}
              onClick={handleNext}
              disabled={!canProceed || submitting}
              className={cn(
                'px-8 py-3 rounded-2xl text-white font-bold text-[14px] shadow-lg flex items-center gap-2 transition-all',
                canProceed && !submitting ? 'shadow-violet-200/60' : 'opacity-50 cursor-not-allowed',
              )}
              style={{ background: 'linear-gradient(135deg, #5B21B6, #6C47FF)' }}>
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> กำลังส่งคำขอ...</>
              ) : currentStep === 3 ? (
                <><FileText size={16} /> ส่งคำขอใบเสนอราคา</>
              ) : (
                <>ถัดไป →</>
              )}
            </motion.button>
          </div>
        </div>

        {/* ── Right: summary sidebar ── */}
        <aside className="w-72 flex-shrink-0 space-y-4">

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-slate-400 uppercase mb-3">
              สรุปคำขอ
            </p>
            <h2 className="text-[14px] font-bold text-slate-900 mb-4 leading-snug">
              {form.title || (
                <span className="text-slate-400 font-normal">ยังไม่ได้ระบุชื่อสินค้า</span>
              )}
            </h2>
            <div className="space-y-2.5">
              {[
                { label: 'หมวดหมู่', value: displayCategoryName },
                { label: 'ประเภทย่อย', value: displaySubCategoryName },
                { label: 'จำนวน', value: form.quantity ? `${Number(form.quantity).toLocaleString('th-TH')} ${unitName}` : '-' },
                { label: 'งบ/ชิ้น', value: form.budgetPerPiece ? `฿${Number(form.budgetPerPiece).toLocaleString('th-TH')}` : '-' },
                { label: 'งบรวมประมาณ', value: form.quantity && form.budgetPerPiece ? `฿${(Number(form.quantity) * Number(form.budgetPerPiece)).toLocaleString('th-TH')}` : '-' },
                { label: 'รูปแนบ', value: form.imageUrls.length > 0 ? `${form.imageUrls.length} รูป` : '-' },
                { label: 'วิธีจัดส่ง', value: shippingName ?? '-' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-[11px] text-slate-400">{row.label}</span>
                  <span className={cn('text-[12px] font-semibold', row.value === '-' ? 'text-slate-300' : 'text-slate-800')}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-slate-400 uppercase mb-3">
              ความคืบหน้า
            </p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7C3AED, #6C47FF)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[11px] font-bold text-violet-600 shrink-0">
                {currentStep}/{STEPS.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {STEPS.map((label, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;
                return (
                  <div key={label} className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition-all',
                    isCurrent ? 'bg-violet-50 text-violet-700 font-semibold' :
                    isDone    ? 'text-slate-500' : 'text-slate-300'
                  )}>
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                      isDone    ? 'bg-violet-500' :
                      isCurrent ? 'bg-violet-100 border-2 border-violet-400' : 'bg-slate-100'
                    )}>
                      {isDone
                        ? <CheckCircle2 size={12} className="text-white" />
                        : <span className={cn('text-[9px] font-bold', isCurrent ? 'text-violet-600' : 'text-slate-400')}>{stepNum}</span>
                      }
                    </div>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-violet-100 p-4" style={{ background: 'linear-gradient(135deg, #F5F3FF, #EEF2FF)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-violet-500" />
              <p className="text-[12px] font-bold text-violet-700">Tips</p>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
              <li className="flex items-start gap-1.5"><span className="text-violet-400 mt-0.5">·</span> เลือกประเภทย่อยให้ตรง RFQ จะถูกส่งไปถึงโรงงานที่เชี่ยวชาญ</li>
              <li className="flex items-start gap-1.5"><span className="text-violet-400 mt-0.5">·</span> ระบุจำนวนและหน่วยให้ชัดเจน</li>
              <li className="flex items-start gap-1.5"><span className="text-violet-400 mt-0.5">·</span> ระบุงบประมาณต่อชิ้นเพื่อให้โรงงานเสนอราคาได้แม่นยำ</li>
              <li className="flex items-start gap-1.5"><span className="text-violet-400 mt-0.5">·</span> แนบรูปตัวอย่างหรือรายละเอียดวัสดุ/มาตรฐาน</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
