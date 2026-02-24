import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Box, Image as ImageIcon, DollarSign, Package, CheckCircle2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "../../lib/utils";

const steps = ["Project Details", "Requirements", "Review"];

export function CreateRfq() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
    else navigate("/rfqs"); // Final submit
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    else navigate(-1); // Go back to previous page
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between z-10 sticky top-0 bg-slate-50/80 backdrop-blur-md">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 transition-colors">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">New Request</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between relative z-0">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full" />
          <motion.div
            className="absolute top-1/2 left-0 h-1 bg-[#6C5CE7] -z-10 -translate-y-1/2 rounded-full origin-left"
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
                      ? "bg-[#6C5CE7] border-[#6C5CE7] text-white"
                      : "bg-white border-slate-300 text-slate-400"
                  )}
                  animate={isCurrent ? { scale: 1.1 } : { scale: 1 }}
                >
                  {isActive && stepNum < currentStep ? <CheckCircle2 size={16} /> : stepNum}
                </motion.div>
                <span
                  className={cn(
                    "text-xs font-semibold absolute -bottom-5 whitespace-nowrap",
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
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Project Category</label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[15px] rounded-2xl p-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7] font-medium">
                      <option>Select Category</option>
                      <option>Packaging</option>
                      <option>Electronics</option>
                      <option>Apparel</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Custom Printed Mailer Boxes"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7] font-medium placeholder:text-slate-400"
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
                      <Package size={14} className="text-indigo-400" /> Quantity
                    </label>
                    <input
                      type="number"
                      placeholder="Units"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7] font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={14} className="text-emerald-400" /> Target Budget
                    </label>
                    <input
                      type="text"
                      placeholder="USD (Optional)"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7] font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Reference Images / Files</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-[#6C5CE7] mb-1">
                      <ImageIcon size={24} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700">Tap to upload files</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 10MB</p>
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
                <h3 className="font-bold text-lg text-slate-800 mb-4 pb-4 border-b border-slate-100">Summary</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project</span>
                    <p className="font-bold text-slate-800">Custom Printed Mailer Boxes</p>
                    <p className="text-sm text-slate-500">Packaging</p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Details</span>
                    <p className="font-bold text-slate-800">10,000 Units</p>
                    <p className="text-sm text-slate-500">Target: $2,000 - $3,500</p>
                  </div>

                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attached Files</span>
                    <div className="flex gap-2">
                       <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                         <ImageIcon size={20} />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="text-[#6C5CE7] shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-indigo-900 font-medium">Your request will be sent to 50+ verified suppliers matching your criteria.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white border-t border-slate-100 z-20 shadow-[0_-10px_30px_rgb(0,0,0,0.05)]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full bg-[#6C5CE7] text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2"
        >
          {currentStep === 3 ? "Submit Request" : "Continue"}
        </motion.button>
      </div>
    </div>
  );
}
