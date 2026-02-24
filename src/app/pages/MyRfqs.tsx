import { useState } from "react";
import { Clock, CheckCircle2, ChevronRight, Briefcase } from "lucide-react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";

export default function MyRfqs() {
  const [tab, setTab] = useState("active");

  return (
    <div className="min-h-full px-6 pt-12 pb-24 relative z-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-6">My Projects</h1>
        
        {/* Segment Control */}
        <div className="bg-slate-100 p-1 rounded-[20px] flex items-center shadow-inner">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 py-3 text-sm font-bold rounded-[16px] transition-all ${
              tab === "active"
                ? "bg-white text-[#6035F0] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Active Requests
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-3 text-sm font-bold rounded-[16px] transition-all ${
              tab === "history"
                ? "bg-white text-[#6035F0] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            History
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {tab === "active" ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Card 1 - High Priority */}
              <Link to="/rfqs/compare" className="block group">
                <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-white hover:border-indigo-100 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-50 rounded-[14px] flex items-center justify-center text-[#6035F0]">
                        <Briefcase className="w-6 h-6" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-[15px]">Grocery App Bags</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Updated 2h ago
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Highlight */}
                  <div className="bg-gradient-to-r from-[#6035F0]/10 to-indigo-50/50 rounded-[16px] p-4 flex items-center justify-between mt-2 group-hover:bg-[#6035F0]/15 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[#6035F0] text-sm font-bold tracking-tight">5 Offers Received</span>
                      <span className="text-xs font-semibold text-slate-500 mt-1">Ready for review</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#6035F0]">
                      <ChevronRight className="w-4 h-4" strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card 2 - Pending */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 rounded-[14px] flex items-center justify-center text-amber-500">
                      <Briefcase className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-[15px]">Custom Wooden Chairs</h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Posted 1d ago
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 rounded-[16px] p-4 flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-amber-600 text-sm font-bold tracking-tight">Awaiting Offers</span>
                    <span className="text-xs font-semibold text-amber-600/60 mt-1">Suppliers are reviewing</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-500">
                    <Clock className="w-4 h-4" strokeWidth={3} />
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Empty State / Completed Request */}
              <div className="bg-white/60 backdrop-blur rounded-[24px] p-5 border border-slate-100 opacity-70">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-50 rounded-[14px] flex items-center justify-center text-green-500">
                      <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-[15px]">Office Uniform Shirts</h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Completed • May 20, 2025</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button (Alternative quick access) */}
      <Link
        to="/create-rfq"
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#6035F0] text-white rounded-[20px] flex items-center justify-center shadow-[0_8px_24px_rgba(96,53,240,0.4)] hover:scale-105 transition-transform z-40"
      >
        <span className="text-3xl font-light mb-1">+</span>
      </Link>
    </div>
  );
}
