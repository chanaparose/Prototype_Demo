import React from 'react';
import { useNavigate } from 'react-router';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import {
  ACCENT_ORANGE_DEEP,
  BORDER_WARM,
  CTA_GRADIENT,
  DEEP_PURPLE,
  PEACH_MIST,
  PLUM,
} from '@/components/features/rfq-and-orders/constants';
import type { ProductionLockContext } from '@/components/features/production/types';
import { diffDaysFromNow, formatDateTh } from '@/components/features/order-detail/utils';
import { Button } from '@/components/ui/button';
import { Banknote, Lock } from 'lucide-react';

type Props = {
  ctx: ProductionLockContext;
  onBackToOverview?: () => void;
  onPayDeposit?: () => void;
};

export function LockedPendingDeposit({ ctx, onBackToOverview, onPayDeposit }: Props) {
  const navigate = useNavigate();
  const due = ctx.deposit_due_date ?? '';
  const daysLeft = diffDaysFromNow(due);
  const isUrgent = daysLeft <= 1;
  const amount = ctx.deposit_amount ?? 0;

  const pay = () => {
    if (onPayDeposit) {
      onPayDeposit();
      return;
    }
    navigate('.');
  };

  return (
    <div className='w-full max-w-md mx-auto text-center px-1'>
      <Lock size={42} className='mx-auto mb-3 text-gray-400 sm:mb-4' aria-hidden />
      <h2 className='text-lg font-semibold' style={{ color: DEEP_PURPLE }}>
        รอการชำระเงิน
      </h2>
      <p className='mt-2 text-sm text-gray-600'>
        กรุณาโอนเงินให้โรงงานและแนบสลีป โรงงานจะเริ่มผลิตหลังตรวจสอบสลีปแล้ว
      </p>

      <div
        className='mt-6 rounded-2xl border p-5 text-left'
        style={{ borderColor: BORDER_WARM, background: PEACH_MIST }}
      >
        <p className='flex items-center gap-1.5 text-xs' style={{ color: ACCENT_ORANGE_DEEP }}>
          <Banknote size={13} />
          ยอดที่ต้องโอน
        </p>
        <p className='mt-1 text-xl font-semibold tabular-nums' style={{ color: DEEP_PURPLE }}>
          {formatCurrency(amount)}
        </p>
        {due ? (
          <p
            className={`mt-2 text-xs ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-600'}`}
          >
            ครบกำหนด {formatDateTh(due)} • เหลือ {daysLeft} วัน
          </p>
        ) : null}
      </div>

      <Button
        variant='unstyled'
        type='button'
        onClick={pay}
        className='mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white'
        style={{ background: CTA_GRADIENT }}
      >
        โอนเงินและแนบสลีป →
      </Button>

      <Button
        variant='unstyled'
        type='button'
        onClick={() => (onBackToOverview ? onBackToOverview() : navigate('/orders'))}
        className='mt-3 w-full rounded-xl py-3 text-sm font-medium'
        style={{ color: PLUM }}
      >
        กลับไปหน้าภาพรวม
      </Button>
    </div>
  );
}
