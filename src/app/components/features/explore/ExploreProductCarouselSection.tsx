import { useNavigate } from 'react-router';
import { ChevronRight, Leaf, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseCard } from '@/components/shared/ShowcaseCard';
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
  minOrderUnit?: string;
  factoryRating?: number;
  location?: string;
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
  getFactoryMeta?: (factoryId?: string) => { location: string };
  isLiked?: (id: string | number) => boolean;
  onToggleFavorite?: (id: string | number) => void;
};

export function ExploreProductCarouselSection({
  title,
  items,
  bannerImg,
  onItemClick,
  seeMoreHref = '/factory-ideas?type=product',
  theme = 'product',
  getFactoryMeta,
  isLiked,
  onToggleFavorite,
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
          style={{ color: isMaterial ? 'var(--status-success)' : 'var(--brand-orange)' }}
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
                    const locationLabel =
                      (product.location ?? getFactoryMeta?.(product.factoryId)?.location ?? '').trim() ||
                      '—';
                    return (
                      <CarouselItem key={product.id} className='basis-[180px]'>
                        <ShowcaseCard
                          image={product.img}
                          title={product.title}
                          priceLabel={product.price || undefined}
                          location={locationLabel}
                          moqLabel={`ขั้นต่ำ ${product.minOrder ?? 0} ${product.minOrderUnit ?? ''}`.trim()}
                          badge={{
                            label: isMaterial ? 'วัตถุดิบ' : 'สินค้า',
                            color: isMaterial ? 'var(--status-success)' : 'var(--brand-orange)',
                          }}
                          heart={
                            isLiked && onToggleFavorite
                              ? {
                                  showcaseId: product.id,
                                  isLiked: isLiked(product.id),
                                  onToggle: onToggleFavorite,
                                }
                              : undefined
                          }
                          onClick={() => onItemClick?.(product.id)}
                          className='h-full'
                        />
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
