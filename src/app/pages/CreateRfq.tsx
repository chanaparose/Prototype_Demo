import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Image as ImageIcon,
  DollarSign,
  Package,
  CheckCircle2,
  ChevronDown,
  Calendar,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "../../lib/utils";
import { categories } from "../data/mockData";

const steps = ["รายละเอียดโปรเจกต์", "ความต้องการและงบประมาณ", "สรุปและส่งคำขอ"];

const initialForm = {
  categoryId: "",
  projectName: "",
  description: "",
  quantity: "",
  budget: "",
  material: "",
  deadline: "",
};

/** ตัวอย่างข้อมูลที่กรอกจาก step 1, 2 สำหรับแสดงใน step 3 (สรุป) */
const mockFormStep1And2 = {
  categoryId: "pet_food",
  projectName: "อาหารสัตว์แห้งสูตรลูกสุนัข",
  description:
    "ต้องการผลิตอาหารสัตว์แห้งสูตรลูกสุนัข จำนวน 1,000 กระสอบ ขนาด 2 กก./ถุง มาตรฐาน GMP และ อย. ต้องมีวันผลิตและวันหมดอายุบนบรรจุภัณฑ์",
  quantity: "1000",
  budget: "50000",
  material: "เนื้อไก่, ข้าว, วิตามิน, โปรตีนจากพืช",
  deadline: "2026-03-15",
};

export function CreateRfq() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const categoryName = selectedCategory?.name ?? "-";

  /** เมื่ออยู่ step 3 ใช้ mock ถ้าผู้ใช้ยังไม่กรอก (แสดงตัวอย่างที่กรอกจาก step 1,2) */
  const displayForm = currentStep === 3 && !form.projectName ? mockFormStep1And2 : form;
  const displayCategory = categories.find((c) => c.id === displayForm.categoryId);
  const displayCategoryName = displayCategory?.name ?? "-";

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
    else navigate("/rfqs");
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    else navigate(-1);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 relative overflow-hidden">
      {/* Header */}
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

      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between relative z-0">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full" />
          <motion.div
            className="absolute top-1/2 left-0 h-1 bg-[#6C47FF] -z-10 -translate-y-1/2 rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (currentStep - 1) / 2 }}
            transition={{ duration: 0.3 }}
          />
          {steps.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep >= stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <motion.div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                    isActive
                      ? "bg-[#6C47FF] border-[#6C47FF] text-white"
                      : "bg-white border-slate-300 text-slate-400"
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
                    "text-[10px] font-semibold absolute -bottom-5 whitespace-nowrap text-center max-w-[72px]",
                    isActive ? "text-slate-800" : "text-slate-400"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
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
              <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    หมวดหมู่สินค้า
                  </label>
                  <div className="relative">
                    <select
                      value={form.categoryId}
                      onChange={(e) => updateForm("categoryId", e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[15px] rounded-2xl p-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium"
                    >
                      <option value="">เลือกหมวดหมู่</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={20}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={14} className="text-[#6C47FF]" /> ชื่อโปรเจกต์ / สินค้า
                  </label>
                  <input
                    type="text"
                    value={form.projectName}
                    onChange={(e) => updateForm("projectName", e.target.value)}
                    placeholder="เช่น อาหารสัตว์แห้งสูตรลูกสุนัข, เสื้อผ้าสัตว์เลี้ยงชุดฤดูร้อน"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="อธิบายความต้องการ เช่น ขนาด สี วัสดุ จำนวนขั้นต่ำ มาตรฐานที่ต้องการ (อย., GMP ฯลฯ)"
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>
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
              <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Package size={14} className="text-[#6C47FF]" /> จำนวนที่ต้องการ
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => updateForm("quantity", e.target.value)}
                      placeholder="หน่วย"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={14} className="text-emerald-500" /> งบประมาณ (บาท)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.budget}
                      onChange={(e) => updateForm("budget", e.target.value)}
                      placeholder="ไม่บังคับ"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    วัสดุ / สเปกที่ต้องการ
                  </label>
                  <input
                    type="text"
                    value={form.material}
                    onChange={(e) => updateForm("material", e.target.value)}
                    placeholder="เช่น ผ้าคอตตอน 100%, ยางธรรมชาติปลอดภัย, เนื้อไก่ ข้าว วิตามิน"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={14} className="text-amber-500" /> ต้องการรับงานภายในวันที่
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => updateForm("deadline", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    รูป/ไฟล์อ้างอิง (ถ้ามี)
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                    <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-[#6C47FF] mb-1">
                      <ImageIcon size={24} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700">แตะเพื่ออัปโหลด</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF ไม่เกิน 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
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
              <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4 pb-4 border-b border-slate-100">
                  สรุปคำขอ
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      โปรเจกต์
                    </span>
                    <p className="font-bold text-slate-800 mt-1">
                      {displayForm.projectName || "-"}
                    </p>
                    <p className="text-sm text-slate-500">{displayCategoryName}</p>
                  </div>
                  {displayForm.description ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        รายละเอียด
                      </span>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-3">{displayForm.description}</p>
                    </div>
                  ) : null}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      ความต้องการ
                    </span>
                    <p className="font-bold text-slate-800 mt-1">
                      {displayForm.quantity ? `${Number(displayForm.quantity).toLocaleString("th-TH")} หน่วย` : "-"}
                    </p>
                    {displayForm.budget && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        งบประมาณเป้าหมาย: ฿{Number(displayForm.budget).toLocaleString("th-TH")}
                      </p>
                    )}
                    {displayForm.material && (
                      <p className="text-sm text-slate-500 mt-0.5">วัสดุ: {displayForm.material}</p>
                    )}
                    {displayForm.deadline && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        ต้องการรับภายใน: {new Date(displayForm.deadline + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      ไฟล์แนบ
                    </span>
                    <div className="flex gap-2 mt-2">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <ImageIcon size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="text-[#6C47FF] shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-violet-900 font-medium">
                  คำขอของคุณจะถูกส่งไปยังโรงงานที่ตรงกับหมวดหมู่และความสามารถ
                  คุณจะได้รับใบเสนอราคาจากหลายโรงงานเพื่อเปรียบเทียบ
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white border-t border-slate-100 z-20 shadow-[0_-10px_30px_rgb(0,0,0,0.05)]">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full bg-[#6C47FF] text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-violet-200/50 flex items-center justify-center gap-2"
        >
          {currentStep === 3 ? "ส่งคำขอใบเสนอราคา" : "ถัดไป"}
        </motion.button>
      </div>
    </div>
  );
}
