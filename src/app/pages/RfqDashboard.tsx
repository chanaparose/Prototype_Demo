import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronRight, MapPin, Box, Image as ImageIcon, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { cn } from "../../lib/utils";

const activeRequests = [
  {
    id: "RFQ-24-001",
    title: "10,000 Custom Printed Mailer Boxes",
    category: "Packaging",
    date: "10 May, 2024",
    status: "offers_received",
    offersCount: 5,
    budget: "$2,000 - $3,500",
    image: "https://images.unsplash.com/photo-1762902070741-c837a832ee7b?w=200&q=80",
  },
  {
    id: "RFQ-24-002",
    title: "Eco-friendly Cotton Tote Bags",
    category: "Apparel",
    date: "12 May, 2024",
    status: "waiting",
    offersCount: 0,
    budget: "$500 - $800",
    image: null,
  },
];

export function RfqDashboard() {
  const [activeTab, setActiveTab] = useState("active");
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md px-6 pt-12 pb-4 flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My RFQs</h1>

        {/* Custom Segmented Control */}
        <div className="relative flex p-1 bg-white rounded-[2rem] shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 items-center justify-between z-0">
          <motion.div
            layoutId="tab-indicator"
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#6C5CE7] rounded-full shadow-md z-[-1]"
            initial={false}
            animate={{ x: activeTab === "active" ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "w-1/2 text-sm font-bold py-3 transition-colors rounded-full",
              activeTab === "active" ? "text-white" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Active Requests
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "w-1/2 text-sm font-bold py-3 transition-colors rounded-full",
              activeTab === "history" ? "text-white" : "text-slate-500 hover:text-slate-800"
            )}
          >
            History
          </button>
        </div>
      </div>

      <div className="px-6 pb-32 pt-4 flex flex-col gap-4 relative">
        <AnimatePresence mode="popLayout">
          {activeTab === "active" ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {activeRequests.map((rfq) => (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  key={rfq.id}
                  onClick={() => rfq.status === "offers_received" ? navigate(`/rfqs/${rfq.id}/compare`) : null}
                  className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 cursor-pointer flex flex-col gap-4 transition-all hover:border-[#6C5CE7]/30"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-4">
                      {/* Thumbnail or Fallback */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                        {rfq.image ? (
                          <img src={rfq.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Box className="text-slate-400" size={24} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{rfq.category}</span>
                        <h3 className="font-bold text-[17px] text-slate-800 leading-snug line-clamp-2 mt-1">{rfq.title}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                          {rfq.date}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Highlight Area */}
                  <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                    <div className="flex items-center gap-2">
                      {rfq.status === "offers_received" ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 animate-pulse-slow">
                            <span className="font-bold text-sm">{rfq.offersCount}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-800">Offers Received</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0">
                            <Box size={14} />
                          </div>
                          <span className="text-sm font-semibold text-slate-500">Awaiting Quotes</span>
                        </>
                      )}
                    </div>
                    
                    {rfq.status === "offers_received" && (
                      <button className="flex items-center gap-1 text-sm font-bold text-[#6C5CE7] bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                        Compare
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Empty State visual hint */}
              <div className="mt-4 p-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <Plus size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Need something else?</h4>
                  <p className="text-sm text-slate-500 mt-1">Create a new RFQ to get more quotes.</p>
                </div>
                <button 
                  onClick={() => navigate("/rfqs/create")}
                  className="mt-2 bg-[#6C5CE7] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md shadow-indigo-200"
                >
                  Create New RFQ
                </button>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-2 shadow-inner">
                <Box size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No History Yet</h3>
              <p className="text-sm text-slate-500 max-w-[250px]">Completed or cancelled requests will appear here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
