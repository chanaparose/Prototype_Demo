import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, MoreVertical, Clock, CheckCircle2, ChevronRight, Layers, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { rfqs } from "../data/mockData";

const STATUS_LABEL: Record<string, string> = {
  offers_received: "ได้รับใบเสนอราคา",
  reviewing: "กำลังพิจารณา",
  pending: "รอดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  expired: "หมดอายุ",
};

const CATEGORY_COLORS: Record<string, string> = {
  "อาหารสัตว์": "violet",
  "เสื้อผ้าสัตว์เลี้ยง": "pink",
  "ของเล่นสัตว์เลี้ยง": "orange",
  "สายจูง อุปกรณ์": "blue",
  "แพ็กเกจจิ้ง": "amber",
  "อื่นๆ": "slate",
};

function formatBudget(budget: number): string {
  return "฿" + budget.toLocaleString("th-TH");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export function RFQs() {
  const [tab, setTab] = useState<"active" | "history">("active");

  const { activeRfqs, historyRfqs } = useMemo(() => {
    const historyStatuses = ["completed", "cancelled", "expired"];
    const active = rfqs.filter((r) => !historyStatuses.includes(r.status));
    const history = rfqs.filter((r) => historyStatuses.includes(r.status));
    return { activeRfqs: active, historyRfqs: history };
  }, []);

  const getColorClass = (category: string) => {
    const color = CATEGORY_COLORS[category] ?? "slate";
    switch (color) {
      case "violet":
        return "bg-[#F1EEFF] text-[#6842FF]";
      case "pink":
        return "bg-pink-50 text-pink-500";
      case "orange":
        return "bg-orange-50 text-orange-500";
      case "blue":
        return "bg-blue-50 text-blue-500";
      case "amber":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getHistoryStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "cancelled":
        return "text-slate-600 bg-slate-100";
      case "expired":
        return "text-amber-700 bg-amber-50";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  return (
    <div className="px-4 pt-5 pb-4 flex flex-col min-h-full pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">คำขอ</p>
          <h1 className="text-gray-900" style={{ fontWeight: 700 }}>RFQ ของฉัน</h1>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
            <Search size={20} style={{ color: '#6C47FF' }} />
          </button>
          <button className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
            <Filter size={20} style={{ color: '#6C47FF' }} />
          </button>
        </div>
      </div>

      {/* Segment Control */}
      <div className="my-4">
        <div className="bg-white p-1 rounded-2xl flex shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-50">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              tab === "active"
                ? "bg-[#6842FF] text-white shadow-[0_4px_12px_rgba(104,66,255,0.3)]"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            คำขอที่เปิดอยู่
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              tab === "history"
                ? "bg-[#6842FF] text-white shadow-[0_4px_12px_rgba(104,66,255,0.3)]"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            ประวัติ
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {tab === "active" ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {activeRfqs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <Layers size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">ยังไม่มีคำขอที่เปิดอยู่</h3>
                  <p className="text-slate-500 mb-8 max-w-[250px] mx-auto">
                    สร้าง RFQ ใหม่เพื่อรับใบเสนอราคาจากโรงงาน
                  </p>
                  <Link to="/create-rfq" className="bg-[#6842FF] text-white px-8 py-3.5 rounded-2xl font-bold shadow-[0_8px_20px_rgba(104,66,255,0.3)] hover:scale-105 transition-transform">
                    สร้าง RFQ ใหม่
                  </Link>
                </div>
              ) : (
                activeRfqs.map((rfq) => (
                  <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block">
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-[#6842FF]/20 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${getColorClass(rfq.category)}`}>
                            {rfq.categoryIcon || <Layers size={24} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 mb-1">{rfq.category}</p>
                            <h3 className="font-bold text-slate-800 leading-tight">{rfq.projectName}</h3>
                          </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600" onClick={(e) => e.preventDefault()}>
                          <MoreVertical size={20} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} />
                          สร้างเมื่อ {formatDate(rfq.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={16} className="text-green-500" />
                          {formatBudget(rfq.budget)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        {rfq.offerCount > 0 ? (
                          <div className="inline-flex items-center gap-2 bg-[#F1EEFF] px-3 py-1.5 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-[#6842FF] animate-pulse" />
                            <span className="text-xs font-bold text-[#6842FF]">
                              ได้รับ {rfq.offerCount} ใบเสนอราคา
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            <span className="text-xs font-bold text-slate-500">รอใบเสนอราคา</span>
                          </div>
                        )}

                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#6842FF] group-hover:text-white transition-colors">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {historyRfqs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <LayoutGrid size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">ยังไม่มีประวัติ</h3>
                  <p className="text-slate-500 mb-8 max-w-[250px] mx-auto">
                    คำขอที่เสร็จสิ้นหรือยกเลิกจะแสดงที่นี่
                  </p>
                  <Link to="/create-rfq" className="bg-[#6842FF] text-white px-8 py-3.5 rounded-2xl font-bold shadow-[0_8px_20px_rgba(104,66,255,0.3)] hover:scale-105 transition-transform">
                    สร้าง RFQ ใหม่
                  </Link>
                </div>
              ) : (
                historyRfqs.map((rfq) => (
                  <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block">
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-[#6842FF]/20 transition-colors group opacity-90"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex gap-3 min-w-0 flex-1">
                          <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-xl ${getColorClass(rfq.category)}`}>
                            {rfq.categoryIcon || <Layers size={24} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-400 mb-1 truncate">{rfq.category}</p>
                            <h3 className="font-bold text-slate-800 leading-tight truncate" title={rfq.projectName}>{rfq.projectName}</h3>
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${getHistoryStatusBadgeClass(rfq.status)}`}>
                          {STATUS_LABEL[rfq.status] ?? rfq.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} />
                          สร้างเมื่อ {formatDate(rfq.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={16} className="text-green-500" />
                          {formatBudget(rfq.budget)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                          <span className="text-xs font-bold text-slate-500">
                            ได้รับ {rfq.offerCount} ใบเสนอราคา
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#6842FF] group-hover:text-white transition-colors">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}