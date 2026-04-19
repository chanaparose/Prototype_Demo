import React from 'react';
import { useNavigate } from 'react-router';
import { Package, ChevronRight, Calendar, CheckCircle2, Truck, Banknote } from 'lucide-react';
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
};

type OrderTagCounts = {
  pendingPayment: number;
  inProduction: number;
  shipped: number;
  completed: number;
};

type OrderSectionProps = {
  orderFilter: OrderFilterId;
  setOrderFilter: (id: OrderFilterId) => void;
  filteredOrders: OrderItem[];
  orderTagCounts: OrderTagCounts;
};

const ORDER_TABS: { id: OrderFilterId; label: string; icon: typeof Package }[] = [
  { id: 'pending_payment', label: 'รอชำระ', icon: Banknote },
  { id: 'in_production', label: 'กำลังผลิต', icon: Package },
  { id: 'shipped', label: 'จัดส่งแล้ว', icon: Truck },
  { id: 'completed', label: 'เสร็จสิ้น', icon: CheckCircle2 },
];

const ORDER_TAB_ICONS: Record<
  OrderFilterId,
  typeof Package | typeof Truck | typeof CheckCircle2 | typeof Banknote
> = {
  pending_payment: Banknote,
  in_production: Package,
  shipped: Truck,
  completed: CheckCircle2,
};

export function OrderSection({
  orderFilter,
  setOrderFilter,
  filteredOrders,
  orderTagCounts,
}: OrderSectionProps) {
  const navigate = useNavigate();

  return (
    <>
      <div
        className="grid grid-cols-2 min-[380px]:grid-cols-4 mb-3 rounded-xl px-1.5 py-2 border gap-1"
        style={{ background: MOBILE_PRIMARY_TAB_BAR, borderColor: BORDER_WARM }}
      >
        {ORDER_TABS.map((tab) => {
          const Icon = ORDER_TAB_ICONS[tab.id];
          const isActive = orderFilter === tab.id;
          const th = ORDER_MOBILE_TAB_THEME[tab.id];
          const count =
            tab.id === 'pending_payment'
              ? orderTagCounts.pendingPayment
              : tab.id === 'in_production'
                ? orderTagCounts.inProduction
                : tab.id === 'shipped'
                  ? orderTagCounts.shipped
                  : orderTagCounts.completed;
          return (
            <button
              key={tab.id}
              onClick={() => setOrderFilter(tab.id)}
              className="relative flex flex-col items-center gap-1 py-1"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: isActive ? th.activeBg : 'rgba(255,255,255,0.85)',
                  boxShadow: isActive ? `0 0 0 1px ${BORDER_WARM}` : 'none',
                }}
              >
                <Icon size={16} style={{ color: isActive ? th.activeColor : '#4B5563' }} />
              </div>
              {count > 0 && (
                <span
                  className="absolute top-0 right-[15%] min-w-4 h-4 px-1 rounded-full text-white text-[9px] flex items-center justify-center"
                  style={{
                    background: isActive ? th.activeColor : th.badgeInactive,
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
              <span
                className="text-[11px] text-center leading-tight px-1"
                style={{
                  color: isActive ? th.activeColor : '#374151',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 border"
            style={{ background: ACCENT_ORANGE_BG, borderColor: BORDER_WARM }}
          >
            <Package size={36} style={{ color: ACCENT_ORANGE_DEEP }} />
          </div>
          <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
            ยังไม่มีคำสั่งซื้อ
          </p>
          <p className="text-sm text-gray-500 max-w-[200px]">
            คำสั่งซื้อจะปรากฏที่นี่หลังจากที่คุณยืนยันใบเสนอราคา
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const cfg =
              ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="rounded-2xl p-4 shadow-sm cursor-pointer transition-all active:scale-[0.98] border bg-white/90 backdrop-blur-sm"
                style={{ borderColor: BORDER_WARM }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: cfg.bg }}
                    >
                      <Package size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 mb-0.5">#{order.id}</p>
                      <p
                        className="text-sm text-gray-900 truncate"
                        style={{ fontWeight: 600 }}
                      >
                        {order.projectName}
                      </p>
                      <p className="text-xs text-gray-500">{order.factoryName}</p>
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] shrink-0 ml-2"
                    style={{
                      background: cfg.bg,
                      color: cfg.color,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: cfg.dot }}
                    />
                    {cfg.label}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>ความคืบหน้า</span>
                    <span style={{ fontWeight: 700, color: cfg.color }}>
                      {order.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${order.progress}%`,
                        background:
                          order.status === 'completed'
                            ? PROGRESS_COMPLETED
                            : order.status === 'shipped'
                              ? ACCENT_ORANGE
                              : order.status === 'pending_payment'
                                ? ACCENT_ORANGE_DEEP
                                : PROGRESS_GRADIENT_ACTIVE,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} className="text-gray-400" />
                      <span>{order.estimatedDelivery}</span>
                    </div>
                    <span>฿{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: cfg.color, fontWeight: 600 }}
                  >
                    ดูรายละเอียด <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
