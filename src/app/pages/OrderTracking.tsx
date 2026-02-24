import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, Package, Maximize2, X, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ORDER_TIMELINE } from "../utils/mockData";
import { clsx } from "clsx";

export function OrderTracking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // We could fetch real order data here
  const orderTitle = "Aluminum Enclosures";
  const factory = "Precision Metalworks";
  
  // Conditionally show FAB if order is ready to receive
  const showConfirmReceipt = ORDER_TIMELINE.some(t => t.id === 't5' && t.status === 'upcoming'); // Mock logic

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-slate-50 relative z-20 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-30 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-slate-900 truncate">{orderTitle}</h1>
            <p className="text-xs text-slate-500 font-medium">{factory}</p>
          </div>
        </div>
        <button className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full whitespace-nowrap">
          Order Info
        </button>
      </div>

      <div className="px-5 pt-6 pb-6 space-y-8">
        {/* Visual Progress Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Status</p>
              <h2 className="text-lg font-bold text-violet-600">In Production</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Est. Delivery</p>
              <h2 className="text-sm font-bold text-slate-900">Nov 5, 2023</h2>
            </div>
          </div>
          
          <div className="relative pt-2 pb-2">
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-100 rounded-full -translate-y-1/2"></div>
            <motion.div 
              className="absolute top-1/2 left-0 h-1.5 bg-violet-600 rounded-full -translate-y-1/2"
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            
            <div className="flex justify-between relative z-10">
              {[1, 2, 3, 4].map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-colors",
                    step <= 3 ? "bg-violet-600" : "bg-white border-2 border-slate-200 text-slate-400"
                  )}>
                    {step <= 2 ? <CheckCircle2 className="w-4 h-4" /> : step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-violet-600" /> Production Timeline
          </h3>
          
          <div className="space-y-6 relative">
            <div className="absolute top-2 bottom-6 left-3.5 w-0.5 bg-slate-100"></div>
            
            {ORDER_TIMELINE.map((event, i) => (
              <div key={event.id} className="relative pl-10">
                <div className={clsx(
                  "absolute left-2.5 top-1.5 w-2.5 h-2.5 rounded-full ring-4 bg-white",
                  event.status === 'completed' ? "ring-violet-100 bg-violet-600" :
                  event.status === 'current' ? "ring-amber-100 bg-amber-500 animate-pulse" :
                  "ring-slate-50 bg-slate-300"
                )}></div>
                
                <div className={clsx(
                  "flex flex-col gap-1",
                  event.status === 'upcoming' ? "opacity-50" : ""
                )}>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{event.title}</h4>
                  <p className="text-xs font-medium text-slate-500">{event.date}</p>
                  
                  {event.image && (
                    <div 
                      className="mt-3 relative rounded-xl overflow-hidden cursor-zoom-in group border border-slate-100 shadow-sm"
                      onClick={() => setSelectedImage(event.image)}
                    >
                      <img src={event.image} alt={event.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-green-500" /> QC Passed
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action FAB */}
      {showConfirmReceipt && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-5"
        >
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Confirm Receipt & Release Payment
          </button>
        </motion.div>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.2 }}
              src={selectedImage} 
              alt="QC Milestone" 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
