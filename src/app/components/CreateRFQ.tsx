import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, UploadCloud, CheckCircle, PackageSearch, Coins, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function CreateRFQ() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => setStep((p) => Math.min(p + 1, 3));
  const handleBack = () => setStep((p) => Math.max(p - 1, 1));
  
  const handleComplete = () => {
    // Navigate to Dashboard after a brief delay
    setTimeout(() => {
      navigate("/rfqs");
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FE] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-6 bg-white/50 backdrop-blur-xl z-50">
        <Link to="/" className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">New RFQ</h1>
        <div className="w-10 h-10" /> {/* Spacer */}
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full -z-10" />
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#6842FF] rounded-full -z-10"
            initial={{ width: "0%" }}
            animate={{ width: `${(step - 1) * 50}%` }}
            transition={{ duration: 0.3 }}
          />
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 ${
                step >= s
                  ? "bg-[#6842FF] text-white shadow-[0_4px_12px_rgba(104,66,255,0.4)]"
                  : "bg-white text-slate-400 border-2 border-slate-200"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-semibold text-slate-500">
          <span>Details</span>
          <span>Specs</span>
          <span>Review</span>
        </div>
      </div>

      {/* Steps Content */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto no-scrollbar relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
                <label className="text-sm font-bold text-slate-700 mb-2 block">Project Category</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-semibold mb-4">
                  <div className="bg-pink-100 p-2 rounded-xl text-pink-500">
                    <Layers size={20} />
                  </div>
                  <select className="flex-1 bg-transparent outline-none appearance-none font-semibold">
                    <option>Apparel & Garment</option>
                    <option>Packaging & Printing</option>
                    <option>Electronics</option>
                  </select>
                </div>

                <label className="text-sm font-bold text-slate-700 mb-2 block">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g., Grocery Shopping Bags"
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 font-semibold focus:ring-2 focus:ring-[#6842FF] outline-none transition-all"
                  defaultValue="Grocery Shopping App Bags"
                />
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
                <label className="text-sm font-bold text-slate-700 mb-2 block">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your project requirements..."
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 font-medium focus:ring-2 focus:ring-[#6842FF] outline-none transition-all resize-none"
                  defaultValue="Looking to manufacture 10,000 eco-friendly canvas tote bags for a grocery shopping app promotion."
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Quantity</label>
                    <div className="relative">
                      <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 font-semibold focus:ring-2 focus:ring-[#6842FF] outline-none"
                        defaultValue={10000}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Target Price ($)</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 font-semibold focus:ring-2 focus:ring-[#6842FF] outline-none"
                        defaultValue={2.50}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 border-dashed border-2">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-[#F1EEFF] rounded-full flex items-center justify-center text-[#6842FF] mb-4">
                    <UploadCloud size={28} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">Upload Tech Pack</h3>
                  <p className="text-sm text-slate-500 mb-4">PDF, PNG, JPG (Max 20MB)</p>
                  <button className="bg-slate-100 text-slate-700 px-6 py-2 rounded-xl font-bold hover:bg-slate-200 transition">
                    Browse Files
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#6842FF]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#6842FF]/5 rounded-bl-full" />
                <h3 className="text-xl font-bold text-slate-800 mb-6">Review & Submit</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500 font-medium">Project Name</span>
                    <span className="text-slate-800 font-bold text-right">Grocery Shopping Bags</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500 font-medium">Category</span>
                    <span className="text-slate-800 font-bold text-right">Apparel & Garment</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500 font-medium">Quantity</span>
                    <span className="text-slate-800 font-bold text-right">10,000 pcs</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500 font-medium">Target Price</span>
                    <span className="text-slate-800 font-bold text-right">$2.50 / pc</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-green-700 font-semibold">
                    Your RFQ looks great! Factories usually respond within 24-48 hours.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 z-50">
        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition flex-1"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 3 ? handleComplete : handleNext}
            className={`py-4 bg-[#6842FF] text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(104,66,255,0.4)] hover:bg-[#5a39db] transition flex-[2]`}
          >
            {step === 3 ? "Submit RFQ" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}