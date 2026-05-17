import { useNavigate } from 'react-router';
import { ChevronRight, Leaf, MapPin, ShoppingBag, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/shared';
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

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

  return (
    <section>
      <div className='mt-[30px] flex items-center justify-between mb-2.5'>
        <h2 className='text-base font-bold text-brand-navy-ink flex items-center gap-1.5'>
          {isMaterial ? (
            <Leaf className='text-status-success' size={16} />
          ) : (
            <ShoppingBag className='text-brand-orange' size={16} />
          )}
          {title}
        </h2>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(seeMoreHref)}
          className='text-xs font-medium hover:underline flex items-center gap-0.5 transition-colors'
          style={{ color: isMaterial ? 'var(--status-success)' : 'var(--brand-magenta)' }}
        >
          ดูเพิ่มเติม <ChevronRight size={14} />
        </Button>
      </div>

      <div className='flex gap-3 items-stretch'>
        <div
          className='w-[150px] flex-shrink-0 rounded-2xl overflow-hidden relative cursor-pointer shadow-md group'
          style={{ minHeight: 210 }}
        >
          <ImageWithFallback
            src={bannerImg}
            alt={title}
            className='absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105'
          />
          <div
            className='absolute inset-0 flex flex-col justify-end p-5 pointer-events-none'
            aria-hidden
          />
        </div>

        <div className='flex-1 relative min-w-0'>
          {!hasItems ? (
            <div className='flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-6 text-center'>
              <ShoppingBag className='text-brand-orange/50' size={40} />
              <p className='text-sm font-medium text-gray-600'>ยังไม่มีสินค้าแนะนำในขณะนี้</p>
              <p className='text-xs text-gray-400 max-w-sm'>
                ลองดูไอเดียสินค้าและโรงงานได้จากลิงก์ด้านล่าง
              </p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate('/factory-ideas?type=product')}
                className='mt-1 rounded-full border border-brand-magenta/40 bg-white px-4 py-2 text-sm font-medium text-brand-magenta hover:bg-brand-panel-hover transition-colors'
              >
                ดูสินค้าแนะนำ
              </Button>
            </div>
          ) : (
            <>
              <Carousel
                options={{ align: 'start', containScroll: 'trimSnaps' }}
                autoPlayMs={AUTO_SCROLL_INTERVAL}
              >
                <CarouselPrevious className='top-[calc(50%-28px)]' />
                <CarouselContent className='gap-3 pb-1'>
                  {items.map((product) => {
                    const meta = getFactoryMeta?.(product.factoryId) ?? {
                      location: '—',
                      rating: 0,
                      reviews: 0,
                    };
                    return (
                      <CarouselItem key={product.id} className='basis-[180px]'>
                        <div
                          role='button'
                          tabIndex={0}
                          onClick={() => onItemClick?.(product.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onItemClick?.(product.id);
                            }
                          }}
                          className='h-full bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col'
                        >
                          <div className='aspect-[4/3] relative overflow-hidden bg-gray-100'>
                            <ImageWithFallback
                              src={product.img}
                              alt={product.title}
                              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                            />
                            <span
                              className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white ${
                                isMaterial ? 'bg-brand-teal-light' : 'bg-brand-sky'
                              }`}
                            >
                              {isMaterial ? 'วัตถุดิบ' : 'สินค้า'}
                            </span>
                          </div>
                          <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                            <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                              {product.title}
                            </p>
                            <div className='flex items-center gap-0.5 mt-0.5'>
                              <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                              <span className='text-gray-500 text-[10px] truncate'>
                                {meta.location || '—'}
                              </span>
                            </div>
                            <div className='mt-auto pt-1 border-t border-gray-50'>
                              <div className='flex items-center justify-between min-w-0'>
                                <div className='flex items-center gap-0.5 min-w-0'>
                                  <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                                  <span className='text-gray-700 text-[10px] font-semibold'>
                                    {meta.rating}
                                  </span>
                                  <span className='text-gray-400 text-[9px] truncate'>
                                    ({meta.reviews})
                                  </span>
                                </div>
                                <span className='text-gray-400 text-[8px] shrink-0'>
                                  ขั้นต่ำ {product.minOrder ?? 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselNext className='top-[calc(50%-28px)]' />
                <CarouselDots className='mt-2.5' />
              </Carousel>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
