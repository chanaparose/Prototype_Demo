import React from "react";
import { Search, MapPin, Tag, Star, Clock, Zap } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";

const RECOMMENDED_FACTORIES = [
  {
    id: 1,
    name: "Apex Manufacturing Ltd.",
    type: "Metal Fabrication",
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1768796371809-95b49943a48b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBmYWN0b3J5JTIwbWFudWZhY3R1cmluZyUyMG1hY2hpbmVyeXxlbnwxfHx8fDE3NzE4Njc4MTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    name: "Global Textiles Co.",
    type: "Apparel & Garment",
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1760328715293-6410199deca5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0aWxlJTIwZmFjdG9yeSUyMHNld2luZyUyMHByb2R1Y3Rpb258ZW58MXx8fHwxNzcxODY3ODIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

const FILTERS = ["All", "Near Me", "Top Rated", "Low MOQ"];

export function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Soft gradient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-[#EBF4FF] via-[#F8F9FE] to-[#F1EEFF] opacity-80" />

      {/* Header & Search */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-12 pb-6"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-sm font-semibold text-slate-500">Good Morning!</h1>
            <p className="text-2xl font-bold text-slate-800">Livia Vaccaro</p>
          </div>
          <div className="relative">
            <img src="https://i.pravatar.cc/150?u=livia" alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#6842FF] focus:border-transparent transition-all"
            placeholder="Search factories, materials, RFQs..."
          />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                i === 0
                  ? "bg-[#6842FF] text-white shadow-[0_4px_12px_rgba(104,66,255,0.3)]"
                  : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Quick RFQ Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 mb-8"
      >
        <div className="bg-gradient-to-r from-[#6842FF] to-[#8C6BFF] rounded-3xl p-6 text-white shadow-[0_12px_30px_rgba(104,66,255,0.3)] relative overflow-hidden">
          <div className="relative z-10 w-2/3">
            <h2 className="text-xl font-bold mb-2">Have a new project?</h2>
            <p className="text-white/80 text-sm mb-4 leading-relaxed">
              Create a Quick RFQ to get estimates from top factories instantly.
            </p>
            <Link
              to="/create-rfq"
              className="inline-flex items-center gap-2 bg-white text-[#6842FF] px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform"
            >
              <Zap size={16} fill="currentColor" />
              Start Quick RFQ
            </Link>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 right-10 w-32 h-32 bg-indigo-900/20 rounded-full blur-xl" />
        </div>
      </motion.div>

      {/* Recommended Factories */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex justify-between items-end px-6 mb-4">
          <h3 className="text-lg font-bold text-slate-800">Recommended for You</h3>
          <button className="text-sm font-semibold text-[#6842FF]">See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar">
          {RECOMMENDED_FACTORIES.map((factory) => (
            <div
              key={factory.id}
              className="min-w-[240px] bg-white rounded-[24px] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50"
            >
              <img
                src={factory.img}
                alt={factory.name}
                className="w-full h-32 object-cover rounded-[16px] mb-3"
              />
              <div className="px-1">
                <h4 className="font-bold text-slate-800 truncate">{factory.name}</h4>
                <p className="text-sm text-slate-500 mb-2">{factory.type}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                    <Star size={16} fill="currentColor" />
                    {factory.rating}
                  </div>
                  <button className="text-[#6842FF] bg-[#F1EEFF] p-2 rounded-xl">
                    <Tag size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity Mini-Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-6 mb-8"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
        <Link to="/order/1" className="block">
          <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 flex items-center gap-4 active:scale-95 transition-transform">
            <div className="bg-orange-50 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="text-orange-500" size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800">Grocery Bag Production</h4>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                  In Progress
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">Samples are being reviewed</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}