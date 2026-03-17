import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  CreateRfqStep1,
  CreateRfqStep2,
  CreateRfqStep3Summary,
} from '../../components/features/create-rfq';
import type { CreateRfqForm } from '../../components/features/create-rfq';
import type { CategoryItem } from '../../data/mockData';
import type { useCreateRfqState } from '../../hooks/useCreateRfqState';

type CreateRfqState = ReturnType<typeof useCreateRfqState>;

type CreateRfqDesktopProps = {
  state: CreateRfqState;
};

export function CreateRfqDesktop({ state }: CreateRfqDesktopProps) {
  const {
    STEPS,
    currentStep,
    form,
    displayForm,
    displayCategoryName,
    categories,
    factoryTypes,
    matchedFactories,
    updateForm,
    handleNext,
    handleBack,
  } = state;

  return (
    <div className="hidden lg:flex min-h-[calc(100vh-4rem)] flex-col bg-slate-50">
      {/* Header */}
      <header className="px-10 pt-10 pb-4 flex items-center justify-between bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-slate-200/60 transition-colors"
            type="button"
          >
            <ArrowLeft size={22} className="text-slate-800" />
          </button>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">สร้างคำขอใบเสนอราคา</p>
            <h1 className="text-2xl font-bold text-slate-900">สร้าง RFQ ใหม่</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            ขั้นตอนที่ {currentStep} จาก {STEPS.length}
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex px-10 py-8 gap-6">
        {/* Left: Form + Stepper */}
        <div className="flex-1 flex flex-col gap-6 max-w-3xl">
          {/* Stepper */}
          <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between relative z-0">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full" />
              <motion.div
                className="absolute top-1/2 left-0 h-1 bg-[#6C47FF] -z-10 -translate-y-1/2 rounded-full origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: (currentStep - 1) / 2 }}
                transition={{ duration: 0.3 }}
              />
              {STEPS.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep >= stepNum;
                const isCurrent = currentStep === stepNum;
                return (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <motion.div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                        isActive
                          ? 'bg-[#6C47FF] border-[#6C47FF] text-white'
                          : 'bg-white border-slate-300 text-slate-400',
                      )}
                      animate={isCurrent ? { scale: 1.05 } : { scale: 1 }}
                    >
                      {isActive && stepNum < currentStep ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        stepNum
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        'text-[11px] font-semibold text-center max-w-[120px]',
                        isActive ? 'text-slate-800' : 'text-slate-400',
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Steps */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 px-8 py-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  <CreateRfqStep1
                    form={form as CreateRfqForm}
                    categories={categories as CategoryItem[]}
                    factoryTypes={factoryTypes}
                    onUpdate={updateForm}
                  />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  <CreateRfqStep2 form={form as CreateRfqForm} onUpdate={updateForm} />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  <CreateRfqStep3Summary
                    form={displayForm as CreateRfqForm}
                    categoryName={displayCategoryName}
                    matchedFactories={matchedFactories}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom actions (desktop) */}
          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ย้อนกลับ
            </button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="px-8 py-3 rounded-full bg-[#6C47FF] text-white font-semibold text-sm shadow-md shadow-violet-200/60 flex items-center gap-2"
            >
              {currentStep === 3 ? 'ส่งคำขอใบเสนอราคา' : 'ถัดไป'}
            </motion.button>
          </div>
        </div>

        {/* Right: Summary / Preview */}
        <aside className="w-80 xl:w-96 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              สรุปคำขอ
            </p>
            <h2 className="text-base font-bold text-slate-900 mb-3">
              {displayForm.projectName || 'ยังไม่ได้ระบุชื่อโปรเจกต์'}
            </h2>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">หมวดหมู่</span>
                <span className="font-medium">{displayCategoryName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">ปริมาณโดยประมาณ</span>
                <span className="font-medium">
                  {displayForm.quantity ? `${displayForm.quantity} หน่วย` : '-'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">งบประมาณ</span>
                <span className="font-medium">
                  {displayForm.budget ? `฿${Number(displayForm.budget).toLocaleString()}` : '-'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">กำหนดส่ง</span>
                <span className="font-medium">{displayForm.deadline || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">
              Tips การกรอก RFQ ให้ได้ข้อเสนอที่ดีขึ้น
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>ระบุปริมาณและสเปกให้ชัดเจน</li>
              <li>แนบรายละเอียดวัสดุ หรือมาตรฐานที่ต้องการ</li>
              <li>ระบุ timeline และข้อจำกัดด้านงบประมาณ</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

