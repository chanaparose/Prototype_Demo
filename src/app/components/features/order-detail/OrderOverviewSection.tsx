import React from 'react';
import { Link } from 'react-router';
import { FileText } from 'lucide-react';
import { SectionCard } from '@/shared/ui/cards/SectionCard';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import { formatDateTh } from '@/components/features/order-detail/utils';
import { OrderPaymentScheduleCard } from '@/components/features/order-detail/OrderPaymentScheduleCard';
import { OrderPendingPaymentSection } from '@/components/features/order-detail/OrderPendingPaymentSection';
import { isPendingPaymentStatus } from '@/domain/order/status';
import { useOrderDetail } from '@/pages/order-detail/OrderDetailContext';
import { CategoryIcon } from '@/components/ui/category-icon';

export type OrderForOverview = {
  totalAmount: number;
  depositPaid: number;
  factoryId: string;
  factoryName: string;
};

export type RfqForOverview = {
  category: string;
  categoryIcon?: string | React.ReactNode;
  projectName: string;
  description?: string;
  budget: number;
  quantity: number;
  unitName?: string;
  material: string;
  deadline: string;
};

export type OfferForOverview = {
  id: string;
  factoryId: string;
  factoryName: string;
  rating: number;
  responseTime: string;
  price: number;
  leadTime: number;
  recommended?: boolean;
  verified?: boolean;
};

type OrderOverviewSectionProps = {
  order: OrderForOverview;
  relatedRfq: RfqForOverview | null | undefined;
  rfqOffers: OfferForOverview[];
};

export function OrderOverviewSection({ order, relatedRfq, rfqOffers }: OrderOverviewSectionProps) {
  const { paymentSchedule, mappedOrder, refetchAll } = useOrderDetail();
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
      <OrderPaymentScheduleCard schedule={paymentSchedule} />

      {showDepositPayment && (
        <OrderPendingPaymentSection
          orderId={mappedOrder.id}
          depositAmount={payableAmount}
          totalAmount={mappedOrder.totalAmount}
          onVerified={() => void refetchAll()}
        />
      )}

      {relatedRfq && (
        <SectionCard
          title='RFQ ที่เกี่ยวข้อง'
          icon={<CategoryIcon value={relatedRfq.categoryIcon} size={16} className='text-brand-mauve' />}
          className='bg-white rounded-2xl shadow-sm'
        >
          <div className='rounded-xl border border-gray-100 p-3 bg-brand-page'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs text-gray-500'>{relatedRfq.category}</p>
                <p className='text-sm text-gray-900 truncate' style={{ fontWeight: 600 }}>
                  {relatedRfq.projectName}
                </p>
              </div>
            </div>

            <p className='text-xs text-gray-600 mb-3'>{relatedRfq.description}</p>

            <div className='mb-3 rounded-lg bg-white border border-gray-100 px-2.5 py-2'>
              <p className='text-[10px] text-gray-500 mb-0.5'>โรงงานที่เลือก</p>
              <Link
                to={`/factories/${order.factoryId}`}
                className='text-xs text-brand-purple hover:underline'
                style={{ fontWeight: 600 }}
              >
                {order.factoryName}
              </Link>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <div className='rounded-lg bg-white border border-gray-100 px-2.5 py-2'>
                <p className='text-[10px] text-gray-500'>งบประมาณ RFQ</p>
                <p className='text-xs text-gray-900' style={{ fontWeight: 600 }}>
                  {formatCurrency(relatedRfq.budget)}
                </p>
              </div>
              <div className='rounded-lg bg-white border border-gray-100 px-2.5 py-2'>
                <p className='text-[10px] text-gray-500'>จำนวน</p>
                <p className='text-xs text-gray-900' style={{ fontWeight: 600 }}>
                  {formatCompactNumber(relatedRfq.quantity)} {relatedRfq.unitName || 'ชิ้น'}
                </p>
              </div>
              <div className='rounded-lg bg-white border border-gray-100 px-2.5 py-2'>
                <p className='text-[10px] text-gray-500'>วัสดุ</p>
                <p className='text-xs text-gray-900 truncate' style={{ fontWeight: 600 }}>
                  {relatedRfq.material}
                </p>
              </div>
              <div className='rounded-lg bg-white border border-gray-100 px-2.5 py-2'>
                <p className='text-[10px] text-gray-500'>กำหนดส่ง RFQ</p>
                <p className='text-xs text-gray-900' style={{ fontWeight: 600 }}>
                  {formatDateTh(relatedRfq.deadline)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {relatedRfq && rfqOffers.length > 0 && (
        <SectionCard
          title='โรงงานที่เคยเสนอราคา'
          badge={<span className='text-xs text-gray-500'>{rfqOffers.length} โรงงาน</span>}
          className='bg-white rounded-2xl shadow-sm'
        >
          <div className='space-y-2.5'>
            {rfqOffers.map((offer) => (
              <div
                key={offer.id}
                className='rounded-xl border border-gray-100 bg-brand-page px-3 py-2.5'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <Link
                      to={`/factories/${offer.factoryId}`}
                      className='text-sm text-brand-purple hover:underline truncate block'
                      style={{ fontWeight: 600 }}
                    >
                      {offer.factoryName}
                    </Link>
                    <p className='text-[11px] text-gray-500 mt-0.5'>
                      เรตติ้ง {offer.rating} • ตอบกลับ {offer.responseTime}
                    </p>
                  </div>
                  <div className='text-right shrink-0'>
                    <p className='text-sm text-gray-900' style={{ fontWeight: 700 }}>
                      {formatCurrency(offer.price)}
                    </p>
                    <p className='text-[11px] text-gray-500'>Lead time {offer.leadTime} วัน</p>
                  </div>
                </div>

                <div className='flex items-center gap-1.5 mt-2 flex-wrap'>
                  {offer.factoryId === order.factoryId && (
                    <span
                      className='px-2 py-0.5 rounded-full text-[10px]'
                      style={{
                        background: 'rgba(162,56,255,0.12)',
                        color: 'var(--brand-purple)',
                        fontWeight: 600,
                      }}
                    >
                      โรงงานที่เลือก
                    </span>
                  )}
                  {offer.recommended && (
                    <span
                      className='px-2 py-0.5 rounded-full text-[10px]'
                      style={{
                        background: '#ECFDF5',
                        color: 'var(--status-success)',
                        fontWeight: 600,
                      }}
                    >
                      แนะนำโดย AI
                    </span>
                  )}
                  {offer.verified && (
                    <span
                      className='px-2 py-0.5 rounded-full text-[10px]'
                      style={{
                        background: '#EEF2FF',
                        color: 'var(--brand-indigo)',
                        fontWeight: 600,
                      }}
                    >
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
