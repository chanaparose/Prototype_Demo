import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Search, Bell, SlidersHorizontal, MapPin, Star, Plus, ChevronRight, TrendingUp, Clock, Copy, Gift, BadgeCheck } from 'lucide-react';
import { currentUser, factories, rfqs, orders, categories, ideaArticles } from '../data/mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const PROMO_SLIDES = [
  { id: '1', title: 'ลด 15% ค่าผลิตครั้งแรก', subtitle: 'ใช้โค้ดนี้เมื่อสร้าง RFQ ใหม่ หมดเขต 31 มี.ค. 2026', code: 'FIRST15' },
  { id: '2', title: 'ส่วนลด 500 บาท', subtitle: 'เมื่อสั่งซื้อขั้นต่ำ 5,000 บาท หมดเขต 30 เม.ย. 2026', code: 'PET500' },
  { id: '3', title: 'ฟรีค่าจัดส่ง', subtitle: 'ออเดอร์แรกเท่านั้น หมดเขต 15 พ.ค. 2026', code: 'FREESHIP' },
];

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
  const [promoIndex, setPromoIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeRFQs = rfqs.filter((r) => r.status !== 'completed');
  const recentOrders = orders.filter((o) => o.status !== 'completed').slice(0, 2);

  // Auto-scroll promo carousel
  useEffect(() => {
    const t = setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_SLIDES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

      {/* Promo Ad Carousel - เลื่อนซ้ายขวาอัตโนมัติ */}
      <div className="relative mb-6 overflow-hidden -mx-4">
        {/* เอา div px-4 ที่ครอบอยู่ออก แล้วย้ายการตั้งค่ามาไว้ใน style ของ flex เลย */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            // 1. ตั้ง Padding ซ้าย/ขวา ดันให้การ์ดแผ่นแรกและแผ่นสุดท้ายอยู่ตรงกลางจอเป๊ะ
            paddingLeft: 'calc(50% - (min(85vw, 340px) / 2))',
            paddingRight: 'calc(50% - (min(85vw, 340px) / 2))',
            // 2. ตั้ง gap ผ่าน style เพื่อให้คำนวณร่วมกันได้ง่ายขึ้น
            gap: '12px',
            // 3. สูตรเลื่อน: เลื่อนไปซ้ายตามจำนวน index * (ความกว้างการ์ด + gap)
            transform: `translateX(calc(-${promoIndex} * (min(85vw, 340px) + 12px)))`,
          }}
        >
          {PROMO_SLIDES.map((promo) => (
            <div
              key={promo.id}
              className="flex-shrink-0 w-[85vw] max-w-[340px] rounded-2xl overflow-hidden shadow-lg"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-4 text-white">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-5 h-5" />
                    <span style={{ fontSize: 13 }} className="opacity-90">โปรโมชั่นพิเศษ!</span>
                  </div>
                  <p style={{ fontSize: 18 }} className="mb-1 font-bold">{promo.title}</p>
                  <p style={{ fontSize: 12 }} className="opacity-80 mb-3">{promo.subtitle}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/30">
                      <span style={{ fontSize: 15, letterSpacing: 2 }}>{promo.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(promo.code, promo.id)}
                      className="flex items-center gap-1.5 bg-white text-purple-600 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors"
                      style={{ fontSize: 13 }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedId === promo.id ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* จุด Indicators */}
        <div className="flex justify-center gap-1.5 mt-4">
          {PROMO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`สไลด์ ${i + 1}`}
              onClick={() => setPromoIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === promoIndex ? 'w-5 bg-[#6C47FF]' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Categories - แถวเดียว เลื่อนได้ */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-gray-800" style={{ fontWeight: 700 }}>หมวดหมู่</h3>
          <button type="button" className="text-purple-600" style={{ fontSize: 13 }}>ดูทั้งหมด</button>
        </div>
        <div
          className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-gray-50 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-xl leading-none">{cat.icon}</span>
              </div>
              <span className="text-gray-600 whitespace-nowrap" style={{ fontSize: 11 }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Factories */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-gray-800" style={{ fontWeight: 700 }}>โรงงานแนะนำ</h3>
          <button type="button" className="flex items-center gap-0.5 text-purple-600" style={{ fontSize: 13 }}>
            ดูทั้งหมด
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4">
          {factories.map((factory) => (
            <div
              key={factory.id}
              onClick={() => navigate(`/factories/${factory.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="relative h-28">
                <ImageWithFallback
                  src={factory.image}
                  alt={factory.name}
                  className="w-full h-full object-cover"
                />
                {factory.verified && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-purple-600" style={{ fontSize: 10 }}>ยืนยันแล้ว</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-purple-600/90 text-white rounded-full px-2 py-0.5" style={{ fontSize: 10 }}>
                  {factory.priceRange}
                </div>
              </div>
              <div className="p-3">
                <p className="text-gray-800 truncate mb-1" style={{ fontSize: 13 }}>{factory.name}</p>
                <div className="flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500" style={{ fontSize: 11 }}>{factory.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-gray-700" style={{ fontSize: 12 }}>{factory.rating}</span>
                    <span className="text-gray-400" style={{ fontSize: 11 }}>({factory.reviews})</span>
                  </div>
                </div>
                <p className="text-gray-400 mt-1" style={{ fontSize: 10 }}>ขั้นต่ำ {factory.minOrder}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* บทความ Idea - โรงงานโพสโปรโมท + แนวคิดให้ลูกค้า */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-gray-800" style={{ fontWeight: 700 }}>บทความ Idea</h3>
          <button type="button" className="flex items-center gap-0.5 text-purple-600" style={{ fontSize: 13 }}>
            ดูทั้งหมด
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {ideaArticles.map((article) => (
            <div
              key={article.id}
              className="flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="relative h-36">
                <ImageWithFallback
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-medium"
                  style={{ background: 'rgba(108, 70, 255, 0.9)' }}
                >
                  {article.tag}
                </span>
              </div>
              <div className="p-3">
                <p className="text-gray-800 font-medium truncate mb-0.5" style={{ fontSize: 13 }}>{article.title}</p>
                <p className="text-gray-500 line-clamp-2 mb-2" style={{ fontSize: 11 }}>{article.excerpt}</p>
                <p className="text-gray-400" style={{ fontSize: 10 }}>{article.factoryName}</p>
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
