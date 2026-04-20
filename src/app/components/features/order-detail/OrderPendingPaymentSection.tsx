import React from 'react';

type Props = {
  orderId: string;
  depositAmount: number;
  totalAmount: number;
  onVerified?: () => void;
};

/**
 * ช่องชำระมัดจำแบบ prototype (สร้าง DP + verify) ถูกถอนออก —
 * การชำระหลักใช้จากแบนเนอร์ / ลิงก์ชำระเงินตาม flow ออเดอร์
 */
export function OrderPendingPaymentSection(props: Props) {
  const { depositAmount } = props;
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return (
      <p className="text-sm text-amber-900 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
        ไม่พบยอดมัดจำจากระบบ — ติดต่อฝ่ายสนับสนุน
      </p>
    );
  }
  return null;
}
