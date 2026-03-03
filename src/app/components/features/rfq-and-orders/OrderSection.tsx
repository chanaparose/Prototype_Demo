import React from 'react';
import { useNavigate } from 'react-router';
import { Package, ChevronRight, Calendar, CheckCircle2, Truck } from 'lucide-react';
import { PRIMARY_COLOR, PRIMARY_BG, ORDER_STATUS_CONFIG } from './constants';
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
  { id: 'in_production', label: 'กำลังผลิต', icon: Package },
  { id: 'shipped', label: 'จัดส่งแล้ว', icon: Truck },
  { id: 'completed', label: 'เสร็จสิ้น', icon: CheckCircle2 },
];

const ORDER_TAB_ICONS: Record<OrderFilterId, typeof Package | typeof Truck | typeof CheckCircle2> = {
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
      <div className="grid grid-cols-3 mb-3 bg-white rounded-xl px-1.5 py-2">
        {ORDER_TABS.map((tab) => {
          const Icon = ORDER_TAB_ICONS[tab.id];
          const isActive = orderFilter === tab.id;
          const count =
            tab.id === 'in_production'
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
                style={{ background: isActive ? PRIMARY_BG : '#F8FAFC' }}
              >
                <Icon size={16} style={{ color: isActive ? PRIMARY_COLOR : '#1F2937' }} />
              </div>
              {count > 0 && (
                <span
                  className="absolute top-0 right-[15%] min-w-4 h-4 px-1 rounded-full text-white text-[9px] flex items-center justify-center"
                  style={{ background: '#F04F2E', fontWeight: 700 }}
                >
                  {count}
                </span>
              )}
              <span
                className="text-[11px] text-center leading-tight px-1"
                style={{
                  color: isActive ? PRIMARY_COLOR : '#374151',
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
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: PRIMARY_BG }}
          >
            <Package size={36} style={{ color: PRIMARY_COLOR }} />
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
            const cfg = ORDER_STATUS_CONFIG[order.status];
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: PRIMARY_BG }}
                    >
                      <Package size={18} style={{ color: PRIMARY_COLOR }} />
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
                    <span style={{ fontWeight: 700, color: PRIMARY_COLOR }}>
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
                            ? '#22C55E'
                            : order.status === 'shipped'
                              ? '#F59E0B'
                              : 'linear-gradient(90deg, #6C47FF, #A78BFA)',
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
                    style={{ color: PRIMARY_COLOR, fontWeight: 600 }}
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
