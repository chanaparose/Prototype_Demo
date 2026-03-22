import React from 'react';
import { Link, useNavigate } from 'react-router';
import { RfqSection, OrderSection } from '../../components/features/rfq-and-orders';
import {
  PRIMARY_BG,
  PRIMARY_COLOR,
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
  } = useRfqAndOrdersState({
    primaryTab: 'orders',
  });

  // For now, desktop panels share the same filters as mobile
  const desktopRfqFilter: RfqFilterId = rfqFilter;
  const desktopOrderFilter: OrderFilterId = orderFilter;
  const desktopFilteredRfqs = filteredRfqs;
  const desktopFilteredOrders = filteredOrders;

  const navigate = useNavigate();

  return (
    <>
      {/* ─── Mobile Layout (unchanged) ─── */}
      <div className="lg:hidden pb-4 flex flex-col min-h-full pb-20">
        <div className="px-4 pt-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                คำขอ
              </p>
              <h1 className="text-gray-900" style={{ fontWeight: 700 }}>
                RFQ & คำสั่งซื้อ
              </h1>
            </div>
          </div>
        </div>

        <div className="px-4 flex-1 flex flex-col">
          {/* Primary Tabs */}
          <div
            className="flex p-1 rounded-2xl mb-4"
            style={{ background: PRIMARY_BG }}
          >
            <button
              onClick={() => setPrimaryTab('rfq')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: primaryTab === 'rfq' ? '#fff' : 'transparent',
                color: primaryTab === 'rfq' ? '#6C47FF' : '#6B7280',
                boxShadow:
                  primaryTab === 'rfq' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              RFQ ของฉัน
            </button>
            <button
              onClick={() => setPrimaryTab('orders')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: primaryTab === 'orders' ? '#fff' : 'transparent',
                color: primaryTab === 'orders' ? '#6C47FF' : '#6B7280',
                boxShadow:
                  primaryTab === 'orders'
                    ? '0 2px 8px rgba(0,0,0,0.06)'
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
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
              คำขอและคำสั่งซื้อ
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              RFQ & คำสั่งซื้อ
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/rfqs"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50"
            >
              ไปหน้า RFQ
            </Link>
            <Link
              to="/create-rfq"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white font-semibold transition-all hover:opacity-90 shadow-md"
              style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
            >
              <Plus size={16} />
              สร้าง RFQ ใหม่
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
            {/* Left: RFQ Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: PRIMARY_BG }}
                  >
                    <FileText size={15} style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <h2 className="font-bold text-gray-900">RFQ ของฉัน</h2>
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
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRfqFilter(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                    style={{
                      background: desktopRfqFilter === tab.id ? PRIMARY_BG : '#F9FAFB',
                      color: desktopRfqFilter === tab.id ? PRIMARY_COLOR : '#6B7280',
                      fontWeight: desktopRfqFilter === tab.id ? 700 : 500,
                    }}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                        style={{
                          background: desktopRfqFilter === tab.id ? PRIMARY_COLOR : '#F04F2E',
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
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
                    <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มี RFQ</p>
                    <p className="text-xs text-gray-400 mb-4">สร้าง RFQ ใหม่เพื่อรับใบเสนอราคา</p>
                    <Link
                      to="/create-rfq"
                      className="py-2 px-5 rounded-xl text-white font-semibold text-sm"
                      style={{ background: PRIMARY_COLOR }}
                    >
                      สร้าง RFQ ใหม่
                    </Link>
                  </div>
                ) : (
                  desktopFilteredRfqs.map((rfq) => {
                    const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
                      label: rfq.status,
                      color: '#6B7280',
                      bg: '#F3F4F6',
                    };
                    return (
                      <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block">
                        <div className="p-4 rounded-xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50/30 transition-all cursor-pointer">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex gap-2.5 min-w-0 flex-1">
                              <div
                                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-base"
                                style={{ background: PRIMARY_BG }}
                              >
                                {rfq.categoryIcon ?? (
                                  <Layers size={18} style={{ color: PRIMARY_COLOR }} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] mb-0.5" style={{ color: PRIMARY_COLOR }}>
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
                            <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: '#DBEAFE' }}
                  >
                    <Package size={15} style={{ color: '#3B82F6' }} />
                  </div>
                  <h2 className="font-bold text-gray-900">คำสั่งซื้อ</h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600">
                    {orders.filter((o) => o.status !== 'completed').length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <CheckCircle2 size={12} className="text-green-500" />
                  {orderTagCounts.completed} เสร็จสิ้น
                </div>
              </div>

              <div className="flex gap-1 px-4 pt-3 pb-2">
                {[
                  {
                    id: 'in_production' as OrderFilterId,
                    label: 'กำลังผลิต',
                    icon: Package,
                    count: orderTagCounts.inProduction,
                    color: '#3B82F6',
                    bg: '#DBEAFE',
                  },
                  {
                    id: 'shipped' as OrderFilterId,
                    label: 'จัดส่งแล้ว',
                    icon: Truck,
                    count: orderTagCounts.shipped,
                    color: '#F59E0B',
                    bg: '#FEF3C7',
                  },
                  {
                    id: 'completed' as OrderFilterId,
                    label: 'เสร็จสิ้น',
                    icon: CheckCircle2,
                    count: orderTagCounts.completed,
                    color: '#22C55E',
                    bg: '#DCFCE7',
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
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 bg-blue-50">
                      <Package size={28} className="text-blue-500" />
                    </div>
                    <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มีคำสั่งซื้อ</p>
                    <p className="text-xs text-gray-400">
                      คำสั่งซื้อจะปรากฏหลังจากยืนยันใบเสนอราคา
                    </p>
                  </div>
                ) : (
                  desktopFilteredOrders.map((order) => {
                    const cfg = ORDER_STATUS_CONFIG[order.status];
                    return (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                              <Package size={16} className="text-blue-500" />
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
                                    ? '#22C55E'
                                    : order.status === 'shipped'
                                      ? '#F59E0B'
                                      : 'linear-gradient(90deg, #6C47FF, #A78BFA)',
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
                          <span className="flex items-center gap-0.5 font-semibold" style={{ color: '#3B82F6' }}>
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

