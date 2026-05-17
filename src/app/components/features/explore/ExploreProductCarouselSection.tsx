import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Leaf, MapPin, ShoppingBag, Star } from 'lucide-react';

import { Button } from '../../ui/button';
import { ImageWithFallback } from '../../shared';

export type ExploreProductCarouselItem = {
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

const CARD_W = 192;
const VISIBLE_CARDS = 4;
const AUTO_SCROLL_INTERVAL = 3500;

type ExploreProductCarouselSectionProps = {
  title: string;
  items: ExploreProductCarouselItem[];
  bannerImg: string;
  bannerText: string;
  onItemClick?: (id: string) => void;
  seeMoreHref?: string;
  theme?: 'product' | 'material';
  getFactoryMeta?: (factoryId?: string) => { location: string; rating: number; reviews: number };
};

export function ExploreProductCarouselSection({
  title,
  items,
  bannerImg,
  onItemClick,
  seeMoreHref = '/factory-ideas?type=product',
  theme = 'product',
  getFactoryMeta,
}: ExploreProductCarouselSectionProps) {
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
    scrollRef.current?.scrollTo({ left: clamped * CARD_W, behavior: 'smooth' });
  }, [hasItems, totalDots]);

  useEffect(() => {
    if (!hasItems || totalDots <= 1) return;
    const timer = setInterval(() => {
      if (isHovered.current) return;
      setIdx((prev) => {
        const next = prev + 1 >= totalDots ? 0 : prev + 1;
        scrollRef.current?.scrollTo({ left: next * CARD_W, behavior: 'smooth' });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [hasItems, totalDots]);

  return (
    <section
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; }}
    >
      <div className="mt-[30px] flex items-center justify-between mb-2.5">
        <h2 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
          {isMaterial
            ? <Leaf className="text-[#059669]" size={16} />
            : <ShoppingBag className="text-[#F28A2E]" size={16} />}
          {title}
        </h2>
        <Button
          variant="unstyled"
          type="button"
          onClick={() => navigate(seeMoreHref)}
          className="text-xs font-medium hover:underline flex items-center gap-0.5 transition-colors"
          style={{ color: isMaterial ? '#059669' : '#A656A0' }}
        >
          ดูเพิ่มเติม <ChevronRight size={14} />
        </Button>
      </div>

      <div className="flex gap-3 items-stretch">
        <div className="w-[150px] flex-shrink-0 rounded-2xl overflow-hidden relative cursor-pointer shadow-md group" style={{ minHeight: 210 }}>
          <ImageWithFallback
            src={bannerImg}
            alt={title}
            className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-5 pointer-events-none" aria-hidden />
        </div>

        <div className="flex-1 relative min-w-0">
          {!hasItems ? (
            <div className="flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-6 text-center">
              <ShoppingBag className="text-[#F28A2E]/50" size={40} />
              <p className="text-sm font-medium text-gray-600">ยังไม่มีสินค้าแนะนำในขณะนี้</p>
              <p className="text-xs text-gray-400 max-w-sm">ลองดูไอเดียสินค้าและโรงงานได้จากลิงก์ด้านล่าง</p>
              <Button
                variant="unstyled"
                type="button"
                onClick={() => navigate('/factory-ideas?type=product')}
                className="mt-1 rounded-full border border-[#A656A0]/40 bg-white px-4 py-2 text-sm font-medium text-[#A656A0] hover:bg-[#F8F5FF] transition-colors"
              >
                ดูสินค้าแนะนำ
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="unstyled"
                type="button"
                onClick={() => goTo(idx - 1)}
                disabled={idx === 0}
                className="absolute left-0 top-[calc(50%-28px)] -translate-x-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </Button>

              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-hidden pb-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {items.map((product) => {
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
                })}
              </div>

              <Button
                variant="unstyled"
                type="button"
                onClick={() => goTo(idx + 1)}
                disabled={idx >= totalDots - 1}
                className="absolute right-0 top-[calc(50%-28px)] translate-x-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </Button>

              {totalDots > 1 && (
                <div className="flex justify-center gap-1.5 mt-2.5">
                  {Array.from({ length: totalDots }).map((_, i) => (
                    <Button
                      variant="unstyled"
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
