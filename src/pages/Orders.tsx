import { Link } from "react-router";
import { motion } from "motion/react";
import { Package, Truck, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { cn } from "../utils/cn";

const orders = [
  { id: 1, title: "Custom Canvas Tote Bags", factory: "EcoPack Solutions", status: "production", amount: "$1,200", date: "Oct 15, 2023", progress: 60 },
  { id: 2, title: "Bluetooth Speakers", factory: "TechGear Mfg", status: "shipped", amount: "$4,500", date: "Sep 30, 2023", progress: 90 },
  { id: 3, title: "Silicone Phone Cases", factory: "Alpha Plastics", status: "delivered", amount: "$850", date: "Aug 20, 2023", progress: 100 },
];

export function Orders() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-slate-50 min-h-screen"
    >
      <header className="px-6 py-8 bg-white pb-6 rounded-b-3xl shadow-[0_4px_30px_rgb(0,0,0,0.03)] z-10 sticky top-0">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Orders</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Track your active productions.</p>
      </header>

      <div className="flex-1 p-6 space-y-4 pb-32 overflow-y-auto">
        {orders.map((order) => (
          <Link 
            key={order.id} 
            to={`/orders/${order.id}`}
            className="block bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] transition-all duration-300 group relative overflow-hidden"
          >
            {/* Status Highlight */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-2",
              order.status === "production" ? "bg-amber-500" : 
              order.status === "shipped" ? "bg-blue-500" : "bg-emerald-500"
            )}></div>

            <div className="flex justify-between items-start mb-4 pl-2">
              <div>
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-violet-700 transition-colors leading-tight">
                  {order.title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wide">
                  {order.factory}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors flex-shrink-0 ml-4">
                <ChevronRight size={20} />
              </div>
            </div>

            <div className="pl-2">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-xl border border-transparent shadow-sm flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                    order.status === "production" ? "bg-amber-50 border-amber-200 text-amber-600" :
                    order.status === "shipped" ? "bg-blue-50 border-blue-200 text-blue-600" :
                    "bg-emerald-50 border-emerald-200 text-emerald-600"
                  )}>
                    {order.status === "production" && <Clock size={14} />}
                    {order.status === "shipped" && <Truck size={14} />}
                    {order.status === "delivered" && <CheckCircle2 size={14} />}
                    {order.status}
                  </div>
                </div>
                <span className="font-black text-slate-800">{order.amount}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden shadow-inner relative">
                <div 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-1000 ease-out",
                    order.status === "production" ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                    order.status === "shipped" ? "bg-gradient-to-r from-blue-400 to-blue-500" :
                    "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  )} 
                  style={{ width: `${order.progress}%` }}
                >
                  {/* Subtle shine effect */}
                  <div className="absolute top-0 left-0 bottom-0 right-0 w-full h-full bg-white/20 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
