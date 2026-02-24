import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Circle, MessageCircle, MapPin, PackageCheck, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

const TIMELINE = [
  {
    id: 1,
    title: "Order Placed & Deposit Paid",
    date: "May 10",
    status: "completed",
    desc: "Payment confirmed by Apex Mfg.",
  },
  {
    id: 2,
    title: "Material Sourcing",
    date: "May 15",
    status: "completed",
    desc: "Canvas fabrics secured. Ready for cut & sew.",
    photos: ["https://images.unsplash.com/photo-1760328715293-6410199deca5?auto=format&fit=crop&q=80&w=400"],
  },
  {
    id: 3,
    title: "Production & QC",
    date: "May 25",
    status: "current",
    desc: "50% completed. Passed first QC check.",
    photos: ["https://images.unsplash.com/photo-1768796371809-95b49943a48b?auto=format&fit=crop&q=80&w=400"],
  },
  {
    id: 4,
    title: "Final Payment & Shipping",
    date: "Est. June 5",
    status: "upcoming",
  },
  {
    id: 5,
    title: "Delivered",
    date: "Est. June 15",
    status: "upcoming",
  },
];

export function OrderDetail() {
  const { id } = useParams();
  const [photoView, setPhotoView] = useState<string | null>(null);

  const currentStep = TIMELINE.findIndex((t) => t.status === "current");
  const progressPercent = (currentStep / (TIMELINE.length - 1)) * 100;

  // Let's pretend it's reached the "Delivered" stage for testing the FAB
  const isDelivered = false; // Set to true to see "Confirm Receipt"

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FE] overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-t from-[#F4F1FF] via-[#F8F9FE] to-white opacity-80" />

      {/* Header */}
      <div className="flex flex-col px-6 pt-12 pb-6 bg-white/80 backdrop-blur-xl z-50 sticky top-0 shadow-[0_4px_30px_rgb(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-6">
          <Link to="/orders" className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-700 rounded-full hover:bg-slate-100 transition shadow-sm border border-slate-100">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-800">Apex Mfg.</h1>
            <p className="text-xs font-semibold text-slate-500">PO #847291</p>
          </div>
          <Link to={`/chat/f1`} className="w-10 h-10 flex items-center justify-center bg-[#F1EEFF] text-[#6842FF] rounded-full hover:bg-violet-100 transition shadow-sm">
            <MessageCircle size={20} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Visual Progress Bar (Top) */}
        <div className="relative pt-4">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-slate-100 rounded-full -z-10" />
          <motion.div 
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-[#6842FF] rounded-full shadow-[0_0_8px_rgba(104,66,255,0.4)] -z-10"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <div className="flex justify-between items-center px-1">
            {TIMELINE.map((step, idx) => (
              <div key={step.id} className="relative group">
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                  step.status === "completed" ? "bg-[#6842FF] border-[#6842FF] ring-4 ring-[#6842FF]/20" :
                  step.status === "current" ? "bg-white border-[#6842FF] ring-4 ring-[#6842FF]/30 w-5 h-5 -translate-y-0.5" :
                  "bg-white border-slate-300"
                }`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar pb-32">
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Grocery Shopping Bags</h2>
          <div className="flex gap-4 text-sm font-semibold text-slate-500">
            <span>Qty: 10,000</span>
            <span>Total: $23,500</span>
          </div>
        </div>

        {/* Interactive Timeline */}
        <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 ml-2">
          {TIMELINE.map((step, i) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="relative pl-6"
            >
              {/* Timeline dot */}
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center bg-white ${
                step.status === "completed" ? "text-[#6842FF]" : 
                step.status === "current" ? "text-amber-500" : "text-slate-300"
              }`}>
                {step.status === "completed" ? (
                  <CheckCircle2 size={24} className="bg-white rounded-full" />
                ) : step.status === "current" ? (
                  <Circle size={20} fill="currentColor" className="animate-pulse" />
                ) : (
                  <Circle size={16} strokeWidth={3} />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold text-lg ${
                    step.status === "upcoming" ? "text-slate-400" : "text-slate-800"
                  }`}>{step.title}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    step.status === "completed" ? "bg-green-50 text-green-600" :
                    step.status === "current" ? "bg-amber-50 text-amber-600" :
                    "bg-slate-50 text-slate-400"
                  }`}>
                    {step.date}
                  </span>
                </div>
                {step.desc && (
                  <p className="text-sm font-medium text-slate-500 mb-3 leading-relaxed">{step.desc}</p>
                )}
                
                {/* Milestone Photos */}
                {step.photos && step.photos.length > 0 && (
                  <div className="flex gap-3 mt-3 overflow-x-auto no-scrollbar pb-2">
                    {step.photos.map((photo, idx) => (
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={idx}
                        onClick={() => setPhotoView(photo)}
                        className="relative w-24 h-24 rounded-[16px] overflow-hidden shadow-sm cursor-zoom-in group border-2 border-transparent hover:border-[#6842FF]/30 transition-all shrink-0"
                      >
                        <img src={photo} alt={`Milestone ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-white bg-black/50 px-2 py-1 rounded-lg text-[10px] font-bold">View</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      {/* Show only if delivered or specific status */}
      <AnimatePresence>
        {(isDelivered || currentStep === 2) && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
          >
            {isDelivered ? (
              <button className="w-full bg-[#6842FF] text-white py-4 rounded-[20px] font-bold text-lg flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(104,66,255,0.4)] hover:bg-[#5a39db] transition-all">
                <PackageCheck size={24} />
                Confirm Receipt
              </button>
            ) : (
              <div className="bg-white p-4 rounded-[24px] shadow-[0_12px_40px_rgb(0,0,0,0.1)] border border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">QC Needs Approval</p>
                    <p className="text-xs text-slate-500 font-medium">Review latest photos</p>
                  </div>
                </div>
                <button className="bg-[#6842FF] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_12px_rgba(104,66,255,0.3)]">
                  Approve
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Photo Modal */}
      <AnimatePresence>
        {photoView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPhotoView(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={photoView} 
              alt="Fullscreen view" 
              className="max-w-full max-h-[80vh] rounded-[24px] shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}