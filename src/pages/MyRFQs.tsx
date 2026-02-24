import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Package, Search, ChevronRight, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../utils/cn";

const rfqs = [
  { id: 1, title: "Custom Canvas Tote Bags", qty: "500 pcs", status: "active", offers: 5, date: "Oct 12, 2023", category: "Apparel & Textiles" },
  { id: 2, title: "Eco-friendly Mailer Boxes", qty: "2000 pcs", status: "active", offers: 2, date: "Oct 10, 2023", category: "Packaging" },
  { id: 3, title: "Bluetooth Speakers", qty: "1000 pcs", status: "completed", offers: 4, date: "Sep 28, 2023", category: "Electronics" },
  { id: 4, title: "Silicone Phone Cases", qty: "5000 pcs", status: "cancelled", offers: 0, date: "Aug 15, 2023", category: "Electronics" },
];

export function MyRFQs() {
  const [activeTab, setActiveTab] = useState("active");

  const filtered = rfqs.filter(r => 
    activeTab === "active" ? r.status === "active" : r.status !== "active"
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-slate-50 min-h-screen"
    >
      <header className="px-6 py-8 bg-white pb-6 rounded-b-3xl shadow-[0_4px_30px_rgb(0,0,0,0.03)] z-10 sticky top-0">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">My RFQs</h1>
        
        {/* Segmented Control */}
        <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-slate-200">
          <button 
            onClick={() => setActiveTab("active")}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative",
              activeTab === "active" 
                ? "bg-white text-violet-700 shadow-[0_2px_15px_rgba(0,0,0,0.05)] ring-1 ring-black/5" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Active Requests
            {activeTab === "active" && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative",
              activeTab === "history" 
                ? "bg-white text-violet-700 shadow-[0_2px_15px_rgba(0,0,0,0.05)] ring-1 ring-black/5" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            History
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-4 pb-32 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Package size={48} strokeWidth={1} />
            <p className="font-medium">No {activeTab} RFQs found.</p>
          </div>
        ) : (
          filtered.map((rfq) => (
            <Link 
              key={rfq.id} 
              to={rfq.status === "active" ? `/rfqs/compare/${rfq.id}` : "#"}
              className="block bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] transition-all duration-300 group relative overflow-hidden"
            >
              {/* Highlight bar for active with offers */}
              {rfq.status === "active" && rfq.offers > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 group-hover:w-2 transition-all"></div>
              )}

              <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{rfq.category}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-xs font-semibold text-slate-400">{rfq.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-violet-700 transition-colors leading-tight">
                    {rfq.title}
                  </h3>
                </div>
                
                {rfq.status === "active" ? (
                  <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors flex-shrink-0 ml-4">
                    <ChevronRight size={20} />
                  </div>
                ) : (
                  <div className={cn("p-1.5 rounded-full flex-shrink-0 ml-4", rfq.status === "completed" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                    {rfq.status === "completed" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-5 pl-2">
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl font-medium text-sm border border-slate-100">
                  <Package size={16} />
                  {rfq.qty}
                </div>

                {rfq.status === "active" && (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-sm border shadow-sm transition-all",
                    rfq.offers > 0 
                      ? "bg-violet-50 border-violet-200 text-violet-700 animate-pulse" 
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  )}>
                    {rfq.offers > 0 ? (
                      <>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                        </span>
                        {rfq.offers} Offers Received
                      </>
                    ) : (
                      <>
                        <Clock size={16} />
                        Waiting for offers
                      </>
                    )}
                  </div>
                )}
                
                {rfq.status === "completed" && (
                  <span className="text-sm font-bold text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-xl">Order Placed</span>
                )}
                {rfq.status === "cancelled" && (
                  <span className="text-sm font-bold text-rose-500 px-3 py-1.5 bg-rose-50 rounded-xl">Cancelled</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

    </motion.div>
  );
}
