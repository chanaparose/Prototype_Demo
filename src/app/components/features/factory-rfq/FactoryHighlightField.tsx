import React from 'react';
import { Lock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface FactoryHighlightFieldProps {
  value: string;
  onChange: (value: string) => void;
  isLocked?: boolean;
  maxLength?: number;
  error?: string | null;
}

export function FactoryHighlightField({
  value,
  onChange,
  isLocked = false,
  maxLength = 200,
  error,
}: FactoryHighlightFieldProps) {
  const len = value.trim().length;
  const counterClass = len > maxLength || len > 180 ? 'text-red-500' : 'text-gray-400';

  return (
    <div>
      <label className='block text-xs font-semibold text-gray-600 mb-1.5'>
        รายละเอียดสินค้าและ BOQ
      </label>
      <div
        className={`rounded-xl border ${error ? 'border-red-300' : 'border-gray-200'} p-2.5 bg-white`}
      >
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='เช่น วัตถุดิบ Grade A ผ่าน ISO9001 · Lead time 7 วัน · ส่งฟรีสั่ง ≥ 300 ชิ้น'
          rows={4}
          readOnly={isLocked}
          className='w-full resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none read-only:cursor-not-allowed'
        />
        <div className='mt-1 flex items-center justify-between'>
          <p className='text-[11px] text-gray-500'>
            ข้อมูลนี้จะแสดงเด่นให้ลูกค้าเห็นในหน้าเปรียบเทียบข้อเสนอ
          </p>
          <span className={`text-[11px] tabular-nums ${counterClass}`}>
            {len}/{maxLength}
          </span>
        </div>
      </div>
      {isLocked ? (
        <p className='mt-1 text-[11px] text-gray-500 inline-flex items-center gap-1'>
          <Lock size={12} />
          ลูกค้ายืนยันข้อเสนอแล้ว — แก้ไขไม่ได้
        </p>
      ) : null}
      {error ? <p className='mt-1 text-[11px] text-red-600'>{error}</p> : null}
    </div>
  );
}
