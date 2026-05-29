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
import {
  formatBudget,
  getOrderProgressBg,
  getOrderTabCount,
} from '@/components/features/rfq-and-orders/utils';

const STEP_LABELS: Record<number, { emoji: string; label: string }> = {
  0: { emoji: '🤝', label: 'รอยืนยันรับงาน' },
  1: { emoji: '🧱', label: 'จัดเตรียมวัตถุดิบ' },
  2: { emoji: '🏭', label: 'กำลังผลิต' },
  3: { emoji: '🔍', label: 'ตรวจสอบคุณภาพ' },
  4: { emoji: '🚚', label: 'จัดส่งแล้ว' },
  5: { emoji: '📬', label: 'รอยืนยันรับสินค้า' },
};

function getCurrentStepLabel(order: { currentStepId?: number; status: string; progress: number }) {
  if (order.status === 'completed') return { emoji: '✅', label: 'เสร็จสิ้น' };
  if (order.status === 'cancelled' || order.status === 'expired') return { emoji: '❌', label: 'ยกเลิก' };
  if (order.status === 'pending_payment') return { emoji: '💳', label: 'รอชำระมัดจำ' };
  const step = STEP_LABELS[order.currentStepId ?? -1];
  if (step) return step;
  if (order.progress >= 100) return { emoji: '✅', label: 'เสร็จสิ้น' };
  return { emoji: '📋', label: 'รอดำเนินการ' };
}
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

      <div className='mb-3 grid w-full grid-cols-5 gap-0.5 rounded-xl border border-[rgba(196,164,132,0.4)] bg-[linear-gradient(135deg,var(--brand-lavender)_0%,var(--surface-cream-warm)_48%,var(--surface-cream-orange)_100%)] px-1 py-[5px]'>
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
              className={`relative flex flex-col items-center gap-0.5 rounded-lg py-0.5 transition-all ${
                isActive ? 'bg-white/90 shadow-[0_1px_6px_rgba(0,0,0,0.08)]' : ''
              }`}
            >
              <div
                className='w-7 h-7 rounded-full flex items-center justify-center'
                style={{ background: isActive ? th.activeBg : 'transparent' }}
              >
                <Icon
                  size={14}
                  style={{ color: isActive ? th.activeColor : 'var(--neutral-subtle)' }}
                />
              </div>
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
        <div className='flex min-h-[258px] flex-col items-center justify-center rounded-2xl border border-[rgba(196,164,132,0.4)] bg-[var(--surface-orange-wash)] py-12 text-center'>
          <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-peach)]'>
            <Package size={24} className='text-[var(--brand-orange-vivid)]' />
          </div>
          <p className='text-gray-700 font-semibold text-sm mb-1'>ยังไม่มีคำสั่งซื้อ</p>
          <p className='text-xs text-gray-400 max-w-[200px]'>
            คำสั่งซื้อจะปรากฏที่นี่หลังจากยืนยันใบเสนอราคา
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredOrders.map((order) => {
            const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
            const isPendingPayment = order.status === 'pending_payment';

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className='rounded-2xl p-4 border bg-white cursor-pointer transition-all active:scale-[0.98] hover:shadow-sm'
                style={{
                  borderColor: isPendingPayment ? ACCENT_ORANGE : BORDER_WARM,
                  borderLeftWidth: isPendingPayment ? '3px' : '1px',
                  borderLeftColor: isPendingPayment ? ACCENT_ORANGE : BORDER_WARM,
                }}
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                    <div
                      className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
                      style={{ background: cfg.bg }}
                    >
                      <Package size={18} style={{ color: cfg.color }} />
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
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <span className='w-1.5 h-1.5 rounded-full' style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>

                <div className='mb-3 flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5'>
                  {(() => {
                    const stepInfo = getCurrentStepLabel(order);
                    return (
                      <>
                        <span className='text-sm leading-none'>{stepInfo.emoji}</span>
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
                  {isPendingPayment ? (
                    <span className='flex items-center gap-1 rounded-lg bg-[var(--brand-orange-vivid)] px-3 py-1 text-[11px] font-bold text-white'>
                      <Banknote size={12} />
                      ชำระเงิน
                    </span>
                  ) : (
                    <span
                      className='flex items-center gap-0.5 text-xs font-semibold'
                      style={{ color: cfg.color }}
                    >
                      ดูรายละเอียด
                      <ChevronRight size={13} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
