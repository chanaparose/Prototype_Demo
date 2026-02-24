import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Package, ChevronRight, Calendar } from 'lucide-react';
import { orders } from '../data/mockData';

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  in_production: { label: 'กำลังผลิต', color: '#3B82F6', bg: '#DBEAFE', dot: '#3B82F6' },
  shipped: { label: 'จัดส่งแล้ว', color: '#F59E0B', bg: '#FEF3C7', dot: '#F59E0B' },
  completed: { label: 'เสร็จสิ้น', color: '#22C55E', bg: '#DCFCE7', dot: '#22C55E' },
  pending: { label: 'รอดำเนินการ', color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const filterTabs = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'in_production', label: 'กำลังผลิต' },
  { id: 'shipped', label: 'จัดส่งแล้ว' },
  { id: 'completed', label: 'เสร็จสิ้น' },
];

export function Orders() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = activeFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === activeFilter);

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">ติดตาม</p>
          <h1 className="text-gray-900" style={{ fontWeight: 700 }}>คำสั่งซื้อ</h1>
        </div>
        <button className="relative w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <Bell size={20} style={{ color: '#6C47FF' }} />
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'กำลังผลิต', value: orders.filter((o) => o.status === 'in_production').length, color: '#3B82F6', bg: '#DBEAFE' },
          { label: 'จัดส่งแล้ว', value: orders.filter((o) => o.status === 'shipped').length, color: '#F59E0B', bg: '#FEF3C7' },
          { label: 'เสร็จสิ้น', value: orders.filter((o) => o.status === 'completed').length, color: '#22C55E', bg: '#DCFCE7' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xl" style={{ fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm transition-all duration-200"
            style={{
              background: activeFilter === tab.id ? '#6C47FF' : '#F3F4F6',
              color: activeFilter === tab.id ? '#fff' : '#6B7280',
              fontWeight: activeFilter === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      {filtered.length === 0 ? (
        <EmptyOrderState />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg = statusConfig[order.status];
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
                      style={{ background: '#EDE9FF' }}
                    >
                      <Package size={18} style={{ color: '#6C47FF' }} />
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

                {/* Progress */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>ความคืบหน้า</span>
                    <span style={{ fontWeight: 700, color: '#6C47FF' }}>{order.progress}%</span>
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

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} className="text-gray-400" />
                      <span>{order.estimatedDelivery}</span>
                    </div>
                    <span>฿{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#6C47FF', fontWeight: 600 }}>
                    ดูรายละเอียด <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyOrderState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
        style={{ background: '#EDE9FF' }}
      >
        <Package size={36} style={{ color: '#6C47FF' }} />
      </div>
      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>ยังไม่มีคำสั่งซื้อ</p>
      <p className="text-sm text-gray-500 max-w-[200px]">
        คำสั่งซื้อจะปรากฏที่นี่หลังจากที่คุณยืนยันใบเสนอราคา
      </p>
    </div>
  );
}
