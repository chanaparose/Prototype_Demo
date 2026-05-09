import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  Leaf,
  Heart,
} from 'lucide-react';
import { EXPLORE_CATEGORY_TILES } from '../../components/features/explore/exploreCategoryTilesConfig';
import { exploreDisplayNameForTile } from '../../utils/exploreCategoriesFromApi';
import { ExploreFooter } from '../../components/features/explore/ExploreFooter';
import { HowToOrderSection } from '../../components/features/explore/HowToOrderSection';
import { ProductTour } from '../../components/features/explore/ProductTour';
import { ImageWithFallback } from '../../components/shared';
import type { CategoryItem } from '../../components/features/explore/ExploreCategories';
import type { FactoryItem } from '../../components/features/explore/ExploreFactoryGrid';
import type { IdeaArticleItem } from '../../components/features/explore/ExploreIdeaArticles';
/* ── ProductCarouselSection: maaboom.com-style left banner + auto-scrolling card carousel ── */
type ProductItem = {
  id: string;
  title: string;
  price: string;
  img: string;
  discount?: string;
  category?: string;
  subCategoryName?: string;
  factoryId?: string;
  factoryName?: string;
  likes?: number;
  minOrder?: number;
};

const CARD_W = 192; // card width (180px) + gap (12px)
const VISIBLE_CARDS = 4;
const AUTO_SCROLL_INTERVAL = 3500;

function ProductCarouselSection({
  title,
  items,
  bannerImg,
  bannerText,
  onItemClick,
  seeMoreHref = '/factory-ideas?type=product',
  theme = 'product',
  getFactoryMeta,
}: {
  title: string;
  items: ProductItem[];
  bannerImg: string;
  bannerText: string;
  onItemClick?: (id: string) => void;
  seeMoreHref?: string;
  theme?: 'product' | 'material';
  getFactoryMeta?: (factoryId?: string) => { location: string; rating: number; reviews: number };
}) {
  const navigate = useNavigate();
  const isMaterial = theme === 'material';
  const hasItems = items.length > 0;
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const totalDots = hasItems ? Math.max(1, items.length - VISIBLE_CARDS + 1) : 0;

  const goTo = useCallback((next: number) => {
    if (!hasItems || totalDots <= 0) return;
    const clamped = Math.max(0, Math.min(next, totalDots - 1));
    setIdx(clamped);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: clamped * CARD_W, behavior: 'smooth' });
    }
  }, [hasItems, totalDots]);

  /* Auto-scroll — เฉพาะเมื่อมีการ์ดให้เลื่อน */
  useEffect(() => {
    if (!hasItems || totalDots <= 1) return;
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
  }, [hasItems, totalDots]);

  return (
    <section
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; }}
    >
      {/* Section header */}
      <div className="mt-[30px] flex items-center justify-between mb-2.5">
        <h2 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
          {isMaterial
            ? <Leaf className="text-[#059669]" size={16} />
            : <ShoppingBag className="text-[#F28A2E]" size={16} />}
          {title}
        </h2>
        <button
          type="button"
          onClick={() => navigate(seeMoreHref)}
          className="text-xs font-medium hover:underline flex items-center gap-0.5 transition-colors"
          style={{ color: isMaterial ? '#059669' : '#A656A0' }}
        >
          ดูเพิ่มเติม <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex gap-3 items-stretch">
        {/* Left banner — fixed width square matching card height */}
        <div className="w-[150px] flex-shrink-0 rounded-2xl overflow-hidden relative cursor-pointer shadow-md group"
             style={{ minHeight: 210 }}>
          <ImageWithFallback
            src={bannerImg}
            alt={title}
            className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background: isMaterial
                ? 'linear-gradient(to top, rgba(4,120,87,0.45), rgba(5,150,105,0.22), transparent)'
                : 'linear-gradient(to top, rgba(242,120,48,0.45), rgba(242,138,46,0.22), transparent)',
            }}
          />
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-3">
            {/* Top badge */}
            <span
              className="self-start text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow backdrop-blur-[2px]"
              style={{ background: isMaterial ? 'rgba(5,150,105,0.75)' : 'rgba(242,138,46,0.75)' }}
            >
              {isMaterial ? '🌿 วัตถุดิบ' : '🐾 PET SHOP'}
            </span>
            {/* Bottom text */}
            <div>
              <p className="text-white text-sm font-black leading-tight drop-shadow-lg mb-1.5">
                {bannerText}
              </p>
              <span className="inline-block bg-white/20 border border-white/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {isMaterial ? 'สำหรับการผลิตของคุณ' : 'สำหรับสัตว์เลี้ยงแสนรัก'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: card carousel + arrows + dots — หรือ empty state */}
        <div className="flex-1 relative min-w-0">
          {!hasItems ? (
            <div
              className="flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-6 text-center"
            >
              <ShoppingBag className="text-[#F28A2E]/50" size={40} />
              <p className="text-sm font-medium text-gray-600">ยังไม่มีสินค้าแนะนำในขณะนี้</p>
              <p className="text-xs text-gray-400 max-w-sm">ลองดูไอเดียสินค้าและโรงงานได้จากลิงก์ด้านล่าง</p>
              <button
                type="button"
                onClick={() => navigate('/factory-ideas?type=product')}
                className="mt-1 rounded-full border border-[#A656A0]/40 bg-white px-4 py-2 text-sm font-medium text-[#A656A0] hover:bg-[#F8F5FF] transition-colors"
              >
                ดูสินค้าแนะนำ
              </button>
            </div>
          ) : (
            <>
              {/* Prev arrow — overlaps left edge of card area */}
              <button
                type="button"
                onClick={() => goTo(idx - 1)}
                disabled={idx === 0}
                className="absolute left-0 top-[calc(50%-28px)] -translate-x-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                  (() => {
                    const meta = getFactoryMeta?.(product.factoryId) ?? { location: '—', rating: 0, reviews: 0 };
                    return (
                  <div
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onItemClick?.(product.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onItemClick?.(product.id);
                      }
                    }}
                    className="flex-shrink-0 w-[180px] bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={product.img}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
                        style={{ backgroundColor: isMaterial ? '#0EA5A4' : '#5185D4' }}
                      >
                        {isMaterial ? 'วัตถุดิบ' : 'สินค้า'}
                      </span>
                    </div>
                    <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                      <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
                        {product.title}
                      </p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate">{meta.location || '—'}</span>
                      </div>
                      <div className="mt-auto pt-1 border-t border-gray-50">
                        <div className="flex items-center justify-between min-w-0">
                          <div className="flex items-center gap-0.5 min-w-0">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-gray-700 text-[10px] font-semibold">{meta.rating}</span>
                            <span className="text-gray-400 text-[9px] truncate">({meta.reviews})</span>
                          </div>
                          <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {product.minOrder ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>

              {/* Next arrow — overlaps right edge */}
              <button
                type="button"
                onClick={() => goTo(idx + 1)}
                disabled={idx >= totalDots - 1}
                className="absolute right-0 top-[calc(50%-28px)] translate-x-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>

              {/* Dot indicators */}
              {totalDots > 1 && (
                <div className="flex justify-center gap-1.5 mt-2.5">
                  {Array.from({ length: totalDots }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goTo(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === idx ? 'w-6 bg-[#F28A2E]' : 'w-1.5 bg-gray-300 hover:bg-[#F28A2E]/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function DesktopCategories({
  categories,
  mergedFromApi,
  apiLoading,
  apiError,
  onRetryCategoriesApi,
}: {
  categories: CategoryItem[];
  mergedFromApi: CategoryItem[];
  apiLoading: boolean;
  apiError: string | null;
  onRetryCategoriesApi: () => void;
}) {
  const navigate = useNavigate();

  return (
    <section>
      {apiLoading && (
        <p className="text-sm text-gray-400 mb-3" aria-live="polite">
          กำลังโหลดชื่อหมวดจากฐานข้อมูล…
        </p>
      )}
      {apiError && !apiLoading && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900" role="alert">
          <span>{apiError}</span>
          <button
            type="button"
            onClick={() => void onRetryCategoriesApi()}
            className="ml-2 font-semibold text-[#A238FF] underline hover:no-underline"
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
        {EXPLORE_CATEGORY_TILES.map((cfg) => {
          const Icon = cfg.icon;
          const displayName = exploreDisplayNameForTile(
            cfg.categoryId,
            cfg.fallbackName,
            mergedFromApi,
            categories,
          );
          const href = `/factory-ideas?category_id=${encodeURIComponent(cfg.categoryId)}`;
          return (
            <div
              key={cfg.categoryId}
              role="button"
              tabIndex={0}
              onClick={() => navigate(href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(href);
                }
              }}
              className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-[#A238FF]/40 transition-all cursor-pointer group"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${cfg.color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center group-hover:text-[#2D1B4E]">{displayName}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-8 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5"
        >
          ดูเพิ่มเติม <ChevronRight size={13} />
        </button>
      </div>
    </section>
  );
}

type ShowcaseItem = {
  id: string; title: string; excerpt: string; image: string;
  factoryName: string; factoryId: string; minOrder: number;
  contentType: string;
  category?: string;
  subCategoryName?: string;
};

type ExploreDesktopProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  copiedId: string | null;
  setCopiedId: (v: string | null) => void;
  categories: CategoryItem[];
  exploreCategoriesMerged: CategoryItem[];
  exploreCategoriesLoading: boolean;
  exploreCategoriesError: string | null;
  reloadExploreCategories: () => void;
  factories: FactoryItem[];
  activeRFQs: any[];
  recentOrders: any[];
  ideaArticles: IdeaArticleItem[];
  factoryShowcases: ShowcaseItem[];
  exploreProducts: ShowcaseItem[];
  explorePromotions: ShowcaseItem[];
  exploreMatrials?: ShowcaseItem[];
  explorePromoCodes: unknown[];
  promoSlides: unknown[];
};

export function ExploreDesktop({
  searchText,
  setSearchText,
  copiedId,
  setCopiedId,
  categories,
  exploreCategoriesMerged,
  exploreCategoriesLoading,
  exploreCategoriesError,
  reloadExploreCategories,
  factories,
  ideaArticles,
  exploreProducts,
  explorePromotions,
  exploreMatrials,
  promoSlides,
}: ExploreDesktopProps) {
  const navigate = useNavigate();
  const ideaArticlesList = ideaArticles ?? [];

  const productShowcases = useMemo(
    () => (exploreProducts ?? []).slice(0, 8).map((s) => ({
      id: s.id,
      title: s.title,
      price: `MOQ ${s.minOrder}`,
      img: s.image,
      category: s.category,
      subCategoryName: s.subCategoryName,
      factoryId: s.factoryId,
      factoryName: s.factoryName,
      minOrder: s.minOrder,
    })),
    [exploreProducts],
  );

  const promoShowcases = useMemo(
    () => (explorePromotions ?? []).slice(0, 4),
    [explorePromotions],
  );

  const materialShowcases = useMemo(
    () => (exploreMatrials ?? []).slice(0, 8).map((s) => ({
      id: s.id,
      title: s.title,
      price: `MOQ ${s.minOrder}`,
      img: s.image,
      category: s.category,
      subCategoryName: s.subCategoryName,
      factoryId: s.factoryId,
      factoryName: s.factoryName,
      minOrder: s.minOrder,
    })),
    [exploreMatrials],
  );

  // Promo slides จาก API เท่านั้น — ไม่มี fallback
  const desktopPromoSlides = useMemo(() => {
    const slides = Array.isArray(promoSlides) ? promoSlides : [];
    return slides
      .map((r: any) => ({
        id: String(r.slide_id ?? r.id ?? ''),
        title: String(r.title ?? ''),
        subtitle: String(r.subtitle ?? ''),
        code: String(r.code ?? ''),
      }))
      .filter((s) => s.id && s.title);
  }, [promoSlides]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="hidden md:block min-h-screen">
      <div className="px-4 md:px-6 lg:px-8 py-3 lg:py-4 space-y-6 pb-0 w-full mx-auto">

        {/* ═══ 1. Hero Banner ═══ */}
        <section className="relative rounded-2xl overflow-hidden h-[180px] shadow-lg flex items-center" style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}>
          {/* Bright violet diagonal shape */}
          <div className="absolute top-0 right-0 w-[600px] h-full rounded-l-[100px] opacity-70 transform translate-x-32 skew-x-[-15deg]" style={{ background: '#A238FF' }}></div>
          {/* Orange warm glow bottom-right */}
          <div className="absolute -bottom-20 right-20 w-[400px] h-[300px] rounded-full opacity-40 blur-3xl mix-blend-screen" style={{ background: '#FF7A00' }}></div>
          {/* Purple glow accent */}
          <div className="absolute top-10 left-1/3 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ background: '#A238FF' }}></div>

          <div className="relative z-10 px-7 py-4 text-white max-w-2xl">
            <span className="inline-block px-2 py-0.5 mb-1.5 rounded-full text-[10px] font-semibold tracking-wide border backdrop-blur-sm" style={{ background: 'rgba(162,56,255,0.30)', color: '#EBD3FF', borderColor: 'rgba(162,56,255,0.50)' }}>
              READY TO START YOUR PRODUCT?
            </span>
            <h1
              className="mt-[8px] font-brand-display text-[1.5rem] md:text-[1.85rem] font-semibold mb-1.5 leading-[0.96] tracking-[0.01em] drop-shadow-md"
              style={{ textWrap: 'balance' }}
            >
              ค้นหาโรงงานที่ใช่
            </h1>
            <p className="text-xs mb-3 max-w-md font-medium leading-relaxed" style={{ color: '#E2DCE6' }}>
              เริ่มผลิตกับพาร์ตเนอร์ที่เชื่อถือได้
            </p>
            <button
              onClick={() => navigate('/create-rfq')}
              className="text-white text-xs px-4 py-2 rounded-full font-bold transition-all hover:opacity-90 hover:-translate-y-0.5 flex items-center gap-1.5 shadow-lg"
              style={{ background: '#A238FF', boxShadow: '0 8px 24px rgba(162,56,255,0.40)' }}
            >
              เริ่มสร้างคำขอราคา <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* ═══ Search Bar ═══ */}
        <div className="flex gap-2.5">
          <div className="flex-1 flex items-center gap-2.5 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
            <Search size={16} className="text-gray-400 shrink-0" />
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
            className="px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-1.5 text-xs font-medium shrink-0 text-[#A656A0] hover:border-[#A656A0]/30 transition-colors"
          >
            <SlidersHorizontal size={14} />
            ตัวกรอง
          </button>
        </div>

        {/* ═══ 3. โค้ดส่วนลดพิเศษ (Promo Codes) — แสดงเฉพาะเมื่อมีจาก API ═══ */}
        {desktopPromoSlides.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
              <Sparkles className="text-[#F28A2E]" size={16} />
              โค้ดส่วนลดพิเศษ
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {desktopPromoSlides.map((promo) => (
              <div
                key={promo.id}
                className="h-full rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col"
              >
                <div
                  className="relative overflow-hidden p-3.5 text-white h-full flex-1 flex flex-col"
                  style={{ background: 'linear-gradient(135deg, #F28A2E 0%, #F27830 100%)' }}
                >
                  {/* Purple ribbon circle top-right */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30" style={{ background: '#A238FF' }} />
                  <div className="absolute top-0 right-0 w-14 h-14 rounded-full opacity-20 blur-xl" style={{ background: '#A238FF' }} />
                  {/* Cream circle bottom-left */}
                  <div className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full opacity-20" style={{ background: '#FAEBD7' }} />
                  <div className="relative z-10">
                    {/* Purple ribbon badge */}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-1.5" style={{ background: '#A238FF' }}>
                      <Gift className="w-3 h-3 text-white" />
                      <span className="text-[10px] text-white font-semibold tracking-wide">โปรโมชั่นพิเศษ</span>
                    </div>
                    <p className="text-sm font-bold mb-1 leading-tight text-white drop-shadow-sm">{promo.title}</p>
                    <p className="text-[10px] mb-2 leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>{promo.subtitle}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg px-2.5 py-1 border" style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.40)' }}>
                        <span className="text-sm font-mono tracking-widest font-bold text-white">{promo.code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(promo.code, promo.id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 transition-colors text-[12px] font-semibold text-white"
                        style={{ background: '#2D1B4E' }}
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
        )}

        {/* ═══ 4. หมวดหมู่ (Categories) ═══ */}
        <DesktopCategories
          categories={categories}
          mergedFromApi={exploreCategoriesMerged}
          apiLoading={exploreCategoriesLoading}
          apiError={exploreCategoriesError}
          onRetryCategoriesApi={reloadExploreCategories}
        />

        {/* ═══ 5. สินค้าแนะนำ — from factoryShowcases (แบนเนอร์ซ้ายแสดงเสมอ) ═══ */}
        <ProductCarouselSection
          title="สินค้าแนะนำ"
          items={productShowcases}
          bannerImg={'https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=700'}
          bannerText="คุ้มค่า ถูกใจสัตว์เลี้ยง"
          onItemClick={(id) =>
            navigate(`/product-detail?showcase_id=${encodeURIComponent(id)}`)
          }
          getFactoryMeta={(factoryId) => {
            const f = (factories ?? []).find((x) => String(x.id) === String(factoryId ?? ''));
            return {
              location: (f?.location ?? '').trim() || '—',
              rating: Number(f?.rating ?? 0),
              reviews: Number(f?.reviews ?? 0),
            };
          }}
        />

        {/* ═══ 5b. วัตถุดิบแนะนำ ═══ */}
        <ProductCarouselSection
          title="วัตถุดิบแนะนำ"
          theme="material"
          seeMoreHref="/factory-ideas?type=material"
          items={materialShowcases}
          bannerImg={'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=500&h=300&fit=crop'}
          bannerText="วัตถุดิบคุณภาพสูง"
          onItemClick={(id) =>
            navigate(`/product-detail?showcase_id=${encodeURIComponent(id)}`)
          }
          getFactoryMeta={(factoryId) => {
            const f = (factories ?? []).find((x) => String(x.id) === String(factoryId ?? ''));
            return {
              location: (f?.location ?? '').trim() || '—',
              rating: Number(f?.rating ?? 0),
              reviews: Number(f?.reviews ?? 0),
            };
          }}
        />


        {/* ═══ How to Order ═══ */}
        <HowToOrderSection className="mx-0" />

        {/* ═══ 6. โรงงานแนะนำ ═══ */}
        <section className="mt-[40px] rounded-2xl overflow-hidden border border-gray-200 bg-white">
          <div className="relative px-4 py-4 text-center overflow-hidden" style={{ background: 'linear-gradient(120deg, #2D1B4E 0%, #3D2270 40%, #2D1B4E 100%)' }}>

            {/* ── Color-block shapes (cat illustration style) ── */}
            {/* Bright purple diagonal block — right side */}
            <div className="absolute top-0 right-0 h-full w-[45%] opacity-80 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, transparent 30%, #A238FF 100%)', clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }} />
            {/* Orange warm zone — far right */}
            <div className="absolute top-0 right-0 h-full w-[22%] opacity-60 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, #F28A2E 0%, #F27830 100%)', clipPath: 'polygon(40% 0%, 100% 0%, 100% 100%, 0% 100%)' }} />
            {/* Peach soft glow blob — upper right */}
            <div className="absolute -top-6 right-16 w-28 h-28 rounded-full blur-2xl opacity-30 pointer-events-none"
              style={{ background: '#F5C8A0' }} />
            {/* Bright purple glow — left side accent */}
            <div className="absolute -bottom-8 left-12 w-36 h-36 rounded-full blur-3xl opacity-25 pointer-events-none"
              style={{ background: '#A238FF' }} />
            {/* Small orange circle top-left */}
            <div className="absolute top-3 left-8 w-5 h-5 rounded-full opacity-50 pointer-events-none"
              style={{ background: '#F28A2E' }} />
            {/* Small cream dot */}
            <div className="absolute bottom-4 left-24 w-3 h-3 rounded-full opacity-40 pointer-events-none"
              style={{ background: '#FAEBD7' }} />

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-white drop-shadow-md flex items-center justify-center gap-2">
                โรงงานแนะนำ
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-sm" style={{ background: '#F28A2E' }}>
                  <Plus size={12} />
                </span>
              </h2>
              <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(235,211,255,0.90)' }}>
                โรงงานที่ผ่านการยืนยัน พร้อมรับผลิตสินค้าสัตว์เลี้ยงคุณภาพสูง
              </p>
            </div>
          </div>

          {/* --- Body Section --- */}
          <div className="p-3 bg-gradient-to-b from-purple-50/20 to-white">
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
              {(factories ?? []).slice(0, 8).map((factory) => (
                <div
                  key={factory.id}
                  onClick={() => navigate(`/factories/${factory.id}`)}
                  className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={factory.image}
                      alt={factory.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {factory.verified === true && (
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                        <BadgeCheck className="w-3 h-3 text-[#A238FF]" />
                        <span className="text-[10px] font-medium" style={{ color: '#A238FF' }}>ยืนยันแล้ว</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-medium text-[12px] leading-tight text-gray-700 mb-0.5 truncate group-hover:text-[#A238FF] transition-colors">
                        {factory.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-[10px] truncate">{factory.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-gray-700 text-[10px] font-semibold">{factory.rating}</span>
                        <span className="text-gray-400 text-[10px]">({factory.reviews})</span>
                      </div>
                      <span className="text-gray-400 text-[10px]">ขั้นต่ำ {factory.minOrder}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/factory-ideas?type=factory')}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-6 py-1 rounded-md text-[13px] font-medium transition-colors shadow-sm"
              >
                ดูเพิ่มเติม
              </button>
            </div>
          </div>
        </section>

        {/* ═══ 2. โปรโมชันแนะนำ — ORANGE THEME ═══ */}
        <section>
          <div className="mt-[30px] flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
              <Tag className="text-[#F27830]" size={16} />
              โปรโมชันแนะนำ
            </h2>
            <button
              type="button"
              onClick={() => navigate('/factory-ideas?type=promotion')}
              className="text-[#F28A2E] text-xs font-medium hover:text-[#F27830] flex items-center transition-colors"
            >
              ดูเพิ่มเติม <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            {/* Left Banner */}
            <div className="hidden lg:block lg:w-[40%] rounded-xl overflow-hidden relative min-h-[180px] flex-shrink-0 group cursor-pointer shadow-md">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1566575799269-4a58e16f766b?w=600"
                alt="Banner"
                className="w-full h-full object-cover absolute transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#F27830]/48 via-[#F28A2E]/24 to-transparent flex flex-col justify-end p-5">
                <h3 className="text-2xl font-black text-white drop-shadow-md mb-1">บริการ</h3>
                <p className="text-white font-medium text-sm drop-shadow-md mb-3 bg-[#F27830]/65 backdrop-blur-sm self-start px-3 py-1 rounded-full border border-white/25">สำหรับสัตว์เลี้ยงแสนรัก</p>
              </div>
            </div>

            {/* Right Scrollable Cards */}
            <div className="w-full lg:w-[60%] flex gap-3 overflow-x-auto snap-x hide-scrollbar pb-2">
              {promoShowcases.map((item) => (
                <div key={item.id} onClick={() => navigate(`/factory-ideas/promotions/${item.id}`)} className="min-w-[180px] bg-white border border-gray-100 rounded-lg overflow-hidden snap-start shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1 left-1 bg-[#F28A2E] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-wide">
                      โปรโมชัน
                    </div>
                  </div>
                  <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                    <h3 className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">{item.title}</h3>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                      <span className="text-gray-500 text-[10px] truncate">
                        {((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.location ?? '').trim() || '—'}
                      </span>
                    </div>
                    <div className="mt-auto pt-1 border-t border-gray-50">
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-0.5 min-w-0">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                          <span className="text-gray-700 text-[10px] font-semibold">
                            {Number((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.rating ?? 0)}
                          </span>
                          <span className="text-gray-400 text-[9px] truncate">
                            ({Number((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.reviews ?? 0)})
                          </span>
                        </div>
                        <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {item.minOrder ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7. บทความ Idea — GRAY/LIGHT THEME ═══ */}
        <section className="bg-[#F2F2F2] -mx-8 px-8 py-5 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#292259]">บทความ Idea</h2>
            <button
              type="button"
              onClick={() => navigate('/factory-ideas?type=idea')}
              className="text-[#A656A0] text-xs font-medium hover:underline flex items-center"
            >
              ดูทั้งหมด <ChevronRight size={14} />
            </button>
          </div>

          {ideaArticlesList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-6 text-center text-xs text-gray-500">
              ยังไม่มีบทความในขณะนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {ideaArticlesList.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/idea-detail?showcase_id=${article.id}`)}
                  className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-shadow cursor-pointer group min-h-[100px]"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center rounded-full bg-[#F6EEFC] px-2 py-0.5 text-[10px] font-bold text-[#A656A0] uppercase tracking-wide">
                      {article.tag || 'Idea'}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">
                      {article.factoryName}
                    </span>
                  </div>
                  <h3 className="font-bold text-[13px] text-[#292259] mb-1 line-clamp-2 leading-snug group-hover:text-[#A656A0] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[12px] text-gray-500 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">แตะเพื่ออ่านต่อ</span>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-0 shrink-0 tabular-nums text-[9px] active:opacity-70"
                      aria-label="ถูกใจ"
                    >
                      <Heart className="w-2.5 h-2.5 shrink-0" />
                      <span className="text-[10px] leading-none">{Number(article.likes ?? 0)}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
 
      </div>

      {/* ═══ 8. Registration CTA ═══ */}
      <section className="bg-gradient-to-r from-[#F8F5FF] to-[#FAFAFA] rounded-xl overflow-hidden border border-[#A238FF]/30 shadow-sm relative flex flex-col md:flex-row items-center py-5 px-4 md:px-8">
          {/* Background Decoration */}
          <div
            className="absolute inset-y-0 right-0 w-2/3 opacity-40 pointer-events-none"
            style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }}
          >
            <img
              src="https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=700"
              className="w-full h-full object-cover mix-blend-multiply"
              alt=""
            />
          </div>
          <div className="relative z-10 flex-1 text-center md:text-left mb-4 md:mb-0">
            <h2 className="text-xl md:text-2xl font-bold text-[#2D1B4E] mb-1 flex items-center justify-center md:justify-start gap-2">
              ลงทะเบียนข้อมูลธุรกิจกับ <span className="text-[#A238FF]">Tryly</span>
            </h2>
            <p className="text-gray-600 font-medium text-sm md:text-base">
              สร้างเว็บไซต์หน้าร้านได้ง่าย ๆ ฟรี!
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/register/factory')}
              className="w-full sm:w-auto bg-[#A238FF] hover:bg-[#8B2BE2] text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-md text-xs md:text-sm whitespace-nowrap"
            >
              สมัครเลย
            </button>
            <button className="w-full sm:w-auto bg-white border border-[#A238FF] text-[#A238FF] hover:bg-[#F8F5FF] px-6 py-2 rounded-lg font-bold transition-colors text-xs md:text-sm whitespace-nowrap">
              สิทธิประโยชน์มากมาย
            </button>
          </div>
        </section>

      {/* ═══ Footer ═══ */}
      <div className="lg:px-8">
        <ExploreFooter />
      </div>

      {/* Product Tour (floating) */}
      <ProductTour />
    </div>
  );
}
