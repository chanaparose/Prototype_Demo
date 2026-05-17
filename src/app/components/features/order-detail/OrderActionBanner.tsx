import React from 'react';
import { useNavigate } from 'react-router';
import {
  ACCENT_ORANGE_DEEP,
  CTA_GRADIENT,
  PEACH_MIST,
} from '@/components/features/rfq-and-orders/constants';
import { diffDaysFromNow, formatDateTh } from '@/components/features/order-detail/utils';
import type { NextAction, PaymentScheduleItem } from '@/pages/order-detail/orderDetailFromApi';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { Button } from '@/components/ui/button';

type Props = {
  nextAction: NextAction | null;
  paymentSchedule: PaymentScheduleItem[];
  /** PP-style copy vs PE urgency */
  variant: 'pending_deposit' | 'deposit_expired';

  fallbackCtaUrl?: string;

  onPayDeposit?: () => void;
};

export function OrderActionBanner({
  nextAction,
  paymentSchedule,
  variant,
  fallbackCtaUrl,
  onPayDeposit,
}: Props) {
  const navigate = useNavigate();
  const pay = paymentSchedule.find((s) => s.stage === 'FULL_PAYMENT' || s.stage === 'DEPOSIT');
  const amount = nextAction?.amount ?? pay?.amount ?? 0;
  const due = nextAction?.due_date ?? pay?.due_date ?? '';
  const daysLeft = diffDaysFromNow(due);
  const urgencyBg = daysLeft <= 1 ? 'var(--status-danger-soft)' : PEACH_MIST;
  const ctaUrl = (nextAction?.cta_url || fallbackCtaUrl || '').trim();
  const ctaLabel = nextAction?.cta_label_th ?? 'ชำระเงินเต็มจำนวน';

  const headline =
    variant === 'deposit_expired' ? 'หมดกำหนดชำระเงิน' : 'ขั้นต่อไป: ชำระเงินเต็มจำนวน';

  const onCta = () => {
    if (onPayDeposit) {
      onPayDeposit();
      return;
    }
    if (ctaUrl.startsWith('http')) {
      window.location.href = ctaUrl;
      return;
    }
    navigate(ctaUrl || '.');
  };

  return (
    <div
      className='sticky top-0 z-20 -mx-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b border-amber-100/80 px-4 py-3'
      style={{ background: urgencyBg }}
    >
      <div className='flex items-start gap-2 sm:items-center sm:flex-1 min-w-0'>
        <span className='text-lg shrink-0' aria-hidden>
          🟠
        </span>
        <div className='text-sm min-w-0'>
          <p className='font-semibold' style={{ color: ACCENT_ORANGE_DEEP }}>
            {headline}
          </p>
          <p className='text-gray-700 mt-0.5 break-words'>
            <span className='font-medium'>{formatCurrency(amount, 'THB')}</span>
            {due ? (
              <>
                <span className='text-gray-500'> · </span>
                <span>
                  {variant === 'deposit_expired'
                    ? `ชำระเงินได้ถึงวันที่ ${formatDateTh(due)}`
                    : `ครบกำหนด ${formatDateTh(due)}`}
                </span>
                <span
                  className={`${daysLeft <= 1 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}
                >
                  {' '}
                  (เหลือ {daysLeft} วัน)
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <Button
        variant='unstyled'
        type='button'
        onClick={onCta}
        className='w-full sm:w-auto shrink-0 rounded-lg px-4 py-2.5 sm:py-1.5 text-xs font-semibold text-white'
        style={{ background: CTA_GRADIENT }}
      >
        {ctaLabel} →
      </Button>
    </div>
  );
}
