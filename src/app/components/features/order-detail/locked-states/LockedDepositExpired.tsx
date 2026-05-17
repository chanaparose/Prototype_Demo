import React from 'react';
import { useNavigate } from 'react-router';
import { DEEP_PURPLE, PLUM } from '@/components/features/rfq-and-orders/constants';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import type { ProductionLockContext } from '@/components/features/production/types';
import { formatDateTh } from '@/components/features/order-detail/utils';
import { Button } from '@/components/ui/button';

type Props = {
  ctx: ProductionLockContext;
  onBackToOverview?: () => void;
};

export function LockedDepositExpired({ ctx, onBackToOverview }: Props) {
  const navigate = useNavigate();
  const amount = ctx.deposit_amount ?? 0;
  const expired = ctx.expired_at ?? ctx.deposit_due_date ?? '';

  return (
    <div className='w-full max-w-md mx-auto text-center px-1'>
      <div className='mb-3 sm:mb-4 text-4xl sm:text-5xl' aria-hidden>
        🔒
      </div>
      <h2 className='text-lg font-semibold text-red-800'>คำสั่งซื้อหมดอายุ</h2>
      <p className='mt-2 text-sm text-gray-700'>
        เกินกำหนดชำระเงินแล้ว คำสั่งซื้อนี้ไม่สามารถดำเนินการต่อได้
      </p>

      <div
        className='mt-6 rounded-2xl border p-5 text-left'
        style={{ borderColor: 'rgba(220, 38, 38, 0.25)', background: '#FEF2F2' }}
      >
        <p className='text-xs font-semibold text-red-700'>💰 ยอดที่ต้องชำระ</p>
        <p className='mt-1 text-xl font-semibold tabular-nums' style={{ color: DEEP_PURPLE }}>
          {formatCurrency(amount)}
        </p>
        {expired ? (
          <p className='mt-2 text-xs text-red-700'>ครบกำหนดชำระ {formatDateTh(expired)}</p>
        ) : null}
      </div>

      <Button
        variant='unstyled'
        type='button'
        onClick={() => (onBackToOverview ? onBackToOverview() : navigate('/orders'))}
        className='mt-6 w-full rounded-xl py-3 text-sm font-medium'
        style={{ color: PLUM }}
      >
        กลับไปหน้าภาพรวม
      </Button>
    </div>
  );
}
