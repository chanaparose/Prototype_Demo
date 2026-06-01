import React from 'react';
import { DEEP_PURPLE } from '@/components/features/rfq-and-orders/constants';
import { Lock } from 'lucide-react';

export function LockedUnknownReason() {
  return (
    <div className='w-full max-w-md mx-auto text-center px-1'>
      <Lock size={42} className='mx-auto mb-3 text-gray-400' aria-hidden />
      <h2 className='text-lg font-semibold' style={{ color: DEEP_PURPLE }}>
        การผลิตยังไม่พร้อมแสดง
      </h2>
      <p className='mt-2 text-sm text-gray-600'>
        โปรดรีเฟรชหน้าหรือติดต่อฝ่ายสนับสนุนหากปัญหายังอยู่
      </p>
    </div>
  );
}
