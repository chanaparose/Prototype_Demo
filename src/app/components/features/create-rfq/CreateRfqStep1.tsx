import React from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import type { CreateRfqForm } from './types';

type Category = { id: string; name: string };

type CreateRfqStep1Props = {
  form: CreateRfqForm;
  categories: Category[];
  onUpdate: (key: keyof CreateRfqForm, value: string) => void;
};

export function CreateRfqStep1({ form, categories, onUpdate }: CreateRfqStep1Props) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          หมวดหมู่สินค้า
        </label>
        <div className="relative">
          <select
            value={form.categoryId}
            onChange={(e) => onUpdate('categoryId', e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[15px] rounded-2xl p-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium"
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={20}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <FileText size={14} className="text-[#6C47FF]" /> ชื่อโปรเจกต์ / สินค้า
        </label>
        <input
          type="text"
          value={form.projectName}
          onChange={(e) => onUpdate('projectName', e.target.value)}
          placeholder="เช่น อาหารสัตว์แห้งสูตรลูกสุนัข, เสื้อผ้าสัตว์เลี้ยงชุดฤดูร้อน"
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          รายละเอียดเพิ่มเติม
        </label>
        <textarea
          value={form.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="อธิบายความต้องการ เช่น ขนาด สี วัสดุ จำนวนขั้นต่ำ มาตรฐานที่ต้องการ (อย., GMP ฯลฯ)"
          rows={4}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[15px] rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF] font-medium placeholder:text-slate-400 resize-none"
        />
      </div>
    </div>
  );
}
