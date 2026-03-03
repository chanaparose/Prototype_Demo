import React from 'react';
import { DollarSign, Package, Calendar, Image as ImageIcon } from 'lucide-react';
import type { CreateRfqForm } from './types';

type CreateRfqStep2Props = {
  form: CreateRfqForm;
  onUpdate: (key: keyof CreateRfqForm, value: string) => void;
};

export function CreateRfqStep2({ form, onUpdate }: CreateRfqStep2Props) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Package size={14} className="text-[#6C47FF]" /> จำนวนที่ต้องการ
          </label>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => onUpdate('quantity', e.target.value)}
            placeholder="หน่วย"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <DollarSign size={14} className="text-emerald-500" /> งบประมาณ (บาท)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={form.budget}
            onChange={(e) => onUpdate('budget', e.target.value)}
            placeholder="ไม่บังคับ"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          วัสดุ / สเปกที่ต้องการ
        </label>
        <input
          type="text"
          value={form.material}
          onChange={(e) => onUpdate('material', e.target.value)}
          placeholder="เช่น ผ้าคอตตอน 100%, ยางธรรมชาติปลอดภัย, เนื้อไก่ ข้าว วิตามิน"
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <Calendar size={14} className="text-amber-500" /> ต้องการรับงานภายในวันที่
        </label>
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => onUpdate('deadline', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          รูป/ไฟล์อ้างอิง (ถ้ามี)
        </label>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-[#6C47FF] mb-1">
            <ImageIcon size={24} />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700">แตะเพื่ออัปโหลด</p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF ไม่เกิน 10MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
