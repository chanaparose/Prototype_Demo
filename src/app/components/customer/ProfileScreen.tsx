import React from 'react';
import { ChevronRight, Bookmark, MapPin, Users, HelpCircle, LogOut, ShieldCheck, Heart } from 'lucide-react';
// ลบ Card, CardContent เดิมออกได้เลยในหน้านี้ เพราะเราจะสร้าง Container แบบ Custom ที่ดูคลีนกว่า
import { Badge } from '../ui/badge';

interface ProfileScreenProps {
  onSwitchMode: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ onSwitchMode, onLogout }: ProfileScreenProps) {
  const menuItems = [
    {
      icon: Heart,
      title: 'รายการโปรด',
      subtitle: 'โรงงานและรายการที่คุณชอบ',
      onClick: () => {}
    },
    {
      icon: Bookmark,
      title: 'โรงงานที่บันทึกไว้',
      subtitle: '5 โรงงาน',
      onClick: () => {}
    },
    {
      icon: MapPin,
      title: 'ที่อยู่สำหรับจัดส่ง',
      subtitle: '2 ที่อยู่',
      onClick: () => {}
    },
    {
      icon: Users,
      title: 'สลับไปใช้โหมดผู้ขาย/โรงงาน',
      subtitle: 'เปลี่ยนเป็นโหมดโรงงาน',
      onClick: onSwitchMode,
      highlight: true // เพิ่ม flag สำหรับไฮไลต์เมนูสำคัญ
    },
    {
      icon: HelpCircle,
      title: 'ศูนย์ช่วยเหลือ',
      subtitle: 'คำถามที่พบบ่อย',
      onClick: () => {}
    }
  ];

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* 1. Sticky block: Header + Stats อยู่กับที่ตอนเลื่อน จอ (fig อยู่กับที่เหมือน Menu Items) */}
      <div className="sticky top-0 z-10 pb-6 bg-slate-50">
        {/* Header */}
        <div className="relative border-b border-white/10 overflow-hidden pb-14">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
          <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-[#4F4F9F]/50 rounded-full blur-2xl" />
          
          <div className="relative z-10 px-6 pt-6 pb-2">
            <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest block mb-4">
              My Profile
            </span>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-tr from-white/20 to-white/5 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                <span className="text-2xl font-bold text-white">สม</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white tracking-tight mb-0.5">คุณสมชาย</h1>
                <p className="text-sm text-white/70 truncate mb-2">somchai@email.com</p>
                <Badge className="bg-white/10 backdrop-blur-md text-emerald-300 border border-emerald-400/30 font-medium px-2.5 py-0.5 h-6 rounded-full shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  ยืนยันตัวตนแล้ว
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Stats (อยู่กับที่เมื่อเลื่อน - ไม่เลื่อนตามจอ) */}
        <div className="px-4 relative z-20 -mt-10 mb-0">
          <div className="bg-white rounded-[24px] p-5 shadow-xl shadow-slate-200/40 border border-slate-100 flex justify-between divide-x divide-slate-100">
            <div className="flex-1 text-center px-2">
              <p className="text-2xl font-bold text-slate-800">12</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">โครงการ</p>
            </div>
            <div className="flex-1 text-center px-2">
              <p className="text-2xl font-bold text-emerald-600">8</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">สำเร็จ</p>
            </div>
            <div className="flex-1 text-center px-2">
              <p className="text-2xl font-bold text-amber-500">4</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">ดำเนินการ</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Menu Items (Grouped List) - เลื่อนตามจอ */}
      <div className="px-4 space-y-5">
        
        {/* กลุ่มเมนูหลัก */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isFavorites = item.icon === Heart;
            const isHighlight = item.highlight;
            const isLast = index === menuItems.length - 1;

            return (
              <div
                key={index}
                onClick={item.onClick}
                className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors active:bg-slate-100 ${
                  !isLast ? 'border-b border-slate-100' : ''
                }`}
              >
                {/* Icon Container - ปรับให้เป็นวงกลม */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                    isFavorites
                      ? 'bg-rose-50 text-rose-500'
                      : isHighlight
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${isHighlight ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              </div>
            );
          })}
        </div>

        {/* กลุ่มปุ่มออกจากระบบ (แยกออกมาต่างหากเพื่อป้องกันการกดผิด) */}
        <div 
          className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:bg-rose-50/50 transition-colors active:bg-rose-50"
          onClick={onLogout}
        >
          <div className="p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-rose-600">ออกจากระบบ</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-200 shrink-0" />
          </div>
        </div>
        
        {/* App Version (Optional: นิยมใส่ไว้ล่างสุดของหน้า Profile) */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">เวอร์ชัน 1.0.0 (Build 12)</p>
        </div>

      </div>
    </div>
  );
}