import React, { useMemo } from 'react';
import type { LockReason } from '@/pages/order-detail/getOrderUiMode';
import type {
  ProductionLockContext,
  ProductionStepTemplate,
} from '@/components/features/production/types';
import { FadedStepPreview } from '@/components/features/order-detail/locked-states/FadedStepPreview';
import { LockedDepositExpired } from '@/components/features/order-detail/locked-states/LockedDepositExpired';
import { LockedOrderCancelled } from '@/components/features/order-detail/locked-states/LockedOrderCancelled';
import { LockedPendingDeposit } from '@/components/features/order-detail/locked-states/LockedPendingDeposit';
import { LockedUnknownReason } from '@/components/features/order-detail/locked-states/LockedUnknownReason';

type Props = {
  reason: LockReason;
  lockContext: ProductionLockContext;
  templatePreview: ProductionStepTemplate[];
  onBackToOverview?: () => void;
  onPayDeposit?: () => void;
};

export function ProductionLockedState({
  reason,
  lockContext,
  templatePreview,
  onBackToOverview,
  onPayDeposit,
}: Props) {
  const body = useMemo(() => {
    switch (reason) {
      case 'PENDING_DEPOSIT':
        return (
          <LockedPendingDeposit
            ctx={lockContext}
            onBackToOverview={onBackToOverview}
            onPayDeposit={onPayDeposit}
          />
        );
      case 'DEPOSIT_EXPIRED':
        return <LockedDepositExpired ctx={lockContext} onBackToOverview={onBackToOverview} />;
      case 'ORDER_CANCELLED':
        return <LockedOrderCancelled />;
      default:
        return <LockedUnknownReason />;
    }
  }, [reason, lockContext, onBackToOverview, onPayDeposit]);

  return (
    <div className='flex flex-col items-center space-y-6 py-6 sm:py-8'>
      {body}
      <FadedStepPreview steps={templatePreview} />
    </div>
  );
}
