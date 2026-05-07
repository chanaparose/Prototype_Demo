import React from 'react';
import { useNavigate } from 'react-router';
import {
  Package,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Truck,
  Banknote,
  OctagonX,
  AlertTriangle,
  Factory,
} from 'lucide-react';
import {
  ACCENT_ORANGE,
  ACCENT_ORANGE_BG,
  ACCENT_ORANGE_DEEP,
  BORDER_WARM,
  MOBILE_PRIMARY_TAB_BAR,
  ORDER_MOBILE_TAB_THEME,
  PROGRESS_GRADIENT_ACTIVE,
  PROGRESS_COMPLETED,
  ORDER_STATUS_CONFIG,
  PLUM,
  PLUM_SOFT_BG,
  DEEP_PURPLE,
} from './constants';
import type { OrderFilterId } from './constants';

export type OrderItem = {
  id: string;
  projectName: string;
  factoryName: string;
  status: string;
  progress: number;
  totalAmount: number;
  estimatedDelivery: string;
  depositPaid?: number;
};

type OrderTagCounts = {
  pendingPayment: number;
  inProduction: number;
  shipped: number;
  completed: number;
  cancelledExpired: number;
};

type OrderSectionProps = {
  orderFilter: OrderFilterId;
  setOrderFilter: (id: OrderFilterId) => void;
  filteredOrders: OrderItem[];
  orderTagCounts: OrderTagCounts;
};

const ORDER_TABS: { id: OrderFilterId; label: string; shortLabel: string; icon: typeof Package }[] = [
  { id: 'pending_payment', label: 'รอชำระมัดจำ', shortLabel: 'รอชำระ', icon: Banknote },
  { id: 'in_production', label: 'กำลังผลิต', shortLabel: 'กำลังผลิต', icon: Package },
  { id: 'shipped', label: 'จัดส่งแล้ว', shortLabel: 'จัดส่ง', icon: Truck },
  { id: 'completed', label: 'เสร็จสิ้น', shortLabel: 'เสร็จ', icon: CheckCircle2 },
  { id: 'cancelled_expired', label: 'ยกเลิก/หมดอายุ', shortLabel: 'ยกเลิก', icon: OctagonX },
];

function getTabCount(id: OrderFilterId, counts: OrderTagCounts): number {
  switch (id) {
    case 'pending_payment': return counts.pendingPayment;
    case 'in_production': return counts.inProduction;
    case 'shipped': return counts.shipped;
    case 'completed': return counts.completed;
    case 'cancelled_expired': return counts.cancelledExpired;
    default: return 0;
  }
}

function getProgressBg(status: string): string {
  if (status === 'completed') return PROGRESS_COMPLETED;
  if (status === 'shipped') return ACCENT_ORANGE;
  if (status === 'pending_payment') return ACCENT_ORANGE_DEEP;
  return PROGRESS_GRADIENT_ACTIVE;
}

export function OrderSection({
  orderFilter,
  setOrderFilter,
  filteredOrders,
  orderTagCounts,
}: OrderSectionProps) {
  const navigate = useNavigate();
  const hasPendingPayment = orderTagCounts.pendingPayment > 0;

  return (
    <>
      {/* Urgency banner — only shows when there are pending payments */}
      {hasPendingPayment && orderFilter !== 'pending_payment' && (
        <button
          onClick={() => setOrderFilter('pending_payment')}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 text-left border"
          style={{
            background: '#FFF7ED',
            borderColor: ACCENT_ORANGE,
            color: ACCENT_ORANGE_DEEP,
          }}
        >
          <AlertTriangle size={14} style={{ color: ACCENT_ORANGE, flexShrink: 0 }} />
          <span className="text-xs font-semibold flex-1">
            มี {orderTagCounts.pendingPayment} คำสั่งซื้อรอชำระมัดจำ
          </span>
          <ChevronRight size={13} />
        </button>
      )}

      {/* Tab bar */}
      <div
        className="grid grid-cols-5 rounded-xl px-1 py-[8px] border gap-0.5 w-full mb-3"
        style={{ background: MOBILE_PRIMARY_TAB_BAR, borderColor: BORDER_WARM }}
      >
          {ORDER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = orderFilter === tab.id;
          const th = ORDER_MOBILE_TAB_THEME[tab.id];
          const count = getTabCount(tab.id, orderTagCounts);
          const isPendingPaymentTab = tab.id === 'pending_payment';

          return (
            <button
              key={tab.id}
              onClick={() => setOrderFilter(tab.id)}
              className="relative flex flex-col items-center gap-0.5 py-0.5 rounded-lg transition-all"
              style={{
                background: isActive ? 'rgba(255,255,255,0.9)' : 'transparent',
                boxShadow: isActive ? `0 1px 6px rgba(0,0,0,0.08)` : 'none',
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: isActive ? th.activeBg : 'transparent',
                }}
              >
                <Icon
                  size={14}
                  style={{ color: isActive ? th.activeColor : '#6B7280' }}
                />
              </div>
              {/* Badge — bold/pulsing for pending_payment */}
              {count > 0 && (
                <span
                  className={`absolute top-0.5 right-[10%] min-w-[14px] h-3.5 px-1 rounded-full text-white text-[8px] flex items-center justify-center font-bold ${isPendingPaymentTab && !isActive ? 'animate-pulse' : ''}`}
                  style={{
                    background: isActive
                      ? th.activeColor
                      : isPendingPaymentTab
                        ? ACCENT_ORANGE
                        : th.badgeInactive,
                  }}
                >
                  {count}
                </span>
              )}
              <span
                className="text-[9px] text-center leading-tight"
                style={{
                  color: isActive ? th.activeColor : '#6B7280',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center rounded-2xl border" style={{ borderColor: BORDER_WARM, background: '#FFFAF5' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: ACCENT_ORANGE_BG }}
          >
            <Package size={28} style={{ color: ACCENT_ORANGE_DEEP }} />
          </div>
          <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มีคำสั่งซื้อ</p>
          <p className="text-xs text-gray-400 max-w-[200px]">
            คำสั่งซื้อจะปรากฏที่นี่หลังจากที่คุณยืนยันใบเสนอราคา
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
            const isPendingPayment = order.status === 'pending_payment';

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="rounded-2xl p-4 border bg-white cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  borderColor: isPendingPayment ? ACCENT_ORANGE : BORDER_WARM,
                  borderLeftWidth: isPendingPayment ? '3px' : '1px',
                  borderLeftColor: isPendingPayment ? ACCENT_ORANGE : BORDER_WARM,
                }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <Package size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-400 mb-0.5">#{order.id}</p>
                      <p className="text-sm text-gray-900 font-bold truncate leading-tight">
                        {order.projectName}
                      </p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                        <Factory size={10} />
                        {order.factoryName}
                      </p>
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ml-2"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>ความคืบหน้า</span>
                    <span className="font-bold" style={{ color: cfg.color }}>
                      {order.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${order.progress}%`,
                        background: getProgressBg(order.status),
                      }}
                    />
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {order.estimatedDelivery && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-gray-300" />
                        {order.estimatedDelivery}
                      </span>
                    )}
                    <span className="font-semibold text-gray-700">
                      ฿{order.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* CTA: payment or details */}
                  {isPendingPayment ? (
                    <span
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold text-white"
                      style={{ background: ACCENT_ORANGE_DEEP }}
                    >
                      <Banknote size={12} />
                      ชำระเงิน
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-0.5 text-xs font-semibold"
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
    </>
  );
}
