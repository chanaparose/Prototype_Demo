import { useState } from "react";
import { Link } from "react-router";
import { Search, Filter, MoreVertical, Clock, CheckCircle2, ChevronRight, Layers, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ACTIVE_RFQS = [
  {
    id: 1,
    title: "Grocery Shopping App Bags",
    category: "Packaging",
    date: "10:00 AM, May 24",
    status: "Active",
    offers: 5,
    budget: "$25,000",
    color: "violet",
  },
  {
    id: 2,
    title: "Eco-friendly Water Bottles",
    category: "Plastics",
    date: "12:00 PM, May 23",
    status: "Reviewing",
    offers: 2,
    budget: "$10,000",
    color: "pink",
  },
  {
    id: 3,
    title: "Branded Staff T-Shirts",
    category: "Apparel",
    date: "09:00 AM, May 20",
    status: "Draft",
    offers: 0,
    budget: "$1,500",
    color: "orange",
  },
];

export function RFQs() {
  const [tab, setTab] = useState<"active" | "history">("active");

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-[#F4F1FF] via-[#F8F9FE] to-[#FEF1F5] opacity-70" />

      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/50 backdrop-blur-xl z-40 border-b border-slate-100/50">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My RFQs</h1>
        <div className="flex gap-2">
          <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-slate-600 hover:text-[#6842FF]">
            <Search size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-slate-600 hover:text-[#6842FF]">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Segment Control */}
      <div className="px-6 my-6">
        <div className="bg-white p-1 rounded-2xl flex shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              tab === "active"
                ? "bg-[#6842FF] text-white shadow-[0_4px_12px_rgba(104,66,255,0.3)]"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Active Requests
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              tab === "history"
                ? "bg-[#6842FF] text-white shadow-[0_4px_12px_rgba(104,66,255,0.3)]"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 flex-1">
        <AnimatePresence mode="wait">
          {tab === "active" ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {ACTIVE_RFQS.map((rfq) => (
                <Link key={rfq.id} to={`/comparison/${rfq.id}`} className="block">
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-[#6842FF]/20 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          rfq.color === 'violet' ? 'bg-[#F1EEFF] text-[#6842FF]' :
                          rfq.color === 'pink' ? 'bg-pink-50 text-pink-500' :
                          'bg-orange-50 text-orange-500'
                        }`}>
                          <Layers size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-1">{rfq.category}</p>
                          <h3 className="font-bold text-slate-800 leading-tight">{rfq.title}</h3>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreVertical size={20} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={16} />
                        {rfq.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-green-500" />
                        {rfq.budget}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      {rfq.offers > 0 ? (
                        <div className="inline-flex items-center gap-2 bg-[#F1EEFF] px-3 py-1.5 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-[#6842FF] animate-pulse" />
                          <span className="text-xs font-bold text-[#6842FF]">{rfq.offers} Offers Received</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                          <span className="text-xs font-bold text-slate-500">Waiting for offers</span>
                        </div>
                      )}

                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#6842FF] group-hover:text-white transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                <LayoutGrid size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No History Yet</h3>
              <p className="text-slate-500 mb-8 max-w-[250px] mx-auto">
                Completed and cancelled requests will appear here.
              </p>
              <Link to="/create-rfq" className="bg-[#6842FF] text-white px-8 py-3.5 rounded-2xl font-bold shadow-[0_8px_20px_rgba(104,66,255,0.3)] hover:scale-105 transition-transform">
                Create New RFQ
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}