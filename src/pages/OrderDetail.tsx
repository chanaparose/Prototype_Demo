import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, CheckCircle2, Circle, Clock, Package, Truck, Image as ImageIcon, Check } from "lucide-react";
import { cn } from "../utils/cn";

const milestones = [
  { id: 1, title: "Deposit Paid", date: "Oct 15, 10:30 AM", status: "completed", desc: "$600 transferred to EcoPack Solutions." },
  { id: 2, title: "Material Sourcing", date: "Oct 18, 2:15 PM", status: "completed", desc: "Canvas fabric arrived at factory.", photos: ["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=200&h=200"] },
  { id: 3, title: "Printing Phase", date: "Oct 22, 9:00 AM", status: "completed", desc: "First batch of 100 printed. QC passed.", photos: ["https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200&h=200", "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=200&h=200"] },
  { id: 4, title: "Final QC & Packing", date: "Today, 11:45 AM", status: "current", desc: "Preparing for shipment. Balance payment due." },
  { id: 5, title: "Shipped", date: "Est. Oct 26", status: "pending", desc: "Handover to logistics partner." },
];

export function OrderDetail() {
  const navigate = useNavigate();
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Status is "Final QC & Packing" so we show "Pay Balance" button
  const isReadyForAction = true;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-slate-50 flex flex-col relative"
    >
      {/* Header */}
      <header className="px-6 py-6 flex flex-col sticky top-0 bg-white/90 backdrop-blur-xl z-20 border-b border-slate-100 shadow-[0_4px_30px_rgb(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Order #89201</h1>
          </div>
          <div className="w-10" />
        </div>
        
        {/* Horizontal Progress Bar Summary */}
        <div className="flex justify-between items-center px-2">
          {["Paid", "Making", "Shipped", "Done"].map((step, idx, arr) => (
            <div key={step} className="flex flex-col items-center gap-2 relative z-10 w-full">
              {idx < arr.length - 1 && (
                <div className="absolute right-[-50%] top-2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
              )}
              {idx < arr.length - 1 && idx < 2 && (
                <div className="absolute right-[-50%] top-2 w-full h-1 bg-amber-500 -z-10 rounded-full"></div>
              )}
              
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm",
                idx < 2 ? "bg-amber-500 text-white" : 
                idx === 2 ? "bg-white border-2 border-amber-500 text-amber-500" : 
                "bg-slate-200 text-slate-400"
              )}>
                {idx < 2 && <Check size={12} strokeWidth={4} />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider mt-1",
                idx <= 2 ? "text-slate-800" : "text-slate-400"
              )}>{step}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        <div className="relative pl-4">
          {/* Vertical Line */}
          <div className="absolute top-4 bottom-4 left-6 w-0.5 bg-slate-200 rounded-full"></div>
          
          <div className="space-y-8">
            {milestones.map((ms, idx) => (
              <div key={ms.id} className="relative flex gap-6 group">
                {/* Timeline Node */}
                <div className="relative z-10 mt-1.5">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center bg-white shadow-sm ring-4 ring-white transition-all duration-300",
                    ms.status === "completed" ? "bg-emerald-500 text-white" :
                    ms.status === "current" ? "bg-amber-500 ring-amber-100 scale-125" :
                    "bg-slate-200"
                  )}>
                    {ms.status === "completed" && <Check size={12} strokeWidth={4} />}
                    {ms.status === "current" && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                  </div>
                </div>

                {/* Content Card */}
                <div className={cn(
                  "flex-1 bg-white rounded-2xl p-5 border shadow-sm transition-all duration-300",
                  ms.status === "current" ? "border-amber-200 shadow-md ring-1 ring-amber-100" : "border-slate-100",
                  ms.status === "pending" && "opacity-60 bg-slate-50/50"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={cn(
                      "font-bold text-base tracking-tight leading-tight",
                      ms.status === "current" ? "text-amber-700" : "text-slate-800"
                    )}>{ms.title}</h3>
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap ml-2">{ms.date}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed mb-3">{ms.desc}</p>
                  
                  {/* Milestone Photos */}
                  {ms.photos && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {ms.photos.map((photo, pIdx) => (
                        <button 
                          key={pIdx} 
                          onClick={() => setExpandedPhoto(photo)}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 group/photo hover:ring-2 ring-violet-400 transition-all"
                        >
                          <img src={photo} alt="milestone" className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                            <ImageIcon size={20} className="text-white drop-shadow-md" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Area */}
      {isReadyForAction && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 pb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Balance Due</p>
              <p className="text-xl font-black text-slate-800">$600.00</p>
            </div>
            <Link to="/messages/chat/1" className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors">Contact Factory</Link>
          </div>
          <button className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-2xl py-4 font-bold text-lg shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_25px_rgba(124,58,237,0.4)] transition-all flex justify-center items-center gap-2 group">
            Pay Balance to Ship <Truck size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Photo Lightbox */}
      <AnimatePresence>
        {expandedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExpandedPhoto(null)}
          >
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={expandedPhoto} 
              alt="Expanded" 
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" 
            />
            <button 
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={() => setExpandedPhoto(null)}
            >
              <CheckCircle2 size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
