import React from 'react';
import { useNavigate } from 'react-router';
import { Clock } from 'lucide-react';
import { CTA_GRADIENT } from '@/components/features/rfq-and-orders/constants';
import { diffDaysFromNow, formatDateTh } from '@/components/features/order-detail/utils';
import type { NextAction, PaymentScheduleItem } from '@/pages/order-detail/orderDetailFromApi';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { Button } from '@/components/ui/button';
import { cn } from '@lib/utils';

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

  const isExpired = variant === 'deposit_expired';

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 space-y-3',
        isExpired ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50',
      )}
    >
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <Clock
            size={16}
            className={cn('shrink-0', isExpired ? 'text-red-500' : 'text-amber-500')}
          />
          <span
            className={cn('text-sm font-bold', isExpired ? 'text-red-700' : 'text-amber-800')}
          >
            {headline}
          </span>
        </div>
        <p className={cn('text-xs ml-6', isExpired ? 'text-red-600' : 'text-amber-700')}>
          <span className='font-semibold'>{formatCurrency(amount, 'THB')}</span>
          {due ? (
            <>
              {' · '}
              {isExpired
                ? `ชำระเงินได้ถึงวันที่ ${formatDateTh(due)}`
                : `ครบกำหนด ${formatDateTh(due)}`}
              {!isExpired ? (
                <span className={daysLeft <= 1 ? ' font-semibold text-red-600' : ''}>
                  {' '}
                  (เหลือ {daysLeft} วัน)
                </span>
              ) : null}
            </>
          ) : null}
        </p>
      </div>
      <Button
        variant='unstyled'
        type='button'
        onClick={onCta}
        className='w-full rounded-xl px-4 py-2.5 text-[13px] font-bold text-white hover:brightness-[1.02] active:scale-[0.995]'
        style={{ background: CTA_GRADIENT }}
      >
        {ctaLabel} →
      </Button>
    </div>
  );
}
