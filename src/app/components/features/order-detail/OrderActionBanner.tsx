import React from 'react';
import { useNavigate } from 'react-router';
import {
  ACCENT_ORANGE_DEEP,
  CTA_GRADIENT,
  PEACH_MIST,
} from '../rfq-and-orders/constants';
import { diffDaysFromNow, formatDateTh } from './utils';
import type { NextAction, PaymentScheduleItem } from '../../../pages/order-detail/orderDetailFromApi';

type Props = {
  nextAction: NextAction | null;
  paymentSchedule: PaymentScheduleItem[];
  /** PP-style copy vs PE urgency */
  variant: 'pending_deposit' | 'deposit_expired';
  /** When BE omits next_action.cta_url (lock_context.payment_url) */
  fallbackCtaUrl?: string;
};

export function OrderActionBanner({
  nextAction,
  paymentSchedule,
  variant,
  fallbackCtaUrl,
}: Props) {
  const navigate = useNavigate();
  const dep = paymentSchedule.find((s) => s.stage === 'DEPOSIT');
  const amount = nextAction?.amount ?? dep?.amount ?? 0;
  const due = nextAction?.due_date ?? dep?.due_date ?? '';
  const daysLeft = diffDaysFromNow(due);
  const urgencyBg = daysLeft <= 1 ? '#FEE2E2' : PEACH_MIST;
  const ctaUrl = (nextAction?.cta_url || fallbackCtaUrl || '').trim();
  const ctaLabel = nextAction?.cta_label_th ?? 'ชำระเงินมัดจำ';

  const headline =
    variant === 'deposit_expired' ? 'หมดกำหนดชำระมัดจำ' : 'ขั้นต่อไป: ชำระมัดจำ';

  const onCta = () => {
    if (ctaUrl.startsWith('http')) {
      window.location.href = ctaUrl;
      return;
    }
    navigate(ctaUrl || '.');
  };

  return (
    <div
      className="sticky top-0 z-20 -mx-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b border-amber-100/80 px-4 py-3"
      style={{ background: urgencyBg }}
    >
      <div className="flex items-start gap-2 sm:items-center sm:flex-1 min-w-0">
        <span className="text-lg shrink-0" aria-hidden>
          🟠
        </span>
        <div className="text-sm min-w-0">
          <p className="font-semibold" style={{ color: ACCENT_ORANGE_DEEP }}>
            {headline}
          </p>
          <p className="text-gray-700 mt-0.5 break-words">
            <span className="font-medium">฿{amount.toLocaleString('th-TH')}</span>
            {due ? (
              <>
                <span className="text-gray-500"> · </span>
                <span>ครบกำหนด {formatDateTh(due)}</span>
                <span className={`${daysLeft <= 1 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                  {' '}
                  (เหลือ {daysLeft} วัน)
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCta}
        className="w-full sm:w-auto shrink-0 rounded-lg px-4 py-2.5 sm:py-1.5 text-xs font-semibold text-white"
        style={{ background: CTA_GRADIENT }}
      >
        {ctaLabel} →
      </button>
    </div>
  );
}
