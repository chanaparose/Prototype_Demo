import React from 'react';
import { useNavigate } from 'react-router';
import {
  Package,
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Truck,
  OctagonX,
} from 'lucide-react';
import {
  ACCENT_ORANGE,
  BORDER_WARM,
  ORDER_STATUS_CONFIG,
  ORDER_MOBILE_TAB_THEME,
  type OrderFilterId,
} from '@/components/features/rfq-and-orders/constants';
import { isPendingPaymentStatus } from '@/domain/order/status';
import {
  formatBudget,
  getOrderProgressBg,
  getOrderTabCount,
} from '@/components/features/rfq-and-orders/utils';
import { getOrderProgressMeta } from '@/components/features/order-detail/orderProgressMeta';
import type { useRfqAndOrdersState } from '@/components/features/rfq-and-orders/hooks/useRfqAndOrdersState';
import { type Order } from '@/stores/types';
import { Button } from '@/components/ui/button';

const ORDER_TABS: {
  id: OrderFilterId;
  shortLabel: string;
  fullLabel: string;
  icon: typeof Package;
}[] = [
  { id: 'pending_payment', shortLabel: 'รอชำระ', fullLabel: 'รอชำระมัดจำ', icon: Banknote },
  { id: 'in_production', shortLabel: 'กำลังผลิต', fullLabel: 'กำลังผลิต', icon: Package },
  { id: 'shipped', shortLabel: 'จัดส่งแล้ว', fullLabel: 'จัดส่งแล้ว', icon: Truck },
  { id: 'completed', shortLabel: 'เสร็จสิ้น', fullLabel: 'เสร็จสิ้น', icon: CheckCircle2 },
  { id: 'cancelled_expired', shortLabel: 'ยกเลิก', fullLabel: 'ยกเลิก/หมดอายุ', icon: OctagonX },
];

type OrderPanelProps = {
  orderFilter: OrderFilterId;
  setOrderFilter: (id: OrderFilterId) => void;
  filteredOrders: Order[];
  orderTagCounts: ReturnType<typeof useRfqAndOrdersState>['orderTagCounts'];
  isDesktop?: boolean;
};

export function OrderPanel({
  orderFilter,
  setOrderFilter,
  filteredOrders,
  orderTagCounts,
  isDesktop,
}: OrderPanelProps) {
  const navigate = useNavigate();
  const hasPendingPayment = orderTagCounts.pendingPayment > 0;

  return (
    <div className={isDesktop ? 'px-4 pb-4 pt-2' : ''}>
      {hasPendingPayment && orderFilter !== 'pending_payment' && (
        <Button
          variant='unstyled'
          onClick={() => setOrderFilter('pending_payment')}
          className='mb-3 flex w-full items-center gap-2 rounded-xl border border-[var(--brand-orange)] bg-[var(--surface-orange-pale)] px-3 py-2.5 text-left text-[var(--brand-orange-vivid)]'
        >
          <AlertTriangle size={14} className='shrink-0 text-[var(--brand-orange)]' />
          <span className='text-xs font-semibold flex-1'>
            มี {orderTagCounts.pendingPayment} คำสั่งซื้อรอชำระมัดจำ
          </span>
          <ChevronRight size={13} />
        </Button>
      )}

      <div className='mb-3 grid w-full grid-cols-5 gap-0.5 rounded-xl border border-gray-200 bg-white px-1 py-[5px]'>
        {ORDER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = orderFilter === tab.id;
          const th = ORDER_MOBILE_TAB_THEME[tab.id];
          const count = getOrderTabCount(tab.id, orderTagCounts);
          const isPendingTab = tab.id === 'pending_payment';

          return (
            <Button
              variant='unstyled'
              key={tab.id}
              onClick={() => setOrderFilter(tab.id)}
              className='relative flex flex-col items-center gap-0.5 rounded-lg border py-0.5 transition-colors hover:bg-gray-50'
              style={{
                background: isActive ? th.activeBg : undefined,
                borderColor: isActive ? th.activeColor : 'transparent',
              }}
            >
              <Icon
                size={16}
                style={{ color: isActive ? th.activeColor : 'var(--neutral-subtle)' }}
              />
              {count > 0 && (
                <span
                  className={`absolute top-0.5 right-[10%] min-w-[14px] h-3.5 px-1 rounded-full text-white text-[8px] flex items-center justify-center font-bold ${isPendingTab && !isActive ? 'animate-pulse' : ''}`}
                  style={{
                    background: isActive
                      ? th.activeColor
                      : isPendingTab
                        ? ACCENT_ORANGE
                        : th.badgeInactive,
                  }}
                >
                  {count}
                </span>
              )}
              <span
                className='text-[9px] text-center leading-tight'
                style={{
                  color: isActive ? th.activeColor : 'var(--neutral-subtle)',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {tab.shortLabel}
              </span>
            </Button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className='flex min-h-[258px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-center'>
          <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-lg'>
            <Package size={24} className='text-gray-300' />
          </div>
          <p className='text-gray-700 font-semibold text-sm mb-1'>ยังไม่มีคำสั่งซื้อ</p>
          <p className='text-xs text-gray-400 max-w-[200px]'>
            คำสั่งซื้อจะปรากฏที่นี่หลังจากยืนยันใบเสนอราคา
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredOrders.map((order) => {
            const isPendingPayment = isPendingPaymentStatus(order.status);
            const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
            const cardCfg = isPendingPayment ? ORDER_STATUS_CONFIG.in_production : statusCfg;

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className='rounded-xl p-4 border border-gray-200 bg-white cursor-pointer transition-all active:scale-[0.98]'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                    <div
                      className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
                      style={{ background: cardCfg.bg }}
                    >
                      <Package size={18} style={{ color: cardCfg.color }} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-[10px] text-gray-400 mb-0.5'>#{order.id}</p>
                      <p className='text-sm text-gray-900 font-bold truncate leading-tight'>
                        {order.projectName}
                      </p>
                      <p className='text-[11px] text-gray-500 truncate'>{order.factoryName}</p>
                    </div>
                  </div>
                  <span
                    className='flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ml-2'
                    style={{ background: cardCfg.bg, color: cardCfg.color }}
                  >
                    <span className='w-1.5 h-1.5 rounded-full' style={{ background: cardCfg.dot }} />
                    {statusCfg.label}
                  </span>
                </div>

                <div className='mb-3 flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5'>
                  {(() => {
                    const stepInfo = getOrderProgressMeta(order);
                    const StepIcon = stepInfo.icon;
                    return (
                      <>
                        <StepIcon size={14} className='shrink-0 text-gray-500' />
                        <span className='text-[11px] font-semibold text-gray-700 flex-1'>
                          {stepInfo.label}
                        </span>
                         
                      </>
                    );
                  })()}
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3 text-xs text-gray-500'>
                    {order.estimatedDelivery && (
                      <span className='flex items-center gap-1'>
                        <Calendar size={11} className='text-gray-300' />
                        {order.estimatedDelivery}
                      </span>
                    )}
                    <span className='font-semibold text-gray-700'>
                      {formatBudget(order.totalAmount)}
                    </span>
                  </div>
                  <span
                    className='flex items-center gap-0.5 text-xs font-semibold'
                    style={{ color: cardCfg.color }}
                  >
                    ดูรายละเอียด
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
