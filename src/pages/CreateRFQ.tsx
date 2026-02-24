import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Check, ChevronDown, Package, PenTool, Image as ImageIcon, Camera, Upload, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils/cn";

const steps = ["Details", "Specs", "Review"];

export function CreateRFQ() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Submit
      navigate("/rfqs", { state: { new: true } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-slate-100">
        <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Create Request</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Progress Bar */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-between relative z-10">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-violet-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <div key={step} className="flex flex-col items-center gap-2 relative bg-white px-2">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm",
                    isActive ? "bg-violet-600 text-white ring-4 ring-violet-100 scale-110" : 
                    isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  )}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : idx + 1}
                </div>
                <span className={cn(
                  "text-xs font-semibold absolute -bottom-6 w-max text-center transition-colors duration-300",
                  isActive ? "text-violet-700" : isCompleted ? "text-emerald-600" : "text-slate-400"
                )}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 appearance-none font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none shadow-sm">
                      <option>Select a category...</option>
                      <option>Apparel & Textiles</option>
                      <option>Packaging & Printing</option>
                      <option>Consumer Electronics</option>
                      <option>Home & Garden</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 500 Custom Tote Bags" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Description</label>
                  <textarea 
                    rows={4} 
                    placeholder="Describe your requirements in detail..." 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none shadow-sm resize-none transition-all"
                  ></textarea>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Quantity</label>
                    <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-violet-500 outline-none shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Target Price ($)</label>
                    <input type="number" placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-violet-500 outline-none shadow-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Reference Images</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                      <Upload size={24} strokeWidth={2.5} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700">Tap to upload</p>
                      <p className="text-xs font-medium text-slate-400 mt-1">PNG, JPG, PDF up to 10MB</p>
                    </div>
                  </div>
                  {/* Mock Uploaded Files */}
                  <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0 group">
                      <img src="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=150&h=150" alt="mock" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Remove</span>
                      </div>
                    </div>
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0 group">
                      <img src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=150&h=150" alt="mock" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Remove</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Custom Tote Bags</h3>
                      <p className="text-sm font-medium text-slate-500">Apparel & Textiles</p>
                    </div>
                    <button className="text-violet-600 hover:bg-violet-50 p-2 rounded-xl transition-colors">
                      <PenTool size={18} />
                    </button>
                  </div>
                  
                  <div className="h-px w-full bg-slate-100"></div>
                  
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                      <p className="text-slate-400 font-medium mb-1">Quantity</p>
                      <p className="font-bold text-slate-800">500 pcs</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium mb-1">Target Price</p>
                      <p className="font-bold text-slate-800">$2.50 / pc</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 font-medium mb-1">Description</p>
                      <p className="font-medium text-slate-700 leading-relaxed">10oz cotton canvas tote bags, 15x15 inches with 22-inch handles. Screen print 1 color on one side. Need sample before full production.</p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-100"></div>

                  <div>
                    <p className="text-slate-400 font-medium text-sm mb-3">Attachments (2)</p>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=100&h=100" alt="mock" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=100&h=100" alt="mock" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100">
                  <div className="text-amber-500 shrink-0 mt-0.5">
                    <Zap size={20} className="fill-amber-500" />
                  </div>
                  <p className="text-sm font-medium text-amber-800">Your RFQ will be sent to matched factories instantly. Expect quotes within 24-48 hours.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 pb-8">
        <button 
          onClick={handleNext}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-2xl py-4 font-bold text-lg shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_25px_rgba(124,58,237,0.4)] transition-all flex justify-center items-center gap-2 group"
        >
          {currentStep === steps.length - 1 ? (
            <>Submit RFQ <Check size={20} className="group-hover:scale-110 transition-transform" strokeWidth={3} /></>
          ) : (
            <>Continue <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} /></>
          )}
        </button>
      </div>
    </div>
  );
}
