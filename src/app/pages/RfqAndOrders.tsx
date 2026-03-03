import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Filter,
  Package,
  ChevronRight,
  Calendar,
  FileText,
  Plus,
  Layers,
} from 'lucide-react';
import { rfqs, orders } from '../data/mockData';

const PRIMARY_COLOR = '#6C47FF';
const PRIMARY_BG = '#EDE9FF';
const PRIMARY_BG_LIGHT = '#F1EEFF';

// RFQ: แสดงเฉพาะที่ยังไม่จบ (ไม่รวม cancelled, expired ในแท็บหลัก — หรือรวมทั้งหมดแล้วใช้ filter)
const RFQ_STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'รอดำเนินการ', color: '#EA580C', bg: '#FFEDD5' },
  offers_received: { label: 'มีใบเสนอราคา', color: '#0284C7', bg: '#E0F2FE' },
  reviewing: { label: 'มีใบเสนอราคา', color: '#0284C7', bg: '#E0F2FE' },
  completed: { label: 'ตอบรับแล้ว', color: '#16A34A', bg: '#DCFCE7' },
  cancelled: { label: 'ยกเลิก', color: '#6B7280', bg: '#F3F4F6' },
  expired: { label: 'หมดอายุ', color: '#B45309', bg: '#FEF3C7' },
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  in_production: { label: 'กำลังผลิต', color: '#3B82F6', bg: '#DBEAFE', dot: '#3B82F6' },
  shipped: { label: 'จัดส่งแล้ว', color: '#F59E0B', bg: '#FEF3C7', dot: '#F59E0B' },
  completed: { label: 'เสร็จสิ้น', color: '#22C55E', bg: '#DCFCE7', dot: '#22C55E' },
  pending: { label: 'รอดำเนินการ', color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const ORDER_FILTER_TABS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'in_production', label: 'กำลังผลิต' },
  { id: 'shipped', label: 'จัดส่งแล้ว' },
  { id: 'completed', label: 'เสร็จสิ้น' },
];

type RfqFilterId = 'all' | 'pending' | 'has_quote' | 'accepted';

function formatBudget(n: number): string {
  return '฿' + n.toLocaleString('th-TH');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

function getRfqFilterId(status: string): RfqFilterId | null {
  if (status === 'pending') return 'pending';
  if (status === 'offers_received' || status === 'reviewing') return 'has_quote';
  if (status === 'completed') return 'accepted';
  return null; // cancelled, expired — show in "all" only
}

export function RfqAndOrders() {
  const navigate = useNavigate();
  const [primaryTab, setPrimaryTab] = useState<'rfq' | 'orders'>('rfq');
  const [rfqFilter, setRfqFilter] = useState<RfqFilterId>('all');
  const [orderFilter, setOrderFilter] = useState('all');

  const filteredRfqs = useMemo(() => {
    return rfqs.filter((r) => {
      if (rfqFilter === 'all') return true;
      const fid = getRfqFilterId(r.status);
      return fid === rfqFilter;
    });
  }, [rfqFilter]);

  const filteredOrders =
    orderFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === orderFilter);

  const rfqSummary = useMemo(() => {
    const total = rfqs.length;
    const pending = rfqs.filter((r) => r.status === 'pending').length;
    const totalBudget = rfqs.reduce((sum, r) => sum + (r.budget ?? 0), 0);
    return { total, pending, totalBudget };
  }, []);

  const orderSummary = useMemo(() => {
    return {
      inProduction: orders.filter((o) => o.status === 'in_production').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    };
  }, []);

  return (
    <div className="pb-4 flex flex-col min-h-full pb-20">
      {/* Header - เหมือนหน้าบัญชี โปรไฟล์ */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">คำขอ</p>
            <h1 className="text-gray-900" style={{ fontWeight: 700 }}>RFQ & คำสั่งซื้อ</h1>
          </div>
          
        </div>
      </div>

      <div className="px-4 flex-1 flex flex-col">

      {/* Primary Tabs: RFQ ของฉัน | คำสั่งซื้อ */}
      <div
        className="flex p-1 rounded-2xl mb-4"
        style={{ background: PRIMARY_BG }}
      >
        <button
          onClick={() => setPrimaryTab('rfq')}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: primaryTab === 'rfq' ? '#fff' : 'transparent',
            color: primaryTab === 'rfq' ? PRIMARY_COLOR : '#6B7280',
            boxShadow: primaryTab === 'rfq' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          RFQ ของฉัน
        </button>
        <button
          onClick={() => setPrimaryTab('orders')}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: primaryTab === 'orders' ? '#fff' : 'transparent',
            color: primaryTab === 'orders' ? PRIMARY_COLOR : '#6B7280',
            boxShadow: primaryTab === 'orders' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          คำสั่งซื้อ
        </button>
      </div>

      {primaryTab === 'rfq' ? (
        <>
          {/* สร้าง RFQ ใหม่ */}
          <Link
            to="/create-rfq"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl mb-4 text-white font-bold text-sm"
            style={{ background: PRIMARY_COLOR }}
          >
            <Plus size={20} />
            สร้าง RFQ ใหม่
          </Link>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-lg" style={{ fontWeight: 700, color: PRIMARY_COLOR }}>
                {rfqSummary.total}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">ทั้งหมด</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-lg" style={{ fontWeight: 700, color: '#EA580C' }}>
                {rfqSummary.pending}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">รอดำเนินการ</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-lg" style={{ fontWeight: 700, color: '#16A34A' }}>
                {formatBudget(rfqSummary.totalBudget)}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">งบรวม</p>
            </div>
          </div>

          {/* Secondary filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
            {[
              { id: 'all' as const, label: 'ทั้งหมด' },
              { id: 'pending' as const, label: 'รอดำเนินการ' },
              { id: 'has_quote' as const, label: 'มีใบเสนอราคา' },
              { id: 'accepted' as const, label: 'ตอบรับแล้ว' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRfqFilter(tab.id)}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm transition-all"
                style={{
                  background: rfqFilter === tab.id ? PRIMARY_COLOR : '#fff',
                  color: rfqFilter === tab.id ? '#fff' : '#6B7280',
                  fontWeight: rfqFilter === tab.id ? 600 : 400,
                  border: rfqFilter === tab.id ? 'none' : '1px solid #E5E7EB',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* RFQ List */}
          <div className="space-y-3">
            {filteredRfqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: PRIMARY_BG }}
                >
                  <FileText size={36} style={{ color: PRIMARY_COLOR }} />
                </div>
                <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
                  ยังไม่มี RFQ
                </p>
                <p className="text-sm text-gray-500 max-w-[220px] mb-4">
                  สร้าง RFQ ใหม่เพื่อรับใบเสนอราคาจากโรงงาน
                </p>
                <Link
                  to="/create-rfq"
                  className="py-2.5 px-6 rounded-xl text-white font-bold text-sm"
                  style={{ background: PRIMARY_COLOR }}
                >
                  สร้าง RFQ ใหม่
                </Link>
              </div>
            ) : (
              filteredRfqs.map((rfq) => {
                const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
                  label: rfq.status,
                  color: '#6B7280',
                  bg: '#F3F4F6',
                };
                return (
                  <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block">
                    <div
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex gap-3 min-w-0 flex-1">
                          <div
                            className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: PRIMARY_BG }}
                          >
                            {rfq.categoryIcon ?? <Layers size={24} style={{ color: PRIMARY_COLOR }} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-gray-500 mb-0.5" style={{ color: PRIMARY_COLOR }}>
                              {rfq.category}
                            </p>
                            <h3 className="text-gray-900 font-bold text-sm leading-tight truncate">
                              {rfq.projectName}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {rfq.description?.slice(0, 60)}
                              {(rfq.description?.length ?? 0) > 60 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                        <span
                          className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: statusCfg.bg, color: statusCfg.color }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <FileText size={12} style={{ color: '#9CA3AF' }} />
                            {formatBudget(rfq.budget)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} style={{ color: '#9CA3AF' }} />
                            {formatDate(rfq.createdAt)}
                          </span>
                        </div>
                        <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>
                          {rfq.offerCount} โรงงานตอบ
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-end gap-1 text-xs" style={{ color: PRIMARY_COLOR, fontWeight: 600 }}>
                        ดูใบเสนอราคา <ChevronRight size={14} />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          {/* Summary คำสั่งซื้อ */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'กำลังผลิต', value: orderSummary.inProduction, color: '#3B82F6', bg: '#DBEAFE' },
              { label: 'จัดส่งแล้ว', value: orderSummary.shipped, color: '#F59E0B', bg: '#FEF3C7' },
              { label: 'เสร็จสิ้น', value: orderSummary.completed, color: '#22C55E', bg: '#DCFCE7' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
                <p className="text-xl" style={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filter Tabs Orders */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
            {ORDER_FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setOrderFilter(tab.id)}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm transition-all"
                style={{
                  background: orderFilter === tab.id ? PRIMARY_COLOR : '#F3F4F6',
                  color: orderFilter === tab.id ? '#fff' : '#6B7280',
                  fontWeight: orderFilter === tab.id ? 600 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Order List */}
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
                          <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>
                            {order.projectName}
                          </p>
                          <p className="text-xs text-gray-500">{order.factoryName}</p>
                        </div>
                      </div>
                      <span
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] shrink-0 ml-2"
                        style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}
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
                      <div className="flex items-center gap-1 text-xs" style={{ color: PRIMARY_COLOR, fontWeight: 600 }}>
                        ดูรายละเอียด <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
