import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import React, { useRef, useState } from 'react';
import {
  Package,
  DollarSign,
  Image as ImageIcon,
  CheckCircle,
  Loader,
  X,
  Plus,
} from 'lucide-react';
import type { CreateRfqForm } from '@/components/features/create-rfq/types';
import type { Unit } from '@/components/features/create-rfq/types';
import { mediaApi } from '@/services/api';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type CreateRfqStep2Props = {
  form: CreateRfqForm;
  units: Unit[];
  onUpdate: <K extends keyof CreateRfqForm>(key: K, value: CreateRfqForm[K]) => void;
};

export function CreateRfqStep2({ form, units, onUpdate }: CreateRfqStep2Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await mediaApi.upload(file);
      onUpdate('imageUrls', [...form.imageUrls, res.url]);
    } catch {
      // silent fail — user can retry
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    onUpdate(
      'imageUrls',
      form.imageUrls.filter((_, i) => i !== idx),
    );
  };

  const selectedUnit = units.find((u) => u.id === form.unitId);

  return (
    <div className='flex flex-col gap-5'>
      <div className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100'>
        <Label className='text-[13px] font-bold text-gray-700 mb-3 flex items-center gap-1.5'>
          <Package size={14} className='text-violet-500' />
          จำนวนที่ต้องการผลิต <span className='text-red-400'>*</span>
        </Label>
        <div className='flex gap-2'>
          <Input
            type='number'
            min={1}
            inputMode='numeric'
            value={form.quantity}
            onChange={(e) => onUpdate('quantity', e.target.value)}
            placeholder='จำนวน'
            className='flex-1 min-w-0 bg-gray-50 border border-gray-200 text-gray-800 text-[14px] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 placeholder:text-gray-400 tabular-nums'
          />

          <div className='relative shrink-0 w-[min(11rem,40vw)] min-w-[7.5rem]'>
            <Select
              value={form.unitId}
              onValueChange={(next) => onUpdate('unitId', next === '__empty' ? '' : next)}
            >
              <SelectTrigger
                aria-label='หน่วยนับ'
                className='h-[46px] bg-gray-50 text-gray-800 text-[14px] font-medium'
              >
                <SelectValue placeholder='— เลือกหน่วย —' />
              </SelectTrigger>
              <SelectContent>
                {units.length === 0 ? (
                  <SelectItem value='__empty'>— เลือกหน่วย —</SelectItem>
                ) : (
                  units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.quantity && selectedUnit && (
          <p className='text-[11px] text-violet-600 font-medium mt-2 bg-violet-50 px-3 py-1.5 rounded-lg'>
            สั่งผลิต {formatCompactNumber(Number(form.quantity))} {selectedUnit.name}
          </p>
        )}
      </div>

      <div className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100'>
        <Label className='text-[13px] font-bold text-gray-700 mb-2 flex items-center gap-1.5'>
          <DollarSign size={14} className='text-emerald-500' />
          งบประมาณต่อชิ้น (บาท) <span className='text-red-400'>*</span>
        </Label>
        <div className='relative'>
          <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-medium'>
            ฿
          </span>
          <Input
            type='text'
            inputMode='decimal'
            value={form.budgetPerPiece}
            onChange={(e) => {
              // allow only numbers and decimal point
              const v = e.target.value.replace(/[^0-9.]/g, '');
              onUpdate('budgetPerPiece', v);
            }}
            placeholder='0.00'
            className='w-full bg-gray-50 border border-gray-200 text-gray-800 text-[14px] rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 placeholder:text-gray-400 tabular-nums'
          />
        </div>
        {form.quantity && form.budgetPerPiece && (
          <p className='text-[11px] text-emerald-600 font-medium mt-2 bg-emerald-50 px-3 py-1.5 rounded-lg'>
            งบประมาณรวมประมาณ{' '}
            {formatCurrency(Number(form.quantity) * Number(form.budgetPerPiece), 'THB')}
          </p>
        )}
        <p className='text-[10px] text-gray-400 mt-1.5'>
          ใส่ราคาเป้าหมายต่อ 1 หน่วย เพื่อให้โรงงานเสนอราคาได้ตรงความต้องการ
        </p>
      </div>

      <div className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100'>
        <Label className='text-[13px] font-bold text-gray-700 mb-3 flex items-center gap-1.5'>
          <ImageIcon size={14} className='text-amber-500' />
          รูปอ้างอิง / ไฟล์แนบ
        </Label>
        <Input
          ref={fileInputRef}
          type='file'
          accept='image/png,image/jpeg,image/jpg,application/pdf'
          className='hidden'
          onChange={handleFileChange}
        />

        <div className='grid grid-cols-3 gap-2'>
          {form.imageUrls.map((url, idx) => (
            <div
              key={idx}
              className='relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group'
            >
              <Image src={url} alt={`อ้างอิง ${idx + 1}`} className='w-full h-full object-cover' />
              <Button
                variant='unstyled'
                type='button'
                onClick={() => removeImage(idx)}
                className='absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity'
              >
                <X size={12} className='text-white' />
              </Button>
              <div className='absolute bottom-1 left-1'>
                <CheckCircle size={14} className='text-green-400 drop-shadow' />
              </div>
            </div>
          ))}

          {form.imageUrls.length < 5 && (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className='aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50'
            >
              {uploading ? (
                <Loader size={20} className='text-violet-400 animate-spin' />
              ) : (
                <Plus size={20} className='text-gray-400' />
              )}
              <span className='text-[9px] text-gray-400 font-medium'>
                {uploading ? 'อัปโหลด...' : 'เพิ่มรูป'}
              </span>
            </Button>
          )}
        </div>
        <p className='text-[10px] text-gray-400 mt-2'>
          อัปโหลดได้สูงสุด 5 รูป (PNG, JPG, PDF ไม่เกิน 10MB/รูป)
        </p>
      </div>
    </div>
  );
}
