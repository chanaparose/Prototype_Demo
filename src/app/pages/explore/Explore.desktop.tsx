import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  SlidersHorizontal,
  Copy,
  Gift,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Star,
  BadgeCheck,
  Plus,
  Sparkles,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { PROMO_SLIDES } from '../../components/features/explore/constants';
import { ExploreFooter } from '../../components/features/explore/ExploreFooter';
import { ImageWithFallback } from '../../components/shared';
import type { CategoryItem } from '../../components/features/explore/ExploreCategories';
import type { FactoryItem } from '../../components/features/explore/ExploreFactoryGrid';
import type { IdeaArticleItem } from '../../components/features/explore/ExploreIdeaArticles';

/* ── Mock data for สินค้าแนะนำ ─────────────────────────── */
const RECOMMENDED_PRODUCTS = [
  { id: 'p1', title: 'อาหารแมว Holistic สูตรไก่-แอปเปิล', price: '฿1,200.00', img: 'https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=400' },
  { id: 'p2', title: 'ขนมสุนัขออร์แกนิค ไม่มีสารกันบูด', price: '฿350.00', img: 'https://images.unsplash.com/photo-1589924749359-9697080c3577?w=400' },
  { id: 'p3', title: 'เสื้อสเวตเตอร์สัตว์เลี้ยง Size M', price: '฿250.00', img: 'https://images.unsplash.com/photo-1768745888568-b3ef7c7ba366?w=400' },
  { id: 'p4', title: 'แชมพูอาบน้ำสุนัข สูตรอ่อนโยน', price: '฿180.00', img: 'https://images.unsplash.com/photo-1625279138836-e7311d5c863a?w=400' },
  { id: 'p5', title: 'ของเล่นยางกัดสุนัข กลิ่นมิ้นท์', price: '฿120.00', img: 'https://images.unsplash.com/photo-1589924749359-9697080c3577?w=400' },
  { id: 'p6', title: 'อาหารเสริมบำรุงขน Omega 3', price: '฿450.00', img: 'https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=400' },
  { id: 'p7', title: 'บ้านแมวไม้ยางพารา Size L', price: '฿2,500.00', img: 'https://images.unsplash.com/photo-1768745888568-b3ef7c7ba366?w=400' },
  { id: 'p8', title: 'สายจูงสุนัข Retractable 5m', price: '฿890.00', img: 'https://images.unsplash.com/photo-1625279138836-e7311d5c863a?w=400' },
];

/* ── Mock data for โปรโมชันแนะนำ ────────────────────────── */
const RECOMMENDED_PROMOS = [
  { id: 'rp1', title: 'แพ็กเกจอาบน้ำ-ตัดขน VIP', desc: 'บริการดูแลความสะอาดแบบพรีเมียม', price: '฿850.00', img: 'https://images.unsplash.com/photo-1625279138836-e7311d5c863a?w=400', tag: 'บริการ' },
  { id: 'rp2', title: 'ลด 15% ค่าผลิตครั้งแรก', desc: 'ใช้โค้ด FIRST15 เมื่อสร้าง RFQ ใหม่', price: 'ลดสูงสุด ฿2,000', img: 'https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=400', tag: 'ส่วนลด' },
  { id: 'rp3', title: 'บริการสระว่ายน้ำสุนัข', desc: 'ออกกำลังกายเสริมสุขภาพที่ดี', price: '฿500.00 - ฿3,500.00', img: 'https://images.unsplash.com/photo-1589924749359-9697080c3577?w=400', tag: 'บริการ' },
  { id: 'rp4', title: 'ส่วนลด 500 บาท', desc: 'เมื่อสั่งซื้อขั้นต่ำ 5,000 บาท', price: 'โค้ด: PET500', img: 'https://images.unsplash.com/photo-1768745888568-b3ef7c7ba366?w=400', tag: 'ส่วนลด' },
];

/* ── ProductCarouselSection: maaboom.com-style left banner + auto-scrolling card carousel ── */
type ProductItem = { id: string; title: string; price: string; img: string; discount?: string };

const CARD_W = 204; // card width (192px) + gap (12px)
const VISIBLE_CARDS = 4;
const AUTO_SCROLL_INTERVAL = 3500;

function ProductCarouselSection({
  title,
  items,
  bannerImg,
  bannerText,
}: {
  title: string;
  items: ProductItem[];
  bannerImg: string;
  bannerText: string;
}) {
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const totalDots = Math.max(1, items.length - VISIBLE_CARDS + 1);

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(next, totalDots - 1));
    setIdx(clamped);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: clamped * CARD_W, behavior: 'smooth' });
    }
  }, [totalDots]);

  /* Auto-scroll */
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered.current) {
        setIdx((prev) => {
          const next = prev + 1 >= totalDots ? 0 : prev + 1;
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: next * CARD_W, behavior: 'smooth' });
          }
          return next;
        });
      }
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [totalDots]);

  return (
    <section
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#352A55] flex items-center gap-2">
          <ShoppingBag className="text-[#FF9A00]" size={20} />
          {title}
        </h2>
        <button className="text-[#A020C8] text-sm font-medium hover:underline flex items-center gap-0.5 transition-colors">
          ดูเพิ่มเติม <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex gap-3 items-stretch">
        {/* Left banner — fixed width square matching card height */}
        <div className="w-[200px] flex-shrink-0 rounded-2xl overflow-hidden relative cursor-pointer shadow-md group"
             style={{ minHeight: 290 }}>
          <img
            src={bannerImg}
            alt={title}
            className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D1060]/90 via-[#A020C8]/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            {/* Top badge */}
            <span className="self-start bg-[#FF9A00] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
              🐾 PET SHOP
            </span>
            {/* Bottom text */}
            <div>
              <p className="text-white text-lg font-black leading-tight drop-shadow-lg mb-2">
                {bannerText}
              </p>
              <span className="inline-block bg-white/20 border border-white/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                สำหรับสัตว์เลี้ยงแสนรัก
              </span>
            </div>
          </div>
        </div>

        {/* Right: card carousel + arrows + dots */}
        <div className="flex-1 relative min-w-0">
          {/* Prev arrow — overlaps left edge of card area */}
          <button
            onClick={() => goTo(idx - 1)}
            disabled={idx === 0}
            className="absolute left-0 top-[calc(50%-20px)] -translate-x-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>

          {/* Cards scroll area */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-hidden pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[192px] bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group cursor-pointer"
              >
                {/* Image — taller for product visibility */}
                <div className="h-[180px] relative overflow-hidden bg-gray-50">
                  <img
                    src={product.img}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.discount && (
                    <span className="absolute top-2 right-2 bg-[#FF9A00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      {product.discount}
                    </span>
                  )}
                  {/* Subtle paw badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm text-[11px]">
                    🐾
                  </div>
                </div>
                {/* Card body */}
                <div className="p-3 pb-4">
                  <p className="text-gray-700 text-xs mb-2 line-clamp-2 leading-snug group-hover:text-[#A020C8] transition-colors min-h-[32px]">
                    {product.title}
                  </p>
                  <p className="font-bold text-[#FF9A00] text-base">{product.price}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Next arrow — overlaps right edge */}
          <button
            onClick={() => goTo(idx + 1)}
            disabled={idx >= totalDots - 1}
            className="absolute right-0 top-[calc(50%-20px)] translate-x-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: totalDots }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx ? 'w-6 bg-[#FF9A00]' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type ExploreDesktopProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  copiedId: string | null;
  setCopiedId: (v: string | null) => void;
  categories: CategoryItem[];
  factories: FactoryItem[];
  activeRFQs: any[];
  recentOrders: any[];
  ideaArticles: IdeaArticleItem[];
};

export function ExploreDesktop({
  searchText,
  setSearchText,
  copiedId,
  setCopiedId,
  categories,
  factories,
  ideaArticles,
}: ExploreDesktopProps) {
  const navigate = useNavigate();

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="hidden lg:block min-h-screen">
      <div className="lg:px-8 lg:py-7 space-y-12 pb-0 w-full mx-auto">

        {/* ═══ 1. Hero Banner ═══ */}
        <section className="relative rounded-3xl overflow-hidden bg-[#2D1060] h-[280px] shadow-lg flex items-center">
          <div className="absolute top-0 right-0 w-[600px] h-full bg-[#A020C8] rounded-l-[100px] opacity-90 transform translate-x-32 skew-x-[-15deg]"></div>
          <div className="absolute -bottom-20 right-20 w-[400px] h-[300px] bg-[#FF9A00] rounded-full opacity-70 blur-3xl mix-blend-screen"></div>
          <div className="absolute top-10 left-1/3 w-64 h-64 bg-[#FFD740] rounded-full opacity-20 blur-2xl"></div>

          <div className="relative z-10 px-10 py-6 text-white max-w-2xl">
            <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full bg-[#FF9A00]/20 text-[#FFD740] text-[11px] font-semibold tracking-wide border border-[#FF9A00]/30">
              PET MANUFACTURING PLATFORM
            </span>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-snug drop-shadow-md">
              ค้นหาโรงงาน <br /> <span className="text-[#FFD740]">สำหรับแบรนด์คุณ</span>
            </h1>
            <p className="text-[#E2DCE6] text-sm mb-4 max-w-md font-medium leading-relaxed">
              ค้นหาโรงงานผลิตสินค้าสัตว์เลี้ยงระดับพรีเมียม ตอบโจทย์ทุกแบรนด์
            </p>
            <button
              onClick={() => navigate('/create-rfq')}
              className="bg-[#FF9A00] hover:bg-[#E08800] text-white text-sm px-6 py-2.5 rounded-full font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              เริ่มสร้าง RFQ <ChevronRight size={16} />
            </button>
          </div>
        </section>

        {/* ═══ Search Bar ═══ */}
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
            className="px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 text-sm font-medium shrink-0 text-[#A020C8] hover:border-[#A020C8]/30 transition-colors"
          >
            <SlidersHorizontal size={16} />
            ตัวกรอง
          </button>
        </div>

        {/* ═══ 3. โค้ดส่วนลดพิเศษ (Promo Codes) ═══ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#352A55] flex items-center gap-2">
              <Sparkles className="text-[#FF9A00]" size={20} />
              โค้ดส่วนลดพิเศษ
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {PROMO_SLIDES.map((promo) => (
              <div
                key={promo.id}
                className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
              >
                <div className="relative overflow-hidden bg-gradient-to-br from-[#A020C8] via-[#7B10A8] to-[#FF9A00] p-5 text-white">
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
                        className="flex items-center gap-1 bg-white text-[#A020C8] rounded-lg px-2.5 py-1 hover:bg-purple-50 transition-colors text-[12px] font-semibold"
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
        </section>

        {/* ═══ 4. หมวดหมู่ (Categories) ═══ */}
        <section>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-[#A020C8]/30 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#A020C8]/10 group-hover:scale-110 transition-transform">
                  <span className="text-2xl leading-none">{cat.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 5. สินค้าแนะนำ — Maaboom-style layout ═══ */}
        <ProductCarouselSection title="สินค้าแนะนำ" items={RECOMMENDED_PRODUCTS} bannerImg="https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=700" bannerText="คุ้มค่า ถูกใจสัตว์เลี้ยง" />

        {/* ═══ 6. โรงงานแนะนำ (Purple Header Style) ═══ */}
        <section className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
          <div className="bg-[#7B10A8] px-6 py-5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 left-10 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
            <h2 className="text-2xl font-bold text-white relative z-10 drop-shadow-sm flex items-center justify-center gap-2">
              โรงงานแนะนำ <Plus size={20} className="font-bold" />
            </h2>
            <p className="text-white/90 text-sm mt-1 relative z-10 font-medium">
              โรงงานที่ผ่านการยืนยัน พร้อมรับผลิตสินค้าสัตว์เลี้ยงคุณภาพสูง
            </p>
          </div>

          <div className="p-6 bg-gradient-to-b from-purple-50/20 to-white">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {factories.map((factory) => (
                <div
                  key={factory.id}
                  onClick={() => navigate(`/factories/${factory.id}`)}
                  className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group cursor-pointer flex flex-col"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={factory.image}
                      alt={factory.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {factory.verified && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <BadgeCheck className="w-3.5 h-3.5 text-[#A020C8]" />
                        <span className="text-[#A020C8] text-[10px] font-medium">ยืนยันแล้ว</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-[#2D1060]/90 text-white rounded-full px-2 py-0.5 text-[10px]">
                      {factory.priceRange}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-medium text-sm text-gray-700 mb-1.5 truncate group-hover:text-[#A020C8] transition-colors">{factory.name}</h3>
                      <div className="flex items-center gap-1 mb-1.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500 text-xs">{factory.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
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
            <div className="mt-6 flex justify-center">
              <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-12 py-2.5 rounded-lg text-sm font-medium transition-colors">
                ดูเพิ่มเติม
              </button>
            </div>
          </div>
        </section>

        {/* ═══ 2. โปรโมชันแนะนำ (NEW: Image Left + Scrollable Right) ═══ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#352A55] flex items-center gap-2">
              <Tag className="text-[#FF9A00]" size={20} />
              โปรโมชันแนะนำ
            </h2>
            <button className="text-[#A020C8] text-sm font-medium hover:underline flex items-center">
              ดูเพิ่มเติม <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Banner */}
            <div className="lg:w-[40%] rounded-2xl overflow-hidden relative min-h-[260px] flex-shrink-0 group cursor-pointer shadow-md">
              <img
                src="https://images.unsplash.com/photo-1566575799269-4a58e16f766b?w=600"
                alt="Banner"
                className="w-full h-full object-cover absolute transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#A020C8]/80 to-transparent flex flex-col justify-end p-8">
                <h3 className="text-3xl font-black text-white drop-shadow-md mb-2">บริการ</h3>
                <p className="text-white font-medium text-lg drop-shadow-md mb-4 bg-[#FF9A00] self-start px-4 py-1.5 rounded-full">สำหรับสัตว์เลี้ยงแสนรัก</p>
              </div>
            </div>

            {/* Right Scrollable Cards */}
            <div className="lg:w-[60%] flex gap-4 overflow-x-auto snap-x hide-scrollbar pb-2">
              {RECOMMENDED_PROMOS.map((item) => (
                <div key={item.id} className="min-w-[240px] bg-white border border-gray-100 rounded-2xl overflow-hidden snap-start shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
                  <div className="h-36 relative overflow-hidden bg-gray-100">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-[#A020C8] uppercase">
                      {item.tag}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-sm text-[#352A55] mb-1 line-clamp-2 leading-snug group-hover:text-[#A020C8] transition-colors">{item.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.desc}</p>
                    <div className="mt-auto pt-3 border-t border-gray-50 font-bold text-[#FF9A00]">
                      {item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7. บทความ Idea ═══ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#352A55]">บทความ Idea</h2>
            <button className="text-[#A020C8] text-sm font-medium hover:underline flex items-center">
              ดูทั้งหมด <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Large Article */}
            {ideaArticles.length > 0 && (
              <div className="lg:w-[35%] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex-shrink-0 cursor-pointer group">
                <div className="h-48 relative overflow-hidden">
                  <ImageWithFallback
                    src={ideaArticles[0].image}
                    alt={ideaArticles[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-white text-[10px] font-medium bg-[#2D1060]/90">
                    {ideaArticles[0].tag}
                  </span>
                </div>
                <div className="p-6">
                  <span className="text-xs font-bold text-[#A020C8] mb-2 uppercase tracking-wide">
                    {ideaArticles[0].tag}
                  </span>
                  <h3 className="text-lg font-bold text-[#352A55] mb-2 group-hover:text-[#A020C8] transition-colors line-clamp-2">
                    {ideaArticles[0].title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {ideaArticles[0].excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{ideaArticles[0].factoryName}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right Stacked Articles */}
            <div className="lg:w-[65%] flex flex-col gap-4 h-full justify-between">
              {ideaArticles.slice(1).map((article) => (
                <div
                  key={article.id}
                  className="flex bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group h-full max-h-[140px] flex-shrink-0 min-w-[300px]"
                >
                  <div className="w-1/3 relative overflow-hidden">
                    <ImageWithFallback
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-medium bg-[#2D1060]/90">
                      {article.tag}
                    </span>
                  </div>
                  <div className="w-2/3 p-4 flex flex-col justify-center">
                    <h3 className="font-bold text-sm text-[#352A55] mb-1.5 line-clamp-2 leading-snug group-hover:text-[#FF9A00] transition-colors">{article.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{article.excerpt}</p>
                    <div className="mt-auto flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="font-medium text-gray-600">{article.factoryName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 8. Registration CTA ═══ */}
        <section className="bg-gradient-to-r from-[#F3E5FF] to-[#FAFAFA] rounded-2xl overflow-hidden border border-[#A020C8]/20 shadow-sm relative flex flex-col md:flex-row items-center py-8 px-6 md:px-12">
          <div className="relative z-10 flex-1 text-center md:text-left mb-6 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold text-[#352A55] mb-2 flex items-center justify-center md:justify-start gap-2">
              ลงทะเบียนข้อมูลธุรกิจกับ <span className="text-[#A020C8]">WeMake</span>
            </h2>
            <p className="text-gray-600 font-medium md:text-lg">
              สร้างเว็บไซต์หน้าร้านได้ง่าย ๆ ฟรี!
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button className="w-full sm:w-auto bg-[#A020C8] hover:bg-[#7B10A8] text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-md text-sm md:text-base whitespace-nowrap">
              สมัครเลย
            </button>
            <button className="w-full sm:w-auto bg-white border border-[#A020C8] text-[#A020C8] hover:bg-[#F3E5FF] px-8 py-3 rounded-lg font-bold transition-colors text-sm md:text-base whitespace-nowrap">
              สิทธิประโยชน์มากมาย
            </button>
          </div>
        </section>

      </div>

      {/* ═══ Footer ═══ */}
      <div className="lg:px-8">
        <ExploreFooter />
      </div>
    </div>
  );
}
