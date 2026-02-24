import React, { useState, useRef } from "react";
import { Search, Tag, Star, Clock, Zap, PawPrint, Pill, Gamepad2, Bone, Shirt, Package, Droplets, Box, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { currentUser, factories } from "../data/mockData";
import { Button } from "./ui/button";

const CATEGORIES = [
  { id: "pet_food", label: "อาหารสัตว์", icon: PawPrint },
  { id: "supplements", label: "อาหารเสริม", icon: Pill },
  { id: "pet_toys", label: "ของเล่นสัตว์เลี้ยง", icon: Gamepad2 },
  { id: "leash_equipment", label: "สายจูง อุปกรณ์", icon: Bone },
  { id: "pet_clothes", label: "เสื้อผ้าสัตว์เลี้ยง", icon: Shirt },
  { id: "packaging", label: "แพ็กเกจจิ้ง", icon: Package },
  { id: "bathing", label: "อุปกรณ์อาบน้ำ", icon: Droplets },
  { id: "other", label: "อื่นๆ", icon: Box },
];

const mockPromotions = [
  { id: "1", title: "ส่วนลด 500 บาท", subtitle: "เมื่อสั่งซื้อขั้นต่ำ 5,000 บาท", code: "PET500" },
  { id: "2", title: "ฟรีค่าจัดส่ง", subtitle: "ออเดอร์แรกเท่านั้น", code: "FREESHIP" },
];

export function Home() {
  const [activeChip, setActiveChip] = useState("ทั้งหมด");
  const recommendedFactories = factories.slice(0, 3);
  const adScrollRef = useRef<HTMLDivElement>(null);
  const handleAdScroll = () => {};

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
            <h1 className="text-sm font-semibold text-slate-500">สวัสดี!</h1>
            <p className="text-2xl font-bold text-slate-800">{currentUser.name}</p>
          </div>
          <div className="relative">
            <img src={currentUser.avatar} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
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
            placeholder="ค้นหาโรงงาน หรือ ประเภทงาน..."
          />
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
            <h2 className="text-xl font-bold mb-2">มีโปรเจกต์ใหม่?</h2>
            <p className="text-white/80 text-sm mb-4 leading-relaxed">
              สร้าง RFQ ด่วน เพื่อรับใบเสนอราคาจากโรงงานชั้นนำได้ทันที
            </p>
            <Link
              to="/create-rfq"
              className="inline-flex items-center gap-2 bg-white text-[#6842FF] px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform"
            >
              <Zap size={16} fill="currentColor" />
              สร้าง RFQ ด่วน
            </Link>
          </div>
 
          <div className="absolute -bottom-10 right-10 w-32 h-32 bg-indigo-900/20 rounded-full blur-xl" />
        </div>
      </motion.div>

      {/* Categories - data & icons like ref/HomeScreen */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-6 mb-8"
      >
        <h2 className="text-base font-bold text-slate-800 mb-3">หมวดหมู่</h2>
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Icon size={24} />
                </div>
                <span className="text-sm font-medium text-slate-800">{cat.label}</span>
              </button>
            );
          })}
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
          <h3 className="text-lg font-bold text-slate-800">โรงงานแนะนำ</h3>
          <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-[#6842FF]">
            ดูทั้งหมด <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar">
          {recommendedFactories.map((factory) => (
            <div
              key={factory.id}
              className="min-w-[240px] bg-white rounded-[24px] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50"
            >
              <img
                src={factory.image}
                alt={factory.name}
                className="w-full h-32 object-cover rounded-[16px] mb-3"
              />
              <div className="px-1">
                <h4 className="font-bold text-slate-800 truncate">{factory.name}</h4>
                <p className="text-sm text-slate-500 mb-2">{factory.specialization}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                    <Star size={16} fill="currentColor" />
                    {factory.rating}
                  </div>
                  <button type="button" className="text-[#6842FF] bg-[#F1EEFF] p-2 rounded-xl">
                    <Tag size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* --- Section Ad และโปรโมชั่น --- */}
      <div className="mb-5 w-full overflow-hidden">
        <div
          ref={adScrollRef}
          onScroll={handleAdScroll}
          // เพิ่ม px-[7.5vw] เพื่อให้จุดเริ่มต้นและจุดสิ้นสุดอยู่ตรงกลางพอดี
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory px-[7.5vw]"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
        >
          {/* ไม่ต้องใช้ div เปล่าหัวท้ายแล้ว */}
          {mockPromotions.map((promo) => (
            <div
              key={promo.id}
              data-ad-slide
              // เปลี่ยนเป็น snap-center และกำหนด w-[85vw] คงที่
              className="flex-shrink-0 w-[85vw] snap-center rounded-2xl overflow-hidden relative min-h-[120px]"
            >
              <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-5 relative min-h-[120px] h-full">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-1">{promo.title}</h3>
                  <p className="text-white/90 text-sm mb-3">{promo.subtitle}</p>
                  {promo.code && (
                    <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                      <span className="text-white text-sm font-medium">โค้ด {promo.code}</span>
                      <Button
                        size="sm"
                        className="bg-white text-emerald-700 hover:bg-white/90 rounded-full h-7 text-xs"
                      >
                        สั่งเลย &gt;
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Mini-Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-6 mb-8"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-4">กิจกรรมล่าสุด</h3>
        <Link to="/orders/ord1" className="block">
          <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 flex items-center gap-4 active:scale-95 transition-transform">
            <div className="bg-orange-50 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="text-orange-500" size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800">ตู้ควบคุมไฟฟ้า Sheet Metal</h4>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                  กำลังผลิต
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">กำลังตรวจสอบคุณภาพชิ้นงาน</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}