import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Bell, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { notifications as notificationsData } from "../data/mockData";

export function Notifications() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const filtered = notificationsData.filter(
    (n) =>
      n.title.toLowerCase().includes(searchText.toLowerCase()) ||
      n.message.toLowerCase().includes(searchText.toLowerCase())
  );

  const unreadCount = notificationsData.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#F8F9FE]">
      {/* Header - ref จาก Messages.tsx */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">การแจ้งเตือน</h1>
            {unreadCount > 0 && (
              <span className="w-6 h-6 rounded-full bg-[#6842FF] text-white flex items-center justify-center text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-50 rounded-2xl text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#6842FF] transition-all"
            placeholder="ค้นหาการแจ้งเตือน..."
          />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">ไม่พบการแจ้งเตือน</div>
          ) : (
            filtered.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {notif.linkTo ? (
                  <Link to={notif.linkTo} className="block">
                    <NotificationCard notif={notif} />
                  </Link>
                ) : (
                  <div className="block">
                    <NotificationCard notif={notif} />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationCard({
  notif,
}: {
  notif: (typeof import("../data/mockData").notifications)[0];
}) {
  return (
    <div
      className={`bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border transition-all flex items-center gap-4 ${
        notif.read ? "border-slate-50" : "border-[#6842FF]/20 bg-violet-50/30"
      }`}
    >
      <div className="relative w-14 h-14 shrink-0">
        {notif.avatar ? (
          <img
            src={notif.avatar}
            alt=""
            className="w-full h-full object-cover rounded-[20px] shadow-sm"
          />
        ) : (
          <div className="w-full h-full rounded-[20px] bg-violet-100 flex items-center justify-center">
            <Bell className="text-[#6842FF]" size={24} />
          </div>
        )}
        {!notif.read && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#6842FF] border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3
            className={`truncate text-base ${notif.read ? "font-semibold text-slate-700" : "font-bold text-slate-800"}`}
          >
            {notif.title}
          </h3>
          <span
            className={`text-xs font-semibold shrink-0 ml-2 ${!notif.read ? "text-[#6842FF]" : "text-slate-400"}`}
          >
            {notif.time}
          </span>
        </div>
        <p
          className={`text-sm truncate ${notif.read ? "font-medium text-slate-500" : "font-medium text-slate-600"}`}
        >
          {notif.message}
        </p>
      </div>
    </div>
  );
}
