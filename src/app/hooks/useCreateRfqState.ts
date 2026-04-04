import React from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../contexts/DataContext';
import {
  INITIAL_FORM,
  STEPS,
  type CreateRfqForm,
} from '../components/features/create-rfq';

const MOCK_FORM_STEP3: CreateRfqForm = {
  categoryId: 'pet_food',
  factoryType: 'อาหารสัตว์',
  projectName: 'อาหารสัตว์แห้งสูตรลูกสุนัข',
  description:
    'ต้องการผลิตอาหารสัตว์แห้งสูตรลูกสุนัข จำนวน 1,000 กระสอบ ขนาด 2 กก./ถุง มาตรฐาน GMP และ อย. ต้องมีวันผลิตและวันหมดอายุบนบรรจุภัณฑ์',
  quantity: '1000',
  budget: '50000',
  material: 'เนื้อไก่, ข้าว, วิตามิน, โปรตีนจากพืช',
  deadline: '2026-03-15',
};

export function useCreateRfqState() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [form, setForm] = React.useState<CreateRfqForm>(INITIAL_FORM);
  const navigate = useNavigate();
  const data = useData();
  const categories = data.categories;
  const factories = data.factories;

  const displayForm =
    currentStep === 3 && !form.projectName ? MOCK_FORM_STEP3 : form;

  const displayCategoryName =
    categories.find((c) => c.id === displayForm.categoryId)?.name ?? '-';

  const factoryTypes = React.useMemo(() => {
    const tags = factories.flatMap((f) => f.tags ?? []);
    return Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b, 'th'));
  }, [factories]);

  const matchedFactories = React.useMemo(() => {
    const t = displayForm.factoryType?.trim();
    if (!t) return [];
    const q = t.toLowerCase();
    return factories.filter((f) => {
      const matchTag = (f.tags ?? []).some((x) => x.toLowerCase() === q);
      const matchSpec = f.specialization?.toLowerCase().includes(q);
      return matchTag || matchSpec;
    });
  }, [displayForm.factoryType, factories]);

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

  return {
    // steps
    STEPS,
    currentStep,
    setCurrentStep,

    // form
    form,
    updateForm,
    displayForm,
    displayCategoryName,
    factoryTypes,
    matchedFactories,

    // navigation handlers
    handleNext,
    handleBack,

    // static data
    categories,
  };
}

