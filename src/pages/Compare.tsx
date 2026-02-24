import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronDown, ChevronUp, Zap, Star, ShieldCheck, Check, Info } from "lucide-react";
import { cn } from "../utils/cn";

export function Compare() {
  const [specOpen, setSpecOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-slate-50 flex flex-col"
    >
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-20 border-b border-slate-100 shadow-[0_4px_30px_rgb(0,0,0,0.03)]">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">Compare Offers</h1>
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Custom Tote Bags</p>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Spec Summary (Collapsible) */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm">
          <button 
            onClick={() => setSpecOpen(!specOpen)}
            className="w-full flex items-center justify-between py-2 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 group-hover:scale-105 transition-transform shadow-inner">
                <Info size={20} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span className="font-bold text-slate-800 block leading-tight">Your Requirements</span>
                <span className="text-xs font-medium text-slate-400">500 pcs • Target $2.50</span>
              </div>
            </div>
            {specOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400 group-hover:text-violet-500 transition-colors" />}
          </button>
          
          <AnimatePresence>
            {specOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 text-sm font-medium text-slate-600 border-t border-slate-50 mt-4 leading-relaxed">
                  10oz cotton canvas tote bags, 15x15 inches with 22-inch handles. Screen print 1 color on one side.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Recommendation Banner */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 text-white shadow-[0_15px_30px_rgba(99,102,241,0.3)] relative overflow-hidden flex gap-4 items-start group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner flex-shrink-0">
              <Zap className="text-amber-300 fill-amber-300" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 tracking-tight">
                AI Suggestion <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Best Value</span>
              </h3>
              <p className="text-sm text-violet-100 font-medium leading-relaxed mt-1">
                <strong className="text-white">EcoPack Solutions</strong> offers the best balance of price ($2.40/pc) and lead time (12 days) with a 98% quality rating.
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden relative">
            
            {/* Table Headers */}
            <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/50">
              {/* Factory A */}
              <div className="p-5 border-r border-slate-100 flex flex-col items-center text-center relative overflow-hidden group hover:bg-white transition-colors cursor-pointer">
                <div className="absolute top-0 left-0 w-full h-1 bg-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 p-1 mb-3">
                  <img src="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=100&h=100" alt="EcoPack" className="w-full h-full object-cover rounded-xl" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">EcoPack Solutions</h4>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mt-1.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" /> 4.9 <span className="text-slate-300">|</span> <ShieldCheck size={12} className="text-emerald-500" /> Verified
                </div>
              </div>
              
              {/* Factory B */}
              <div className="p-5 flex flex-col items-center text-center relative overflow-hidden group hover:bg-white transition-colors cursor-pointer">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-300 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 p-1 mb-3">
                  <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=100&h=100" alt="Alpha" className="w-full h-full object-cover rounded-xl" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Alpha Textiles Mfg</h4>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mt-1.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" /> 4.6 <span className="text-slate-300">|</span> <ShieldCheck size={12} className="text-emerald-500" /> Verified
                </div>
              </div>
            </div>

            {/* Price Row */}
            <div className="grid grid-cols-2 border-b border-slate-100 text-center">
              <div className="p-4 border-r border-slate-100 bg-violet-50/30">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                <p className="text-xl font-black text-violet-700">$2.40</p>
                <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-full mt-1">4% under budget</p>
              </div>
              <div className="p-4 bg-slate-50/30">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                <p className="text-xl font-black text-slate-800">$2.55</p>
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 inline-block px-2 py-0.5 rounded-full mt-1">2% over budget</p>
              </div>
            </div>

            {/* Lead Time Row */}
            <div className="grid grid-cols-2 border-b border-slate-100 text-center">
              <div className="p-4 border-r border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Time</p>
                <p className="font-bold text-slate-800">12 Days</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Time</p>
                <p className="font-bold text-slate-800">10 Days</p>
              </div>
            </div>

            {/* Sample Row */}
            <div className="grid grid-cols-2 border-b border-slate-100 text-center">
              <div className="p-4 border-r border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sample Cost</p>
                <p className="font-bold text-slate-800">Free</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sample Cost</p>
                <p className="font-bold text-slate-800">$50</p>
              </div>
            </div>

            {/* Actions Row */}
            <div className="grid grid-cols-2 p-4 gap-4 bg-slate-50/50">
              <Link to="/messages/chat/1" className="bg-violet-600 hover:bg-violet-700 text-white rounded-2xl py-3.5 font-bold text-sm flex justify-center items-center gap-2 shadow-[0_8px_20px_rgba(124,58,237,0.3)] transition-all group">
                Chat & Accept
              </Link>
              <Link to="/messages/chat/2" className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl py-3.5 font-bold text-sm flex justify-center items-center gap-2 shadow-sm transition-all">
                Message
              </Link>
            </div>
          </div>
          
          <div className="text-center pt-2">
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600">View 3 more offers</button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
