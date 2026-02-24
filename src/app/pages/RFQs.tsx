import { useState } from "react";
import { Search, Filter, ChevronRight, CheckCircle2, Clock, Zap } from "lucide-react";
import { Link } from "react-router";
import { ACTIVE_RFQS, RFQ_HISTORY } from "../utils/mockData";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";

export function RFQs() {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const data = activeTab === "active" ? ACTIVE_RFQS : RFQ_HISTORY;

  return (
    <div className="flex flex-col min-h-full px-5 pt-10 pb-32 w-full max-w-md mx-auto relative z-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My RFQs</h1>
        <button className="p-2 bg-white rounded-full shadow-sm text-slate-700">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Segmented Control */}
      <div className="bg-slate-200/50 p-1.5 rounded-2xl flex mb-6 relative">
        <motion.div
          layoutId="rfq-tab-indicator"
          className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm"
          animate={{ x: activeTab === "history" ? "100%" : "0%" }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
        {(["active", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex-1 relative z-10 py-2.5 text-sm font-bold capitalize transition-colors rounded-xl",
              activeTab === tab ? "text-violet-700" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab} Requests
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {data.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 mt-4"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No {activeTab} RFQs yet</h3>
              <p className="text-sm text-slate-500 mb-6">Start a new request to get quotes from top-rated factories.</p>
              <Link to="/create-rfq" className="inline-block bg-violet-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgba(109,40,217,0.39)] hover:bg-violet-700 transition-colors">
                Create RFQ
              </Link>
            </motion.div>
          ) : (
            data.map((rfq, i) => (
              <motion.div
                key={rfq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={activeTab === 'active' ? `/rfqs/${rfq.id}/compare` : '#'}
                  className="block bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{rfq.category}</span>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight mt-1">{rfq.title}</h3>
                    </div>
                    {/* Status Chip highlighted if it has offers */}
                    <div className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                      rfq.offers > 0 && activeTab === 'active' ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"
                    )}>
                      {rfq.offers} {rfq.offers === 1 ? 'Offer' : 'Offers'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(rfq.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    
                    {activeTab === 'active' && rfq.offers > 0 && (
                      <div className="flex items-center text-violet-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                        Compare <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    )}
                    {activeTab === 'history' && (
                      <div className="flex items-center text-slate-400 font-medium text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-slate-300" /> Closed
                      </div>
                    )}
                  </div>

                  {/* Highlight bar at bottom if active with offers */}
                  {activeTab === 'active' && rfq.offers > 0 && (
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500 w-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  )}
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
