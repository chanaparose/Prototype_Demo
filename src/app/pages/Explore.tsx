import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Search, Bell, SlidersHorizontal, MapPin, Star, Plus, ChevronRight, Zap, TrendingUp, Clock } from 'lucide-react';
import { currentUser, factories, rfqs, orders, categories } from '../data/mockData';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  offers_received: { label: 'มีใบเสนอราคา', color: '#6C47FF', bg: '#EDE9FF' },
  reviewing: { label: 'กำลังพิจารณา', color: '#F59E0B', bg: '#FEF3C7' },
  pending: { label: 'รอใบเสนอราคา', color: '#6B7280', bg: '#F3F4F6' },
  in_production: { label: 'กำลังผลิต', color: '#3B82F6', bg: '#DBEAFE' },
  shipped: { label: 'จัดส่งแล้ว', color: '#22C55E', bg: '#DCFCE7' },
  completed: { label: 'เสร็จสิ้น', color: '#22C55E', bg: '#DCFCE7' },
};

export function Explore() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  const activeRFQs = rfqs.filter((r) => r.status !== 'completed');
  const recentOrders = orders.filter((o) => o.status !== 'completed').slice(0, 2);

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt="avatar"
            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow"
          />
          <div>
            <p className="text-xs text-gray-500">สวัสดี! 👋</p>
            <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
              {currentUser.name}
            </p>
          </div>
        </div>
        <Link to="/notifications" className="relative w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <Bell size={20} style={{ color: '#6C47FF' }} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px]"
            style={{ background: '#6C47FF', fontWeight: 700 }}>3</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาโรงงาน หรือ ประเภทงาน..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <button className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
          <SlidersHorizontal size={18} style={{ color: '#6C47FF' }} />
        </button>
      </div>

      {/* Purple Banner */}
      <div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #8B5CF6 50%, #A78BFA 100%)' }}
      >
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 bg-white" />
        <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full opacity-15 bg-white" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-yellow-300" />
            <span className="text-white/80 text-xs">สถิติของคุณ</span>
          </div>
          <p className="text-white text-lg mb-3" style={{ fontWeight: 700 }}>
            มี {activeRFQs.length} RFQ รอการดำเนินการ
          </p>
          <div className="flex gap-4 mb-4">
            <div className="text-center">
              <p className="text-white text-xl" style={{ fontWeight: 700 }}>5</p>
              <p className="text-white/70 text-[10px]">ใบเสนอราคา</p>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <p className="text-white text-xl" style={{ fontWeight: 700 }}>2</p>
              <p className="text-white/70 text-[10px]">กำลังผลิต</p>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <p className="text-white text-xl" style={{ fontWeight: 700 }}>฿48.5K</p>
              <p className="text-white/70 text-[10px]">กระเป๋าเงิน</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/create-rfq')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
          >
            <Plus size={16} />
            สร้าง RFQ ใหม่
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>หมวดหมู่</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 flex flex-col items-center gap-1.5 transition-all active:scale-95"
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs text-gray-700" style={{ fontWeight: 500 }}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Factories */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>โรงงานแนะนำ</p>
          <button className="flex items-center gap-0.5 text-xs" style={{ color: '#6C47FF', fontWeight: 600 }}>
            ดูทั้งหมด <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {factories.map((factory) => (
            <div
              key={factory.id}
              className="shrink-0 w-52 bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden cursor-pointer transition-all active:scale-95"
            >
              <div className="relative">
                <img
                  src={factory.image}
                  alt={factory.name}
                  className="w-full h-28 object-cover"
                />
                {factory.verified && (
                  <span
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] text-white"
                    style={{ background: '#6C47FF', fontWeight: 600 }}
                  >
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-900 truncate" style={{ fontWeight: 700 }}>{factory.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={10} className="text-gray-400" />
                  <span className="text-[10px] text-gray-500">{factory.location}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-700" style={{ fontWeight: 600 }}>{factory.rating}</span>
                    <span className="text-[10px] text-gray-400">({factory.reviews})</span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: '#EDE9FF', color: '#6C47FF', fontWeight: 600 }}
                  >
                    {factory.priceRange}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 truncate">{factory.specialization}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>กิจกรรมล่าสุด</p>
          <button
            onClick={() => navigate('/rfqs')}
            className="flex items-center gap-0.5 text-xs"
            style={{ color: '#6C47FF', fontWeight: 600 }}
          >
            ดูทั้งหมด <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Active RFQs */}
          {activeRFQs.slice(0, 2).map((rfq) => {
            const cfg = statusConfig[rfq.status];
            return (
              <div
                key={rfq.id}
                onClick={() => navigate(`/rfqs/${rfq.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{rfq.categoryIcon}</span>
                      <p className="text-xs text-gray-500">{rfq.category}</p>
                    </div>
                    <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{rfq.projectName}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">฿{rfq.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{rfq.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px]"
                      style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}
                    >
                      {cfg.label}
                    </span>
                    {rfq.offerCount > 0 && (
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px]"
                        style={{ background: '#EDE9FF', color: '#6C47FF', fontWeight: 700 }}
                      >
                        {rfq.offerCount} ใบเสนอราคา
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Active Orders */}
          {recentOrders.map((order) => {
            const cfg = statusConfig[order.status];
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 mb-0.5">คำสั่งซื้อ #{order.id}</p>
                    <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{order.projectName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.factoryName}</p>
                  </div>
                  <span
                    className="shrink-0 px-2.5 py-1 rounded-full text-[10px] ml-3"
                    style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>ความคืบหน้า</span>
                    <span style={{ fontWeight: 600, color: '#6C47FF' }}>{order.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${order.progress}%`,
                        background: 'linear-gradient(90deg, #6C47FF, #A78BFA)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick RFQ FAB */}
      <button
        onClick={() => navigate('/create-rfq')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
        style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  );
}
