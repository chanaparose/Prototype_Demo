import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@lib/utils';
import {
  SHOWCASE_DETAIL_BRAND as BRAND,
  SHOWCASE_DETAIL_DATA_TEXT_CLASS,
  SHOWCASE_DETAIL_EMPHASIS_CLASS,
  SHOWCASE_DETAIL_META_TEXT_CLASS,
  SHOWCASE_DETAIL_TITLE_CLASS,
  formatShowcaseTHB as formatTHB,
  formatShowcaseThaiDate as formatThaiDate,
  normalizeShowcaseMarkdown as normalizeMarkdownContent,
} from '@/components/features/showcase-detail/showcaseDetailShared';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight as Chevron,
  Heart,
  ImageIcon,
  MapPin,
  Share2,
  Star,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseCard } from '@/components/shared/ShowcaseCard';
import { useProductDetailShowcase } from '@/hooks/useProductDetailShowcase';
import { ReviewPreviewSection } from '@/components/features/reviews/ReviewPreviewSection';
import {
  getProductReviewsBrowsePath,
  normalizeShowcaseReview,
} from '@/components/features/reviews/reviewBrowseUtils';
import { ProductDetailSkeleton } from '@/components/skeletons/PageSkeletons';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { mobileShowcaseDetailPaddingBottom, useScrollPast } from '@/hooks/useMobileBottomNavHide';
import { ShowcaseDetailMobileActionBar } from '@/components/features/showcase-detail/ShowcaseDetailMobileActionBar';
import { ShowcaseDetailMobileScrollHeader } from '@/components/features/showcase-detail/ShowcaseDetailMobileScrollHeader';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { useShallow } from 'zustand/react/shallow';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { useFavorites } from '@/hooks/useFavorites';
import { StrictSpecsBlock } from '@/shared/ui/StrictSpecsBlock/StrictSpecsBlock';
import { Image } from '@/components/ui/image';
import useEmblaCarousel from 'embla-carousel-react';

const SECTION_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-wider text-gray-400';
const SECTION_TITLE_CLASS = 'text-[14px] font-semibold text-[var(--brand-navy-ink)]';

type ProductDetailTab = 'content' | 'reviews';

const PRODUCT_DETAIL_TABS: { id: ProductDetailTab; label: string }[] = [
  { id: 'content', label: 'เนื้อหา' },
  { id: 'reviews', label: 'รีวิว' },
];

export function ProductDetailMobile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const data = useData(useShallow((s) => ({ factories: s.factories })));
  const {
    item,
    moqUnit,
    loading,
    error,
    factory,
    reviews,
    isIdea,
    isMaterial,
    resolvedId,
    relatedProducts,
  } = useProductDetailShowcase();
  const { isLiked, toggleFavorite } = useFavorites();

  const gallery = useMemo(() => {
    const urls = Array.isArray(item?.imageUrls)
      ? item.imageUrls.filter((u) => String(u).trim() !== '')
      : [];
    if (urls.length > 0) return urls.slice(0, 8);
    return item?.image ? [item.image] : [];
  }, [item?.image, item?.imageUrls]);

  const [activeImage, setActiveImage] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductDetailTab>('content');
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  useEffect(() => {
    if (emblaApi) emblaApi.scrollTo(activeImage);
  }, [activeImage, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setActiveImage(emblaApi.selectedScrollSnap());
    };
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const scrollNavVisible = useScrollPast(160);

  useEffect(() => {
    history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    setTransitioning(true);
    setActiveImage(0);
    setActiveTab('content');
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => setTransitioning(false), 250);
    return () => clearTimeout(t);
  }, [resolvedId]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!item || !resolvedId) {
    return (
      <div className='px-4 pt-5 pb-20'>
        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          className='mb-4 inline-flex items-center gap-1 text-sm'
          style={{ color: BRAND.purple }}
        >
          <ArrowLeft className='w-4 h-4' /> กลับ
        </Button>
        <div className='rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500'>
          {error ?? 'ไม่พบข้อมูลสินค้า'}
        </div>
      </div>
    );
  }

  const subName = item.sub_category_name?.trim() ?? null;
  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'PD',
      id: Number(resolvedId),
      title: item.title,
    });

  const markdown = normalizeMarkdownContent(item.content || item.excerpt || '');
  const priceText = formatTHB(item.basePrice) ?? (item.priceRange?.trim() || null);
  const liked = item ? isLiked(item.id) : false;
  const likeCount = item ? item.likes + (liked ? 1 : 0) : 0;
  const avgRating = Number(reviews?.summary.average ?? factory?.rating ?? 0);
  const reviewCount = Number(reviews?.summary.total ?? factory?.reviews ?? 0);
  const browseReviews = (reviews?.items ?? []).map(normalizeShowcaseReview);

  const specRows: { label: string; value: string }[] = [];
  const leadTimeDays = Number(String(item.leadTime ?? '').replace(/[^\d.]/g, ''));
  
  if (Array.isArray(item.specs) && item.specs.length > 0) {
    const sorted = [...item.specs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const s of sorted) {
      const label = String(s.spec_key ?? '').trim();
      const value = String(s.spec_value ?? '').trim();
      if (label && value) specRows.push({ label, value });
    }
  }

  if (transitioning) {
    return <ProductDetailSkeleton />;
  }

  return (
    <div
      className='min-h-screen bg-brand-panel animate-[fadeIn_0.2s_ease-in]'
      style={{ paddingBottom: mobileShowcaseDetailPaddingBottom() }}
    >
      <ShowcaseDetailMobileScrollHeader
        title={item.title}
        onBack={handleBack}
        revealAt={160}
        liked={liked}
        likeCount={likeCount}
        onToggleFavorite={() => void toggleFavorite(item.id)}
        factoryId={item.factoryId}
        canChat={canChat}
        onChat={handleStartChat}
        chatStarting={starting}
        searchType={isMaterial ? 'material' : 'product'}
      />

      <div className='relative w-full aspect-[4/3] bg-white overflow-hidden'>
        <div className='absolute inset-0 overflow-hidden' ref={emblaRef}>
          <div className='flex h-full'>
            {gallery.map((url, idx) => (
              <div key={idx} className='relative flex-[0_0_100%] h-full flex items-center justify-center min-w-0'>
                <div className='relative h-full max-h-full max-w-full aspect-square'>
                  <ImageWithFallback
                    src={url}
                    alt={`${item.title} ${idx + 1}`}
                    className='absolute inset-0 h-full w-full object-cover pointer-events-none'
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          className={cn(
            'absolute top-3 left-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200',
            scrollNavVisible && 'pointer-events-none opacity-0',
          )}
          aria-label='กลับ'
        >
          <ArrowLeft className='w-5 h-5 text-white' />
        </Button>
        <Button
          variant='unstyled'
          type='button'
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200',
            scrollNavVisible && 'pointer-events-none opacity-0',
          )}
          aria-label='แชร์'
            onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              void navigator.share({ title: item.title, url: window.location.href });
            } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
              void navigator.clipboard.writeText(window.location.href);
            }
          }}
        >
          <Share2 className='w-4 h-4 text-white' />
        </Button>

        {gallery.length > 1 ? (
          <span className='absolute bottom-3 right-3 text-[12px] font-semibold text-white bg-black/45 px-2 py-0.5 rounded-full tabular-nums'>
            {activeImage + 1} / {gallery.length}
          </span>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <div className='bg-white px-3 py-2 border-b' style={{ borderColor: BRAND.border }}>
          <div className='flex gap-2 overflow-x-auto'>
            {gallery.map((url, idx) => {
              const active = idx === activeImage;
              return (
                <Button
                  variant='unstyled'
                  key={`${url}-${idx}`}
                  type='button'
                  onClick={() => setActiveImage(idx)}
                  className='shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors'
                  style={{ borderColor: active ? BRAND.orange : BRAND.border }}
                >
                  <Image src={url} alt='' className='w-full h-full object-cover' />
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className='bg-white px-4 pt-5 pb-1'>
        <div className='flex flex-wrap items-center gap-1.5'>
          {factory?.verified ? (
            <span
              className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold text-white'
              style={{ background: BRAND.orange }}
            >
              <BadgeCheck className='w-2.5 h-2.5' /> Preferred
            </span>
          ) : null}
          <span
            className='inline-flex items-center px-1.5 py-0.5 rounded-sm text-[12px] font-semibold text-white'
            style={{
              background: isIdea
                ? BRAND.purple
                : isMaterial
                  ? 'var(--status-success)'
                  : BRAND.orange,
            }}
          >
            {isIdea ? 'ไอเดีย' : isMaterial ? 'วัตถุดิบ' : 'สินค้า'}
          </span>
          {item.category ? (
            <span className='text-[12px] text-gray-500'>
              {item.category}{subName && !isMaterial ? ` > ${subName}` : ''}
            </span>
          ) : null}
        </div>

        <h1 className={cn('mt-3', SHOWCASE_DETAIL_TITLE_CLASS)} style={{ color: BRAND.ink }}>
          {item.title}
        </h1>

        <div className='mt-3 rounded-xl border border-[#F8DEC1] bg-[var(--surface-paper-warm)] px-3 py-2'>
          {priceText ? (
            <div className='flex items-baseline gap-2'>
              <p className={SHOWCASE_DETAIL_EMPHASIS_CLASS}>
                {priceText}
              </p>
              {item.promoPrice && item.basePrice && item.promoPrice < item.basePrice ? (
                <p className='text-[12px] line-through text-gray-400'>{formatTHB(item.basePrice)}</p>
              ) : null}
            </div>
          ) : (
            <p className={cn(SHOWCASE_DETAIL_EMPHASIS_CLASS, 'font-semibold')}>
              สอบถามราคากับโรงงาน
            </p>
          )}
          <p className='text-[12px] text-gray-500 mt-1'>
            ราคาต่อชิ้นอาจแตกต่างตามปริมาณสั่งผลิต กรุณาแชทเพื่อขอใบเสนอราคา
          </p>
        </div>
      </div> 
 
      <article className='bg-white'>
        <div className='px-4 py-3'>
          <div className='divide-y' style={{ borderColor: BRAND.border }}>
            <StrictSpecsBlock
              showcase={{
                moq: Number.isFinite(Number(item.minOrder)) ? Number(item.minOrder) : null,
                moq_unit: moqUnit,
                lead_time_days:
                  Number.isFinite(leadTimeDays) && leadTimeDays > 0 ? leadTimeDays : null,
              }}
            />
            {specRows.map((row, idx) => (
              <div
                key={`${row.label}-${idx}`}
                className='flex items-start justify-between gap-3 py-2'
                style={idx > 0 ? { borderTop: `1px solid ${BRAND.border}` } : undefined}
              >
                <span className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'w-32 shrink-0 text-gray-500')}>
                  {row.label}
                </span>
                <span
                  className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'flex-1 text-right')}
                  style={{ color: BRAND.ink }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className='mt-4 border-t border-gray-100 pt-4'>
            <p className={SECTION_EYEBROW_CLASS}>โรงงานผู้ผลิต</p>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate(`/factories/${item.factoryId}`)}
              className='group -mx-1 mt-2 flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left active:bg-gray-50/80'
            >
              <div
                className={cn(
                  'relative block size-14 shrink-0 overflow-hidden rounded-lg border aspect-square',
                  factory?.image ? 'border-gray-100' : 'border-dashed border-indigo-200 bg-violet-50',
                )}
              >
                {factory?.image ? (
                  <ImageWithFallback
                    src={factory.image}
                    alt={item.factoryName}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <span className='flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-center'>
                    <ImageIcon size={20} className='text-indigo-400' strokeWidth={1.5} />
                    <span className='text-[8px] font-semibold leading-tight text-indigo-600'>
                      โปรไฟล์
                    </span>
                  </span>
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1'>
                  <p className={cn('truncate', SECTION_TITLE_CLASS)}>{item.factoryName}</p>
                  {factory?.verified ? (
                    <BadgeCheck className='h-3.5 w-3.5 shrink-0 text-[var(--brand-purple)]' />
                  ) : null}
                </div>
                <div className='mt-1 flex items-center gap-2 text-[12px] text-gray-500'>
                  <span className='inline-flex items-center gap-0.5'>
                    <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
                    <span className='font-semibold text-gray-800'>{avgRating.toFixed(1)}</span>
                  </span>
                  <span className='text-gray-300'>·</span>
                  <span
                    role='button'
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void toggleFavorite(item.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        void toggleFavorite(item.id);
                      }
                    }}
                    className='inline-flex items-center gap-1 active:opacity-70'
                  >
                    <Heart
                      className='h-3 w-3'
                      style={
                        liked
                          ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' }
                          : { color: BRAND.orange }
                      }
                    />
                    <span>{likeCount}</span>
                    <span>สนใจ</span>
                  </span>
                  {factory?.location ? (
                    <>
                      <span className='text-gray-300'>·</span>
                      <span className='inline-flex min-w-0 items-center gap-0.5 truncate'>
                        <MapPin className='h-3 w-3 shrink-0' />
                        {factory.location}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <Chevron className='h-4 w-4 shrink-0 text-gray-300 transition-transform group-active:translate-x-0.5' />
            </Button>
          </div>
        </div>

        <div
          role='tablist'
          aria-label='รายละเอียดสินค้า'
          className='grid grid-cols-2 border-y border-gray-100 bg-white'
        >
          {PRODUCT_DETAIL_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'reviews' ? reviewCount : null;
            return (
              <button
                key={tab.id}
                type='button'
                role='tab'
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex min-w-0 items-center justify-center gap-1 px-2 py-3 text-[12px] font-semibold transition-colors',
                  isActive ? 'text-brand-navy-ink' : 'text-slate-400',
                )}
              >
                <span className='truncate'>{tab.label}</span>
                {typeof count === 'number' && count > 0 ? (
                  <span
                    className={cn(
                      'inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                      isActive
                        ? 'bg-brand-violet-soft text-brand-purple'
                        : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
                {isActive ? (
                  <span className='absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-purple' />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className='px-4 py-3'>
          {activeTab === 'content' ? (
            markdown ? (
              <MarkdownBody source={markdown} typography='showcase-detail' />
            ) : (
              <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'text-gray-400')}>
                ยังไม่มีรายละเอียดเพิ่มเติม
              </p>
            )
          ) : null}

          {activeTab === 'reviews' ? (
            <ReviewPreviewSection
              reviews={browseReviews}
              previewLimit={4}
              onViewAll={
                resolvedId
                  ? () => navigate(getProductReviewsBrowsePath(resolvedId, location.pathname))
                  : undefined
              }
              footerNote='การรีวิวทำผ่านหน้าออเดอร์ที่เสร็จสมบูรณ์แล้วเท่านั้น เพื่อป้องกันรีวิวปลอมและรีวิวซ้ำ'
            />
          ) : null}
        </div>
      </article>

      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />
      <div className='bg-white px-4 py-3'>
        <div className='mb-2 flex items-center justify-between'>
          <p className={cn('font-normal', SHOWCASE_DETAIL_META_TEXT_CLASS)}>สินค้าที่ใกล้เคียง</p>
        </div>
          {relatedProducts.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
              {relatedProducts.map((rp) => {
                const rf = data.factories.find((f) => f.id === rp.factoryId);
                const rating = Number(rf?.rating ?? rp.factoryRating ?? 0);
                const reviews = Number(rf?.reviews ?? 0);
                const province = (rf?.provinceName ?? rf?.location ?? rp.location ?? '').trim();
                const isPromo = rp.contentType === 'promotion';
                return (
                  <ShowcaseCard
                    key={rp.id}
                    image={rp.image}
                    title={rp.title}
                    location={province}
                    rating={rating}
                    reviewsCount={reviews}
                    moqLabel={`ขั้นต่ำ ${rp.minOrder}`}
                    badge={{ label: isPromo ? 'โปรโมชัน' : 'สินค้า', color: BRAND.orange }}
                    onClick={() =>
                      navigate(
                        `/${isPromo ? 'promotion-detail' : 'product-detail'}?showcase_id=${rp.id}`,
                      )
                    }
                  />
                );
              })}
            </div>
          ) : (
            <p className='text-center text-[12px] text-gray-400 py-4'>
              ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้
            </p>
          )}
      </div>

      <ShowcaseDetailMobileActionBar
        factoryId={item.factoryId}
        liked={liked}
        likeCount={likeCount}
        canChat={canChat}
        starting={starting}
        onToggleFavorite={() => void toggleFavorite(item.id)}
        onChat={handleStartChat}
      />
    </div>
  );
}
