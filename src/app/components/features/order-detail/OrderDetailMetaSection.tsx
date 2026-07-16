import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import { formatDateTh } from '@/components/features/order-detail/utils';
import { OrderPaymentScheduleCard } from '@/components/features/order-detail/OrderPaymentScheduleCard';
import { OrderPendingPaymentSection } from '@/components/features/order-detail/OrderPendingPaymentSection';
import { isPendingPaymentStatus } from '@/domain/order/status';
import { useOrderDetail } from '@/pages/order-detail/OrderDetailContext';
import type { RfqSummary } from '@/components/features/order-detail/OrderSummaryCard';
import { Button } from '@/components/ui/button';

type Props = {
  order: {
    id: string;
    totalAmount: number;
    depositPaid: number;
    estimatedDelivery: string;
    status: string;
    quantity?: number;
  };
  rfqSummary?: RfqSummary | null;
  onCancel?: () => void;
  showCancel?: boolean;
};

export function OrderDetailMetaSection({
  order,
  rfqSummary,
  onCancel,
  showCancel,
}: Props) {
  const [open, setOpen] = useState(false);
  const { paymentSchedule, orderTimelineMeta, refetchAll } = useOrderDetail();
  const showDepositPayment = isPendingPaymentStatus(order.status);

  const legacyQty =
    typeof order.quantity === 'number' && Number.isFinite(order.quantity) && order.quantity > 0
      ? order.quantity
      : null;
  const qty = rfqSummary?.quantity ?? legacyQty;
  const unit = rfqSummary?.unit_name ?? 'ชิ้น';
  const qtyText = qty != null ? `${formatCompactNumber(qty)} ${unit}` : '—';

  const payableAmount = React.useMemo(() => {
    const stagedAmount = paymentSchedule.find(
      (s) => s.stage === 'FULL_PAYMENT' || s.stage === 'DEPOSIT',
    )?.amount;
    if (Number.isFinite(stagedAmount) && Number(stagedAmount) > 0) return Number(stagedAmount);
    if (Number.isFinite(order.depositPaid) && order.depositPaid > 0) return order.depositPaid;
    return 0;
  }, [order.depositPaid, paymentSchedule]);

  return (
    <div className='space-y-4'>
       

      <OrderPaymentScheduleCard schedule={paymentSchedule} timelineMeta={orderTimelineMeta} />

      {showDepositPayment ? (
        <OrderPendingPaymentSection
          orderId={order.id}
          depositAmount={payableAmount}
          totalAmount={order.totalAmount}
          onVerified={() => void refetchAll()}
        />
      ) : null}

      {showCancel && onCancel ? (
        <Button
          variant='unstyled'
          type='button'
          onClick={onCancel}
          className='flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-colors'
          style={{
            borderColor: '#FCA5A5',
            color: 'var(--status-danger-deep)',
            backgroundColor: 'var(--surface-rose-tint)',
          }}
        >
          ยกเลิกคำสั่งซื้อ
        </Button>
      ) : null}
    </div>
  );
}
