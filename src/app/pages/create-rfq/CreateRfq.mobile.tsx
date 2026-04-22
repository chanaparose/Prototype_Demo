import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  CreateRfqStep1,
  CreateRfqStep2,
  CreateRfqStep3Summary,
} from '../../components/features/create-rfq';
import type { useCreateRfqState } from '../../hooks/useCreateRfqState';

type CreateRfqState = ReturnType<typeof useCreateRfqState>;
type CreateRfqMobileProps = { state: CreateRfqState };

export function CreateRfqMobile({ state }: CreateRfqMobileProps) {
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={handleBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">คำขอใบเสนอราคา</p>
            <h1 className="text-[17px] font-bold text-gray-900">สร้าง RFQ ใหม่</h1>
          </div>
          <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100 shrink-0">
            {currentStep}/{STEPS.length}
          </span>
        </div>

        {/* Progress bar + steps */}
        <div className="space-y-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #6C47FF)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between">
            {STEPS.map((label, idx) => {
              const stepNum = idx + 1;
              const isDone    = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all',
                    isDone    ? 'bg-violet-500 border-violet-500' :
                    isCurrent ? 'bg-white border-violet-500 shadow-sm' : 'bg-white border-gray-200'
                  )}>
                    {isDone
                      ? <CheckCircle2 size={13} className="text-white" />
                      : <span style={{ color: isCurrent ? '#6C47FF' : '#94A3B8' }}>{stepNum}</span>
                    }
                  </div>
                  <span className={cn('text-[9px] font-semibold whitespace-nowrap',
                    isCurrent ? 'text-violet-600' : isDone ? 'text-gray-500' : 'text-gray-300')}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Form content ── */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
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
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <CreateRfqStep2
                form={form}
                units={units}
                onUpdate={updateForm}
              />
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
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
      </main>

      {/* ── Fixed bottom CTA ── */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] px-4 py-4 z-20">
        {submitError && (
          <p className="text-[12px] text-red-500 text-center mb-2 font-medium">{submitError}</p>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={!canProceed || submitting}
          className={cn(
            'w-full py-4 rounded-2xl text-white font-bold text-[15px] shadow-lg flex items-center justify-center gap-2 transition-all',
            canProceed && !submitting
              ? 'shadow-violet-200/50'
              : 'opacity-50 cursor-not-allowed',
          )}
          style={{ background: 'linear-gradient(135deg, #5B21B6, #6C47FF)' }}
        >
          {submitting ? (
            <><Loader2 size={17} className="animate-spin" /> กำลังส่งคำขอ...</>
          ) : currentStep === 3 ? (
            <><FileText size={17} /> ส่งคำขอใบเสนอราคา</>
          ) : (
            <>ถัดไป →</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
