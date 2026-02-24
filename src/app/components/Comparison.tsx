import { Link, useParams } from "react-router";
import { ArrowLeft, ChevronDown, CheckCircle2, AlertCircle, TrendingUp, Sparkles, MessageCircle, Star, BadgeCheck } from "lucide-react";
import { motion } from "motion/react";

const COMPARISON_DATA = [
  {
    id: "f1",
    name: "Apex Mfg.",
    rating: 4.8,
    price: "$2.35",
    total: "$23,500",
    leadTime: "30 Days",
    moq: "1,000",
    highlight: "Best Value",
    aiRec: "Most cost-effective with solid quality.",
  },
  {
    id: "f2",
    name: "Global Textiles",
    rating: 4.9,
    price: "$2.60",
    total: "$26,000",
    leadTime: "15 Days",
    moq: "500",
    highlight: "Fastest",
    aiRec: "Ideal if you have a tight deadline.",
  }
];

export function Comparison() {
  const { id } = useParams();

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FE] overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-t from-[#EBF4FF] via-[#F8F9FE] to-[#F1EEFF] opacity-80" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-6 bg-white/70 backdrop-blur-xl z-50 sticky top-0 border-b border-slate-100">
        <Link to="/rfqs" className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-700 rounded-full hover:bg-slate-100 transition shadow-sm">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Compare Offers</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-6 no-scrollbar">
        {/* Spec Summary (Collapsible) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] p-5 mb-6 mt-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50"
        >
          <div className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Your RFQ</p>
              <h2 className="font-bold text-slate-800 text-lg">Grocery Shopping Bags</h2>
            </div>
            <button className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-500">
              <ChevronDown size={18} />
            </button>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm font-semibold text-slate-600">
            <span>Qty: 10,000</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Target: $25k</span>
          </div>
        </motion.div>

        {/* AI Recommendation Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#6842FF] to-[#8C6BFF] p-6 rounded-[24px] text-white shadow-[0_12px_30px_rgba(104,66,255,0.3)] mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-2xl shrink-0 backdrop-blur-md">
              <Sparkles size={24} className="text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                AI Suggestion
                <span className="text-[10px] bg-white text-[#6842FF] px-2 py-0.5 rounded-full font-black uppercase">Beta</span>
              </h3>
              <p className="text-white/90 text-sm font-medium leading-relaxed">
                <span className="font-bold text-amber-300">Apex Mfg.</span> offers the best overall value for your budget. Choose <span className="font-bold text-amber-300">Global Textiles</span> if you need delivery within 15 days.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Comparison Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Top Offers (2)</h3>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
            {COMPARISON_DATA.map((factory, i) => (
              <motion.div
                key={factory.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`snap-center min-w-[280px] bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 transition-all ${
                  i === 0 ? "border-[#6842FF]/20" : "border-slate-50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className={i === 0 ? "text-[#6842FF]" : "text-amber-500"} size={24} />
                    <h4 className="font-bold text-slate-800 text-lg">{factory.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-xs font-bold">
                    <Star size={12} fill="currentColor" />
                    {factory.rating}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Unit Price</span>
                    <span className="font-bold text-xl text-slate-800">{factory.price}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Total Estimate</span>
                    <span className="font-bold text-slate-800">{factory.total}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Lead Time</span>
                    <span className={`font-bold ${i === 1 ? "text-green-600" : "text-slate-800"}`}>
                      {factory.leadTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-500">Min. Order (MOQ)</span>
                    <span className="font-bold text-slate-800">{factory.moq}</span>
                  </div>
                </div>

                <Link 
                  to={`/chat/${factory.id}`}
                  className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    i === 0 
                      ? "bg-[#6842FF] text-white hover:bg-[#5a39db] shadow-[0_4px_12px_rgba(104,66,255,0.3)]"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <MessageCircle size={18} />
                  Chat & Negotiate
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}