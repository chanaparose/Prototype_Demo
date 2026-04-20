import React from 'react';
import { DEEP_PURPLE } from '../../rfq-and-orders/constants';

export function LockedOrderCancelled() {
  return (
    <div className="w-full max-w-md mx-auto text-center px-1">
      <div className="mb-3 text-4xl sm:text-5xl" aria-hidden>
        🔒
      </div>
      <h2 className="text-lg font-semibold" style={{ color: DEEP_PURPLE }}>
        คำสั่งซื้อถูกยกเลิก
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        ไม่มีการผลิตสำหรับคำสั่งซื้อนี้ หากมีเงินค้างโปรดติดต่อฝ่ายสนับสนุนตามนโยบายคืนเงิน
      </p>
    </div>
  );
}
