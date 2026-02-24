import { Search, SlidersHorizontal, Plus, Clock, ArrowRight, ChevronRight, Star } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

const filters = ["All", "Packaging", "Electronics", "Apparel", "Hardware", "Near Me"];
const recommendedFactories = [
  {
    id: 1,
    name: "Apex Manufacturing Solutions",
    rating: 4.8,
    reviews: 124,
    type: "Electronics",
    image: "https://images.unsplash.com/photo-1768796372362-05c256e61d8c?w=400&q=80",
    verified: true,
  },
  {
    id: 2,
    name: "EcoBox Packagings Co.",
    rating: 4.9,
    reviews: 89,
    type: "Packaging",
    image: "https://images.unsplash.com/photo-1762902070741-c837a832ee7b?w=400&q=80",
    verified: true,
  },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col px-6 pt-12 pb-24 gap-8 overflow-y-auto">
      {/* Header & Search */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Find the perfect <br /> <span className="text-[#6C5CE7]">manufacturing partner</span>
          </h1>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600">
            <span className="relative">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6C5CE7] transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search factories, parts, materials..."
              className="w-full h-14 pl-12 pr-4 bg-white border border-transparent rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7] transition-all text-[15px] text-slate-700 placeholder:text-slate-400 font-medium"
            />
          </div>
          <button className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_2px_10px_rgb(0,0,0,0.04)] text-slate-500 hover:text-[#6C5CE7] hover:bg-indigo-50 transition-colors">
            <SlidersHorizontal size={22} />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {filters.map((filter, index) => (
            <button
              key={filter}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                index === 0
                  ? "bg-[#6C5CE7] text-white shadow-indigo-200"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Quick RFQ Action */}
      <section>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/rfqs/create")}
          className="w-full relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#6C5CE7] to-[#8C7DFF] p-6 text-left shadow-[0_12px_30px_-10px_rgba(108,92,231,0.5)]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
              <Plus className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Quick RFQ</h2>
            <p className="text-indigo-100 text-sm max-w-[200px]">Get quotes from multiple verified suppliers in minutes.</p>
          </div>
        </motion.button>
      </section>

      {/* Recommended Factories */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-bold text-slate-800">Recommended for You</h2>
          <button className="text-sm font-semibold text-[#6C5CE7] hover:text-indigo-700">See all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x">
          {recommendedFactories.map((factory) => (
            <div
              key={factory.id}
              className="snap-start shrink-0 w-[260px] bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="h-32 w-full relative">
                <img src={factory.image} alt={factory.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-slate-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {factory.rating}
                </div>
              </div>
              <div className="p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">{factory.type}</span>
                <h3 className="font-bold text-slate-800 leading-tight line-clamp-1">{factory.name}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock size={12} /> Usually responds in 2h
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
        <div 
          onClick={() => navigate("/rfqs")}
          className="bg-white rounded-[2rem] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[15px] leading-tight">Custom Cardboard Boxes</h4>
              <p className="text-sm text-slate-500 font-medium mt-0.5">RFQ • Waiting for quotes</p>
            </div>
          </div>
          <ChevronRight className="text-slate-400" size={20} />
        </div>
      </section>
    </div>
  );
}
