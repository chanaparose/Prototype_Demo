import React from 'react';
import { CheckCircle2, Image as ImageIcon } from 'lucide-react';
import type { CreateRfqForm } from './types';

type CreateRfqStep3SummaryProps = {
  form: CreateRfqForm;
  categoryName: string;
};

export function CreateRfqStep3Summary({ form, categoryName }: CreateRfqStep3SummaryProps) {
  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4 pb-4 border-b border-slate-100">
          สรุปคำขอ
        </h3>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              โปรเจกต์
            </span>
            <p className="font-bold text-slate-800 mt-1">{form.projectName || '-'}</p>
            <p className="text-sm text-slate-500">{categoryName}</p>
          </div>
          {form.description ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                รายละเอียด
              </span>
              <p className="text-sm text-slate-600 mt-1 line-clamp-3">{form.description}</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ความต้องการ
            </span>
            <p className="font-bold text-slate-800 mt-1">
              {form.quantity
                ? `${Number(form.quantity).toLocaleString('th-TH')} หน่วย`
                : '-'}
            </p>
            {form.budget && (
              <p className="text-sm text-slate-500 mt-0.5">
                งบประมาณเป้าหมาย: ฿{Number(form.budget).toLocaleString('th-TH')}
              </p>
            )}
            {form.material && (
              <p className="text-sm text-slate-500 mt-0.5">วัสดุ: {form.material}</p>
            )}
            {form.deadline && (
              <p className="text-sm text-slate-500 mt-0.5">
                ต้องการรับภายใน:{' '}
                {new Date(form.deadline + 'T00:00:00').toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ไฟล์แนบ
            </span>
            <div className="flex gap-2 mt-2">
              <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <ImageIcon size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl flex items-start gap-3">
        <CheckCircle2 className="text-[#6C47FF] shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-violet-900 font-medium">
          คำขอของคุณจะถูกส่งไปยังโรงงานที่ตรงกับหมวดหมู่และความสามารถ
          คุณจะได้รับใบเสนอราคาจากหลายโรงงานเพื่อเปรียบเทียบ
        </p>
      </div>
    </>
  );
}
