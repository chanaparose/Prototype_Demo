import React from 'react';
import { Link, useNavigate } from 'react-router';
import { RfqSection, OrderSection } from '../../components/features/rfq-and-orders';
import {
  PRIMARY_BG,
  PRIMARY_BG_LIGHT,
  PRIMARY_COLOR,
  PLUM,
  PLUM_SOFT_BG,
  DEEP_PURPLE,
  ACCENT_ORANGE_BG,
  ACCENT_ORANGE_DEEP,
  ACCENT_ORANGE,
  PEACH_MIST,
  ORCHID,
  TAN_MUTED,
  BORDER_WARM,
  MOBILE_PRIMARY_TAB_BAR,
  BADGE_ALERT_BG,
  CTA_GRADIENT,
  PROGRESS_GRADIENT_ACTIVE,
  PROGRESS_COMPLETED,
  RFQ_FILTER_THEME,
  RFQ_STATUS_DISPLAY,
  ORDER_STATUS_CONFIG,
  type RfqFilterId,
  type OrderFilterId,
} from '../../components/features/rfq-and-orders/constants';
import { formatBudget, formatDate } from '../../components/features/rfq-and-orders/utils';
import { useRfqAndOrdersState } from '../../hooks/useRfqAndOrdersState';
import {
  Plus,
  FileText,
  Package,
  Calendar,
  ChevronRight,
  Clock3,
  FileCheck2,
  OctagonX,
  Truck,
  CheckCircle2,
  Layers,
  Banknote,
} from 'lucide-react';

export function RfqAndOrders() {
  const {
    primaryTab,
    setPrimaryTab,
    rfqFilter,
    setRfqFilter,
    orderFilter,
    setOrderFilter,
    filteredRfqs,
    filteredOrders,
    rfqTagCounts,
    orderTagCounts,
    rfqs,
    orders,
    loading,
    error,
    refetch,
  } = useRfqAndOrdersState({
    primaryTab: 'orders',
  });

  // For now, desktop panels share the same filters as mobile
  const desktopRfqFilter: RfqFilterId = rfqFilter;
  const desktopOrderFilter: OrderFilterId = orderFilter;
  const desktopFilteredRfqs = filteredRfqs;
  const desktopFilteredOrders = filteredOrders;

  const navigate = useNavigate();

  // Loading state — show spinner while CRUD endpoints respond
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: PRIMARY_COLOR, borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <p className="text-sm text-red-600 font-semibold mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-xs text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: PRIMARY_COLOR }}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Mobile Layout ─── */}
      <div className="lg:hidden pb-4 flex flex-col min-h-full pb-20">
        <div className="px-4 pt-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: TAN_MUTED }}
              >
                คำขอ
              </p>
              <h1 className="text-[#2D1B4E]" style={{ fontWeight: 700 }}>
                RFQ & คำสั่งซื้อ
              </h1>
            </div>
          </div>
        </div>

        <div className="px-4 flex-1 flex flex-col">
          {/* Primary Tabs */}
          <div
            className="flex p-1 rounded-2xl mb-4 border"
            style={{
              background: MOBILE_PRIMARY_TAB_BAR,
              borderColor: BORDER_WARM,
            }}
          >
            <button
              onClick={() => setPrimaryTab('rfq')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: primaryTab === 'rfq' ? 'rgba(255,255,255,0.95)' : 'transparent',
                color: primaryTab === 'rfq' ? PLUM : '#6B7280',
                boxShadow:
                  primaryTab === 'rfq'
                    ? '0 2px 14px rgba(109, 40, 217, 0.18)'
                    : 'none',
              }}
            >
              คำขอราคา
            </button>
            <button
              onClick={() => setPrimaryTab('orders')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: primaryTab === 'orders' ? 'rgba(255,255,255,0.95)' : 'transparent',
                color: primaryTab === 'orders' ? ACCENT_ORANGE_DEEP : '#6B7280',
                boxShadow:
                  primaryTab === 'orders'
                    ? '0 2px 14px rgba(242, 120, 48, 0.22)'
                    : 'none',
              }}
            >
              คำสั่งซื้อ
            </button>
          </div>

          {primaryTab === 'rfq' ? (
            <RfqSection
              rfqFilter={rfqFilter}
              setRfqFilter={setRfqFilter}
              filteredRfqs={filteredRfqs}
              rfqTagCounts={rfqTagCounts}
            />
          ) : (
            <OrderSection
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              filteredOrders={filteredOrders}
              orderTagCounts={orderTagCounts}
            />
          )}
        </div>
      </div>

      {/* ─── Desktop Layout (lg+) ─── */}
      <div className="hidden lg:block px-8 py-7">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p
              className="text-xs uppercase tracking-wider font-semibold mb-0.5"
              style={{ color: TAN_MUTED }}
            >
              คำขอและคำสั่งซื้อ
            </p>
            <h1 className="text-2xl font-bold text-[#2D1B4E]">
              RFQ & คำสั่งซื้อ
            </h1>
          </div>
          <div className="flex items-center gap-2">
            
            <Link
              to="/create-rfq"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white font-semibold transition-all hover:opacity-90 shadow-md"
              style={{ background: CTA_GRADIENT, boxShadow: '0 6px 20px rgba(162,56,255,0.35)' }}
            >
              <Plus size={16} />
              สร้างคำขอราคา
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
            {/* Left: RFQ Panel */}
            <div
              className="bg-white rounded-2xl shadow-sm overflow-hidden border"
              style={{ borderColor: BORDER_WARM, borderTop: `3px solid ${PRIMARY_COLOR}` }}
            >
              <div
                className="flex items-center px-5 py-4 border-b"
                style={{ borderColor: BORDER_WARM, background: PRIMARY_BG_LIGHT }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: PRIMARY_BG }}
                  >
                    <FileText size={15} style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <h2 className="font-bold" style={{ color: DEEP_PURPLE }}>
                    คำขอราคา
                  </h2>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: PRIMARY_BG, color: PRIMARY_COLOR }}
                  >
                    {rfqs.filter((r) => r.status !== 'completed').length}
                  </span>
                </div>
              </div>

              <div className="flex gap-1 px-4 pt-3 pb-2">
                {[
                  {
                    id: 'pending' as RfqFilterId,
                    label: 'รอดำเนินการ',
                    icon: Clock3,
                    count: rfqTagCounts.pending,
                  },
                  {
                    id: 'has_quote' as RfqFilterId,
                    label: 'มีใบเสนอราคา',
                    icon: FileCheck2,
                    count: rfqTagCounts.has_quote,
                  },
                  {
                    id: 'cancelled_expired' as RfqFilterId,
                    label: 'ยกเลิก/หมดอายุ',
                    icon: OctagonX,
                    count: rfqTagCounts.cancelled_expired,
                  },
                ].map((tab) => {
                  const th = RFQ_FILTER_THEME[tab.id];
                  const active = desktopRfqFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRfqFilter(tab.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                      style={{
                        background: active ? th.activeBg : '#F9FAFB',
                        color: active ? th.activeColor : '#6B7280',
                        fontWeight: active ? 700 : 500,
                        border: active ? `1px solid ${BORDER_WARM}` : '1px solid transparent',
                      }}
                    >
                      <tab.icon size={12} />
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                          style={{
                            background: active ? th.activeColor : th.badgeInactive,
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="overflow-y-auto px-4 pb-4 space-y-3" style={{ maxHeight: '520px' }}>
                {desktopFilteredRfqs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: PRIMARY_BG }}
                    >
                      <FileText size={28} style={{ color: PRIMARY_COLOR }} />
                    </div>
                    <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มีคำขอราคา</p>
                    <p className="text-xs text-gray-400 mb-4">สร้างคำขอราคาเพื่อรับใบเสนอราคา</p>
                    <Link
                      to="/create-rfq"
                      className="py-2 px-5 rounded-xl text-white font-semibold text-sm"
                      style={{ background: PRIMARY_COLOR }}
                    >
                      สร้างคำขอราคา
                    </Link>
                  </div>
                ) : (
                  desktopFilteredRfqs.map((rfq, idx) => {
                    const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
                      label: rfq.status,
                      color: '#6B7280',
                      bg: '#F3F4F6',
                    };
                    const iconBgs = [PRIMARY_BG, PEACH_MIST, PLUM_SOFT_BG] as const;
                    const iconColors = [PRIMARY_COLOR, ACCENT_ORANGE_DEEP, PLUM] as const;
                    const ib = iconBgs[idx % 3];
                    const ic = iconColors[idx % 3];
                    const catColor = idx % 2 === 0 ? PLUM : PRIMARY_COLOR;
                    return (
                      <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block group">
                        <div
                          className="p-4 rounded-xl border transition-all cursor-pointer bg-white/90 backdrop-blur-sm hover:shadow-sm hover:bg-white/95 group-hover:border-[rgba(162,56,255,0.35)]"
                          style={{ borderColor: BORDER_WARM }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex gap-2.5 min-w-0 flex-1">
                              <div
                                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-base"
                                style={{ background: ib }}
                              >
                                {rfq.categoryIcon ?? (
                                  <Layers size={18} style={{ color: ic }} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] mb-0.5 font-semibold" style={{ color: catColor }}>
                                  {rfq.category}
                                </p>
                                <h3 className="text-gray-900 font-bold text-sm leading-tight truncate">
                                  {rfq.projectName}
                                </h3>
                              </div>
                            </div>
                            <span
                              className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: statusCfg.bg, color: statusCfg.color }}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400 pl-12">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <FileText size={11} className="text-gray-300" />
                                {formatBudget(rfq.budget)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-gray-300" />
                                {formatDate(rfq.createdAt)}
                              </span>
                            </div>
                            <span className="font-semibold" style={{ color: ic }}>
                              {rfq.offerCount} โรงงานตอบ →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Orders Panel */}
            <div
              className="bg-white rounded-2xl shadow-sm overflow-hidden border"
              style={{ borderColor: BORDER_WARM, borderTop: `3px solid ${ACCENT_ORANGE}` }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: BORDER_WARM, background: ACCENT_ORANGE_BG }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: ACCENT_ORANGE_BG }}
                  >
                    <Package size={15} style={{ color: ACCENT_ORANGE_DEEP }} />
                  </div>
                  <h2 className="font-bold" style={{ color: DEEP_PURPLE }}>
                    คำสั่งซื้อ
                  </h2>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: ACCENT_ORANGE_BG, color: ACCENT_ORANGE_DEEP }}
                  >
                    {orders.filter((o) => o.status !== 'completed').length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <CheckCircle2 size={12} style={{ color: ORCHID }} />
                  {orderTagCounts.completed} เสร็จสิ้น
                </div>
              </div>

              <div className="flex flex-wrap gap-1 px-4 pt-3 pb-2">
                {[
                  {
                    id: 'pending_payment' as OrderFilterId,
                    label: 'รอชำระ',
                    icon: Banknote,
                    count: orderTagCounts.pendingPayment,
                    color: ORDER_STATUS_CONFIG.pending_payment.color,
                    bg: ORDER_STATUS_CONFIG.pending_payment.bg,
                  },
                  {
                    id: 'in_production' as OrderFilterId,
                    label: 'กำลังผลิต',
                    icon: Package,
                    count: orderTagCounts.inProduction,
                    color: ORDER_STATUS_CONFIG.in_production.color,
                    bg: ORDER_STATUS_CONFIG.in_production.bg,
                  },
                  {
                    id: 'shipped' as OrderFilterId,
                    label: 'จัดส่งแล้ว',
                    icon: Truck,
                    count: orderTagCounts.shipped,
                    color: ORDER_STATUS_CONFIG.shipped.color,
                    bg: ORDER_STATUS_CONFIG.shipped.bg,
                  },
                  {
                    id: 'completed' as OrderFilterId,
                    label: 'เสร็จสิ้น',
                    icon: CheckCircle2,
                    count: orderTagCounts.completed,
                    color: ORDER_STATUS_CONFIG.completed.color,
                    bg: ORDER_STATUS_CONFIG.completed.bg,
                  },
                  {
                    id: 'cancelled_expired' as OrderFilterId,
                    label: 'ยกเลิก/หมดอายุ',
                    icon: OctagonX,
                    count: orderTagCounts.cancelledExpired,
                    color: ORDER_STATUS_CONFIG.cancelled_expired.color,
                    bg: ORDER_STATUS_CONFIG.cancelled_expired.bg,
                  },
                ].map((tab) => {
                  const isActive = desktopOrderFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setOrderFilter(tab.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                      style={{
                        background: isActive ? tab.bg : '#F9FAFB',
                        color: isActive ? tab.color : '#6B7280',
                        fontWeight: isActive ? 700 : 500,
                        border: isActive ? `1px solid ${BORDER_WARM}` : '1px solid transparent',
                      }}
                    >
                      <tab.icon size={12} />
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                          style={{ background: isActive ? tab.color : '#9CA3AF' }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="overflow-y-auto px-4 pb-4 space-y-3" style={{ maxHeight: '520px' }}>
                {desktopFilteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: ACCENT_ORANGE_BG }}
                    >
                      <Package size={28} style={{ color: ACCENT_ORANGE_DEEP }} />
                    </div>
                    <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มีคำสั่งซื้อ</p>
                    <p className="text-xs text-gray-400">
                      คำสั่งซื้อจะปรากฏหลังจากยืนยันใบเสนอราคา
                    </p>
                  </div>
                ) : (
                  desktopFilteredOrders.map((order) => {
                    const cfg =
                      ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
                    return (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm hover:border-[rgba(242,138,46,0.45)] bg-white/90 backdrop-blur-sm hover:bg-white/95"
                        style={{ borderColor: BORDER_WARM }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: cfg.bg }}
                            >
                              <Package size={16} style={{ color: cfg.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-400 mb-0.5">#{order.id}</p>
                              <p className="text-sm text-gray-900 font-bold truncate">
                                {order.projectName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{order.factoryName}</p>
                            </div>
                          </div>
                          <span
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-2"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="mb-2.5">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>ความคืบหน้า</span>
                            <span className="font-bold" style={{ color: cfg.color }}>
                              {order.progress}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-gray-300" />
                              {order.estimatedDelivery}
                            </span>
                            <span className="font-semibold text-gray-600">
                              ฿{order.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <span className="flex items-center gap-0.5 font-semibold" style={{ color: cfg.color }}>
                            รายละเอียด <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
