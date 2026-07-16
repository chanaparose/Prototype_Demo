import React from 'react';
import { OrderPaymentScheduleCard } from '@/components/features/order-detail/OrderPaymentScheduleCard';
import { OrderPendingPaymentSection } from '@/components/features/order-detail/OrderPendingPaymentSection';
import { isPendingPaymentStatus } from '@/domain/order/status';
import { useOrderDetail } from '@/pages/order-detail/OrderDetailContext';

export type OrderForOverview = {
  totalAmount: number;
  depositPaid: number;
  factoryId: string;
  factoryName: string;
};

type OrderOverviewSectionProps = {
  order: OrderForOverview;
};

/** Payment schedule + deposit UI only (RFQ/quote moved to OrderDetailReferenceDocs). */
export function OrderOverviewSection({ order }: OrderOverviewSectionProps) {
  const { paymentSchedule, mappedOrder, orderTimelineMeta, refetchAll } = useOrderDetail();
  const showDepositPayment = isPendingPaymentStatus(mappedOrder.status);
  const payableAmount = React.useMemo(() => {
    const stagedAmount = paymentSchedule.find(
      (s) => s.stage === 'FULL_PAYMENT' || s.stage === 'DEPOSIT',
    )?.amount;
    if (Number.isFinite(stagedAmount) && Number(stagedAmount) > 0) return Number(stagedAmount);
    if (Number.isFinite(mappedOrder.depositPaid) && mappedOrder.depositPaid > 0)
      return mappedOrder.depositPaid;
    if (Number.isFinite(order.depositPaid) && order.depositPaid > 0) return order.depositPaid;
    return 0;
  }, [mappedOrder.depositPaid, order.depositPaid, paymentSchedule]);

  return (
    <div className='space-y-4'>
      <OrderPaymentScheduleCard schedule={paymentSchedule} timelineMeta={orderTimelineMeta} />

      {showDepositPayment && (
        <OrderPendingPaymentSection
          orderId={mappedOrder.id}
          depositAmount={payableAmount}
          totalAmount={mappedOrder.totalAmount}
          onVerified={() => void refetchAll()}
        />
      )}

    </div>
  );
}
