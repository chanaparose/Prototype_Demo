import React, { useMemo } from 'react';
import type { LockReason } from '../../../../pages/order-detail/getOrderUiMode';
import type { ProductionLockContext, ProductionStepTemplate } from '../../production/types';
import { FadedStepPreview } from './FadedStepPreview';
import { LockedDepositExpired } from './LockedDepositExpired';
import { LockedOrderCancelled } from './LockedOrderCancelled';
import { LockedPendingDeposit } from './LockedPendingDeposit';
import { LockedUnknownReason } from './LockedUnknownReason';

type Props = {
  reason: LockReason;
  lockContext: ProductionLockContext;
  templatePreview: ProductionStepTemplate[];
  onBackToOverview?: () => void;
};

export function ProductionLockedState({
  reason,
  lockContext,
  templatePreview,
  onBackToOverview,
}: Props) {
  const body = useMemo(() => {
    switch (reason) {
      case 'PENDING_DEPOSIT':
        return <LockedPendingDeposit ctx={lockContext} onBackToOverview={onBackToOverview} />;
      case 'DEPOSIT_EXPIRED':
        return <LockedDepositExpired ctx={lockContext} onBackToOverview={onBackToOverview} />;
      case 'ORDER_CANCELLED':
        return <LockedOrderCancelled />;
      default:
        return <LockedUnknownReason />;
    }
  }, [reason, lockContext, onBackToOverview]);

  return (
    <div className="flex flex-col items-center space-y-6 py-6 sm:py-8">
      {body}
      <FadedStepPreview steps={templatePreview} />
    </div>
  );
}
