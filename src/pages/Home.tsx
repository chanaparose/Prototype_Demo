import { Bell, Search, Filter, Plus, Clock, ChevronRight, Zap } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { cn } from "../utils/cn";
import React from 'react';

const filterChips = ["All", "Clothing", "Packaging", "Electronics", "Near Me"];

const recommendations = [
  { id: 1, name: "Alpha Textiles Mfg", rating: 4.8, category: "Apparel", img: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: 2, name: "EcoPack Solutions", rating: 4.9, category: "Packaging", img: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: 3, name: "Precision Metals", rating: 4.6, category: "Hardware", img: "https://images.unsplash.com/photo-1621817452331-b8408a2a89de?auto=format&fit=crop&q=80&w=200&h=200" },
];

export function Home() {
  const [activeChip, setActiveChip] = React.useState("All");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-8 pb-32"
    >
      {/* Header */}
      <header className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-violet-100">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Hello!</p>
            <h1 className="text-xl font-bold text-slate-800">Livia Vaccaro</h1>
          </div>
        </div>
        <button className="relative p-2 rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
          <Bell size={22} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
      </header>

      {/* Search & Filters */}
      <section className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search factories, materials..." 
            className="w-full bg-white rounded-2xl py-4 pl-12 pr-12 text-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <Filter size={18} />
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {filterChips.map(chip => (
            <button 
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={cn(
                "whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm",
                activeChip === chip 
                  ? "bg-violet-600 text-white shadow-violet-200" 
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* Recommended */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recommended for You</h2>
          <button className="text-sm font-semibold text-violet-600 hover:text-violet-700">See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x px-1 pb-4 -mx-1">
          {recommendations.map((rec) => (
            <div key={rec.id} className="min-w-[160px] snap-center bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 flex flex-col gap-3">
              <div className="w-full h-32 rounded-xl overflow-hidden relative group">
                <img src={rec.img} alt={rec.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold text-slate-800 shadow-sm">
                  <span className="text-amber-500">★</span> {rec.rating}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm truncate">{rec.name}</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{rec.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick RFQ Action */}
      <section>
        <Link to="/rfq/new" className="block w-full bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm inline-flex">
                  <Zap size={16} className="text-amber-300 fill-amber-300" />
                </div>
                <span className="text-violet-100 text-xs font-bold uppercase tracking-wider">Fast Track</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight leading-none">Quick RFQ</h2>
              <p className="text-violet-200 text-sm font-medium">Get quotes in minutes.</p>
            </div>
            <div className="w-14 h-14 bg-white text-violet-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Plus strokeWidth={3} size={28} />
            </div>
          </div>
        </Link>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recent Activity</h2>
        </div>
        <Link to="/rfqs" className="block bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-800">Custom Canvas Tote Bags</h3>
                <span className="text-[10px] font-bold px-2 py-1 bg-violet-100 text-violet-700 rounded-lg">Active</span>
              </div>
              <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                5 Offers Received
              </p>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-violet-500 transition-colors" />
          </div>
        </Link>
      </section>
      
    </motion.div>
  );
}
