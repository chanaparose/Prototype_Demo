import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '../../lib/utils';
import { categories } from '../data/mockData';
import {
  CreateRfqStep1,
  CreateRfqStep2,
  CreateRfqStep3Summary,
  INITIAL_FORM,
  STEPS,
} from '../components/features/create-rfq';
import type { CreateRfqForm } from '../components/features/create-rfq';

const MOCK_FORM_STEP3: CreateRfqForm = {
  categoryId: 'pet_food',
  projectName: 'อาหารสัตว์แห้งสูตรลูกสุนัข',
  description:
    'ต้องการผลิตอาหารสัตว์แห้งสูตรลูกสุนัข จำนวน 1,000 กระสอบ ขนาด 2 กก./ถุง มาตรฐาน GMP และ อย. ต้องมีวันผลิตและวันหมดอายุบนบรรจุภัณฑ์',
  quantity: '1000',
  budget: '50000',
  material: 'เนื้อไก่, ข้าว, วิตามิน, โปรตีนจากพืช',
  deadline: '2026-03-15',
};

export function CreateRfq() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<CreateRfqForm>(INITIAL_FORM);
  const navigate = useNavigate();

  const displayForm = currentStep === 3 && !form.projectName ? MOCK_FORM_STEP3 : form;
  const displayCategoryName =
    categories.find((c) => c.id === displayForm.categoryId)?.name ?? '-';

  const updateForm = (key: keyof CreateRfqForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
    else navigate('/orders');
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    else navigate(-1);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-50 relative overflow-hidden">
      <header className="px-6 pt-12 pb-4 flex items-center justify-between z-10 sticky top-0 bg-slate-50/80 backdrop-blur-md">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 transition-colors"
          type="button"
        >
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">สร้างคำขอใบเสนอราคา</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 py-4">
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
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                    isActive
                      ? 'bg-[#6C47FF] border-[#6C47FF] text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  )}
                  animate={isCurrent ? { scale: 1.1 } : { scale: 1 }}
                >
                  {isActive && stepNum < currentStep ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    stepNum
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] font-semibold absolute -bottom-5 whitespace-nowrap text-center max-w-[72px]',
                    isActive ? 'text-slate-800' : 'text-slate-400'
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <CreateRfqStep1 form={form} categories={categories} onUpdate={updateForm} />
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <CreateRfqStep2 form={form} onUpdate={updateForm} />
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <CreateRfqStep3Summary form={displayForm} categoryName={displayCategoryName} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-white border-t border-slate-100 z-20 shadow-[0_-10px_30px_rgb(0,0,0,0.05)]">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full bg-[#6C47FF] text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-violet-200/50 flex items-center justify-center gap-2"
        >
          {currentStep === 3 ? 'ส่งคำขอใบเสนอราคา' : 'ถัดไป'}
        </motion.button>
      </div>
    </div>
  );
}
