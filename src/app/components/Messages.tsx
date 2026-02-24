import { Link } from "react-router";
import { Search, Edit, Circle } from "lucide-react";
import { motion } from "motion/react";

const CHATS = [
  {
    id: "f1",
    name: "Apex Mfg.",
    lastMsg: "We just sent the formal quotation for your approval.",
    time: "10:30 AM",
    unread: 2,
    avatar: "https://images.unsplash.com/photo-1768796371809-95b49943a48b?auto=format&fit=crop&q=80&w=150",
  },
  {
    id: "f2",
    name: "Global Textiles",
    lastMsg: "Yes, we can definitely meet that 15-day deadline.",
    time: "Yesterday",
    unread: 0,
    avatar: "https://images.unsplash.com/photo-1760328715293-6410199deca5?auto=format&fit=crop&q=80&w=150",
  },
];

export function Messages() {
  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#F8F9FE]">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-slate-100/50">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Messages</h1>
        <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-[#6842FF] hover:bg-[#F1EEFF] transition">
          <Edit size={20} />
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-50 rounded-2xl text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#6842FF] transition-all"
            placeholder="Search factories or messages..."
          />
        </div>

        <div className="space-y-3">
          {CHATS.map((chat, i) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/chat/${chat.id}`} className="block">
                <div className="bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-50 hover:border-[#6842FF]/20 transition-all flex items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0">
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover rounded-[20px] shadow-sm" />
                    {chat.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`font-bold text-lg truncate ${chat.unread > 0 ? "text-slate-800" : "text-slate-700"}`}>
                        {chat.name}
                      </h3>
                      <span className={`text-xs font-semibold ${chat.unread > 0 ? "text-[#6842FF]" : "text-slate-400"}`}>
                        {chat.time}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${chat.unread > 0 ? "font-bold text-slate-800" : "font-medium text-slate-500"}`}>
                      {chat.lastMsg}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}