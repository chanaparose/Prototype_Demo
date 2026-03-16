import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Copy,
  Gift,
  ChevronRight,
  TrendingUp,
  Clock,
  BadgeCheck,
  MapPin,
  Star,
} from 'lucide-react';
import {
  currentUser,
  factories,
  rfqs,
  orders,
  categories,
  ideaArticles,
} from '../data/mockData';
import {
  ExplorePromoCarousel,
  ExploreCategories,
  ExploreFactoryGrid,
  ExploreIdeaArticles,
  ExploreRecentActivity,
} from '../components/features/explore';
import { PROMO_SLIDES, EXPLORE_STATUS_CONFIG } from '../components/features/explore/constants';
import { ImageWithFallback } from '../components/shared';

export function Explore() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeRFQs = rfqs.filter((r) => r.status !== 'completed');
  const recentOrders = orders.filter((o) => o.status !== 'completed').slice(0, 2);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* ─── Mobile Layout (unchanged) ─── */}
      <div className="lg:hidden px-4 pt-5 pb-4 space-y-5">
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
          <button
            type="button"
            className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal size={18} style={{ color: '#6C47FF' }} />
          </button>
        </div>

        <ExplorePromoCarousel />

        <ExploreCategories categories={categories} />

        <ExploreFactoryGrid
          factories={factories}
          onFactoryClick={(id) => navigate(`/factories/${id}`)}
        />

        <ExploreIdeaArticles articles={ideaArticles} />

        <ExploreRecentActivity
          rfqs={activeRFQs.slice(0, 2)}
          orders={recentOrders}
          onRfqClick={(id) => navigate(`/rfqs/${id}`)}
          onOrderClick={(id) => navigate(`/orders/${id}`)}
          onViewAllClick={() => navigate('/orders')}
        />

        <button
          type="button"
          onClick={() => navigate('/create-rfq')}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
          style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>

      {/* ─── Desktop Layout (lg+) ─── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:px-8 lg:py-7 min-h-screen">
        {/* ── Left Main Column ── */}
        <div className="min-w-0 space-y-7">
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-gray-100">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ค้นหาโรงงาน ประเภทงาน หรือ วัสดุ..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            <button
              type="button"
              className="px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 text-sm font-medium shrink-0"
              style={{ color: '#6C47FF' }}
            >
              <SlidersHorizontal size={16} />
              ตัวกรอง
            </button>
          </div>

          {/* Promo Banner — Desktop: 3 cards in a row */}
          <div>
            <div className="grid grid-cols-3 gap-4">
              {PROMO_SLIDES.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-2xl overflow-hidden shadow-md"
                >
                  <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 p-5 text-white">
                    <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10" />
                    <div className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full bg-white/10" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Gift className="w-4 h-4 opacity-90" />
                        <span className="text-[11px] opacity-80">โปรโมชั่นพิเศษ</span>
                      </div>
                      <p className="text-base font-bold mb-1 leading-tight">{promo.title}</p>
                      <p className="text-[11px] opacity-75 mb-3 leading-snug">{promo.subtitle}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-white/30">
                          <span className="text-sm font-mono tracking-widest">{promo.code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(promo.code, promo.id)}
                          className="flex items-center gap-1 bg-white text-purple-600 rounded-lg px-2.5 py-1 hover:bg-purple-50 transition-colors text-[12px] font-semibold"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === promo.id ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Factory Grid — 3 columns on desktop */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-bold text-base">โรงงานแนะนำ</h3>
              <button type="button" className="flex items-center gap-0.5 text-purple-600 text-sm">
                ดูทั้งหมด <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {factories.map((factory) => (
                <div
                  key={factory.id}
                  onClick={() => navigate(`/factories/${factory.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="relative h-36">
                    <ImageWithFallback
                      src={factory.image}
                      alt={factory.name}
                      className="w-full h-full object-cover"
                    />
                    {factory.verified && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <BadgeCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-purple-600 text-[10px]">ยืนยันแล้ว</span>
                      </div>
                    )}
                    <div
                      className="absolute top-2 right-2 bg-purple-600/90 text-white rounded-full px-2 py-0.5 text-[10px]"
                    >
                      {factory.priceRange}
                    </div>
                  </div>
                  <div className="p-3.5">
                    <p className="text-gray-800 font-semibold text-sm truncate mb-1.5">{factory.name}</p>
                    <div className="flex items-center gap-1 mb-1.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-500 text-xs">{factory.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-gray-700 text-xs font-semibold">{factory.rating}</span>
                        <span className="text-gray-400 text-[11px]">({factory.reviews})</span>
                      </div>
                      <span className="text-gray-400 text-[10px]">ขั้นต่ำ {factory.minOrder}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Idea Articles — grid on desktop */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-bold text-base">บทความ Idea</h3>
              <button type="button" className="flex items-center gap-0.5 text-purple-600 text-sm">
                ดูทั้งหมด <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {ideaArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="relative h-44">
                    <ImageWithFallback
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-white text-[10px] font-medium"
                      style={{ background: 'rgba(108, 70, 255, 0.9)' }}
                    >
                      {article.tag}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-800 font-semibold text-sm mb-1.5 leading-snug">
                      {article.title}
                    </p>
                    <p className="text-gray-500 text-xs line-clamp-2 mb-2">{article.excerpt}</p>
                    <p className="text-gray-400 text-[11px]">{article.factoryName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="space-y-5">
          <div className="sticky top-6 space-y-5">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
                สรุปภาพรวม
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold" style={{ color: '#6C47FF' }}>
                    {rfqs.filter((r) => r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'expired').length}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">RFQ ที่ใช้งาน</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-600">
                    {orders.filter((o) => o.status !== 'completed').length}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">คำสั่งซื้อ</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-600">
                    {rfqs.filter((r) => r.status === 'offers_received' || r.status === 'reviewing').length}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">รอพิจารณา</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {factories.length}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">โรงงาน</p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  หมวดหมู่
                </p>
                <button type="button" className="text-purple-600 text-xs">ดูทั้งหมด</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <span className="text-lg leading-none">{cat.icon}</span>
                    </div>
                    <span className="text-gray-600 text-[10px] text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  กิจกรรมล่าสุด
                </p>
                <button
                  onClick={() => navigate('/orders')}
                  className="flex items-center gap-0.5 text-xs"
                  style={{ color: '#6C47FF', fontWeight: 600 }}
                >
                  ดูทั้งหมด <ChevronRight size={13} />
                </button>
              </div>
              <div className="space-y-2.5">
                {activeRFQs.slice(0, 3).map((rfq) => {
                  const cfg = EXPLORE_STATUS_CONFIG[rfq.status] ?? {
                    label: rfq.status,
                    color: '#6B7280',
                    bg: '#F3F4F6',
                  };
                  return (
                    <div
                      key={rfq.id}
                      onClick={() => navigate(`/rfqs/${rfq.id}`)}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm"
                        style={{ background: 'rgba(108,71,255,0.08)' }}
                      >
                        {rfq.categoryIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 font-semibold truncate">{rfq.projectName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <TrendingUp size={9} className="text-gray-400" />
                            <span className="text-[10px] text-gray-400">
                              ฿{rfq.budget.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create RFQ CTA */}
            <button
              onClick={() => navigate('/create-rfq')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98] shadow-md"
              style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
            >
              <Plus size={18} />
              สร้าง RFQ ใหม่
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
