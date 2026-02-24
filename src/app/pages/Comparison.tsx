import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronDown, ChevronUp, Star, Award, Zap, ShieldCheck, ChevronRight, MessageCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { cn } from "../../lib/utils";

const mySpec = {
  title: "10,000 Custom Printed Mailer Boxes",
  material: "Corrugated Cardboard (E-flute)",
  printing: "Full Color (CMYK) outside, 1-color inside",
  size: "8\" x 6\" x 3\"",
  finish: "Matte Lamination",
};

const offers = [
  {
    id: 1,
    factory: "EcoBox Packagings Co.",
    rating: 4.9,
    reviews: 89,
    price: "$2,150",
    unitPrice: "$0.215",
    leadTime: "14 Days",
    paymentTerms: "30% Deposit",
    isRecommended: true,
  },
  {
    id: 2,
    factory: "Apex Manufacturing Solutions",
    rating: 4.8,
    reviews: 124,
    price: "$1,900",
    unitPrice: "$0.190",
    leadTime: "21 Days",
    paymentTerms: "50% Deposit",
    isRecommended: false,
  },
];

export function Comparison() {
  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="flex h-screen flex-col bg-slate-50 relative">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-white z-10 sticky top-0 shadow-sm border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight flex-1 text-center">Compare Offers</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {/* Collapsible Spec Section */}
        <section className="bg-white border-b border-slate-100">
          <button
            onClick={() => setIsSpecOpen(!isSpecOpen)}
            className="w-full flex items-center justify-between p-6 focus:outline-none"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Request</span>
              <h2 className="font-bold text-[15px] text-slate-800 leading-tight text-left max-w-[250px]">{mySpec.title}</h2>
            </div>
            {isSpecOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
          </button>
          
          <AnimatePresence>
            {isSpecOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-0 flex flex-col gap-3">
                  {Object.entries(mySpec).slice(1).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-[13px] border-t border-slate-50 pt-3">
                      <span className="text-slate-500 capitalize">{key}</span>
                      <span className="font-bold text-slate-800 max-w-[180px] text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* AI Recommendation Banner */}
        <div className="p-6 pb-2">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] p-5 shadow-lg shadow-indigo-200 text-white flex gap-4 items-start relative overflow-hidden"
          >
            {/* Sparkle graphic */}
            <div className="absolute -top-6 -right-6 opacity-20">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
              <Award className="text-amber-300" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 leading-tight">EcoBox is Recommended</h3>
              <p className="text-indigo-100 text-sm leading-relaxed max-w-[240px]">
                Best balance of speed (14 days) and high rating (4.9). Worth the slight premium.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Side-by-side Comparison Table */}
        <div className="px-6 py-4 flex flex-col gap-6">
          <h3 className="font-bold text-slate-800 text-lg">5 Offers Received</h3>
          
          <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
            {offers.map((offer) => (
              <div 
                key={offer.id}
                className={cn(
                  "snap-center shrink-0 w-[280px] rounded-3xl p-5 border flex flex-col gap-5 relative bg-white",
                  offer.isRecommended 
                    ? "border-[#6C5CE7] shadow-[0_8px_30px_rgb(108,92,231,0.12)]" 
                    : "border-slate-200 shadow-sm"
                )}
              >
                {offer.isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6C5CE7] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm whitespace-nowrap z-10">
                    Best Value
                  </div>
                )}
                
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div className="flex flex-col gap-1 pr-2">
                    <h4 className="font-bold text-slate-800 leading-tight">{offer.factory}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-slate-700">{offer.rating}</span>
                      <span className="text-xs text-slate-400">({offer.reviews})</span>
                    </div>
                  </div>
                  <ShieldCheck className={offer.isRecommended ? "text-[#6C5CE7]" : "text-slate-300"} size={24} />
                </div>

                {/* Specs */}
                <div className="flex flex-col gap-4 flex-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Price</span>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-slate-800 tracking-tight">{offer.price}</span>
                      <span className="text-sm font-medium text-slate-500 mb-1">{offer.unitPrice}/ea</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lead Time</span>
                    <span className="text-[15px] font-bold text-slate-800">{offer.leadTime}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Terms</span>
                    <span className="text-[15px] font-medium text-slate-700">{offer.paymentTerms}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => navigate(`/messages/${offer.id}`)}
                    className={cn(
                      "w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                      offer.isRecommended 
                        ? "bg-[#6C5CE7] text-white hover:bg-indigo-700 shadow-md shadow-indigo-200/50" 
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    <MessageCircle size={18} />
                    Chat & Negotiate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
