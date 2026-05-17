import React from 'react';
import { DEEP_PURPLE } from '@/components/features/rfq-and-orders/constants';

export function LockedUnknownReason() {
  return (
    <div className='w-full max-w-md mx-auto text-center px-1'>
      <div className='mb-3 text-4xl sm:text-5xl' aria-hidden>
        🔒
      </div>
      <h2 className='text-lg font-semibold' style={{ color: DEEP_PURPLE }}>
        การผลิตยังไม่พร้อมแสดง
      </h2>
      <p className='mt-2 text-sm text-gray-600'>
        โปรดรีเฟรชหน้าหรือติดต่อฝ่ายสนับสนุนหากปัญหายังอยู่
      </p>
    </div>
  );
}
