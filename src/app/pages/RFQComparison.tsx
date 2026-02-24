import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, Sparkles, Star, MapPin, Clock } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { RFQ_OFFERS } from "../utils/mockData";
import { clsx } from "clsx";

export function RFQComparison() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSpecOpen, setIsSpecOpen] = useState(false);

  // We could fetch actual RFQ details based on ID, using mock here
  const rfqTitle = "Custom Aluminum Heatsinks";

  const recommendedOffer = RFQ_OFFERS.find(o => o.isRecommended);

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-slate-50 relative z-20 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-30 px-5 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1 overflow-hidden">
          <h1 className="text-lg font-bold text-slate-900 truncate">{rfqTitle}</h1>
          <p className="text-xs text-slate-500 font-medium">3 Offers Received</p>
        </div>
      </div>

      <div className="px-5 pt-6 pb-6 space-y-6">
        {/* Spec Summary Collapsible */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 overflow-hidden">
          <button 
            onClick={() => setIsSpecOpen(!isSpecOpen)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
              <CheckCircle className="w-4 h-4 text-violet-600" />
              Project Specifications
            </div>
            {isSpecOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          <AnimatePresence>
            {isSpecOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 grid grid-cols-2 gap-y-4 text-sm border-t border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Material</span>
                    <span className="font-bold text-slate-900">AL6061</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Quantity</span>
                    <span className="font-bold text-slate-900">5,000 pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Target Lead Time</span>
                    <span className="font-bold text-slate-900">4 Weeks</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Certifications</span>
                    <span className="font-bold text-slate-900">ISO9001</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Recommendation Banner */}
        {recommendedOffer && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm mt-1 shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">AI Recommendation</h3>
                <p className="text-sm text-violet-100 mb-3 leading-snug">
                  <span className="font-bold text-white">{recommendedOffer.factoryName}</span> is your best match based on your specs and historical performance.
                </p>
                <button className="bg-white text-violet-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-shadow flex items-center gap-2">
                  View Detail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table (Side-by-side cards) */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 px-1">Compare Offers</h2>
          <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar -mx-5 px-5">
            {RFQ_OFFERS.map((offer, i) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className={clsx(
                  "flex-shrink-0 w-64 bg-white rounded-3xl p-5 border relative shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                  offer.isRecommended ? "border-violet-300 shadow-violet-100" : "border-slate-100"
                )}
              >
                {offer.isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap z-10">
                    Top Pick
                  </div>
                )}
                
                <h3 className="font-bold text-slate-900 text-base leading-tight mb-2 pt-2">{offer.factoryName}</h3>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mb-4 bg-amber-50 inline-flex px-2 py-0.5 rounded-md">
                  <Star className="w-3 h-3 fill-amber-500" /> {offer.rating}
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Total Price</span>
                    <span className="text-2xl font-bold text-slate-900">{offer.price}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">Lead Time</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" /> {offer.leadTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">Location</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-400" /> BKK
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {offer.badges.map(badge => (
                    <span key={badge} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                      {badge}
                    </span>
                  ))}
                </div>

                <Link 
                  to="/messages" 
                  className={clsx(
                    "block w-full text-center py-3 rounded-xl font-bold text-sm transition-all",
                    offer.isRecommended 
                      ? "bg-violet-600 text-white shadow-[0_4px_14px_0_rgba(109,40,217,0.39)] hover:bg-violet-700" 
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  Chat & Order
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
