import { Link } from "react-router";
import { Package, ChevronRight, Clock, MapPin, Loader2 } from "lucide-react";
import { motion } from "motion/react";

const ORDERS_DATA = [
  {
    id: "o1",
    title: "Grocery Shopping Bags",
    factory: "Apex Mfg.",
    status: "Production",
    progress: 65,
    date: "Est. June 15",
    color: "violet",
  },
  {
    id: "o2",
    title: "Staff T-Shirts (Summer)",
    factory: "Global Textiles",
    status: "Shipping",
    progress: 90,
    date: "Est. May 30",
    color: "pink",
  },
];

export function Orders() {
  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#F8F9FE]" />

      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/50 backdrop-blur-xl z-40 border-b border-slate-100/50">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Active Orders</h1>
        <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-slate-600 hover:text-[#6842FF] transition">
          <Clock size={20} />
        </button>
      </div>

      <div className="px-6 flex-1 py-6 space-y-4">
        {ORDERS_DATA.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={`/order/${order.id}`} className="block">
              <div className="bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-[#6842FF]/20 transition-colors group">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 shadow-sm ${
                    order.color === 'violet' ? 'bg-[#F1EEFF] text-[#6842FF]' : 'bg-pink-50 text-pink-500'
                  }`}>
                    <Package size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-400 mb-1 truncate">{order.factory}</p>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{order.title}</h3>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full group-hover:bg-[#6842FF] group-hover:text-white transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end text-sm font-bold">
                    <span className="text-[#6842FF] flex items-center gap-1.5">
                      {order.status === "Production" ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                      {order.status}
                    </span>
                    <span className="text-slate-500">{order.date}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${order.color === 'violet' ? 'bg-[#6842FF]' : 'bg-pink-500'}`}
                      initial={{ width: "0%" }}
                      animate={{ width: `${order.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}