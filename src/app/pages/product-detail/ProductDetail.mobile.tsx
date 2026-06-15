import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@lib/utils';
import {
  SHOWCASE_DETAIL_BRAND as BRAND,
  SHOWCASE_DETAIL_DATA_TEXT_CLASS,
  SHOWCASE_DETAIL_EMPHASIS_CLASS,
  SHOWCASE_DETAIL_META_TEXT_CLASS,
  SHOWCASE_DETAIL_TITLE_CLASS,
  SHOWCASE_SECTION_HEADER_TITLE_CLASS,
  formatShowcaseTHB as formatTHB,
  formatShowcaseThaiDate as formatThaiDate,
  normalizeShowcaseMarkdown as normalizeMarkdownContent,
} from '@/components/features/showcase-detail/showcaseDetailShared';
import { useNavigate } from 'react-router';
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
import { useProductDetailShowcase } from '@/hooks/useProductDetailShowcase';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ProductDetailSkeleton } from '@/components/skeletons/PageSkeletons';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { mobileShowcaseDetailPaddingBottom, useScrollPast } from '@/hooks/useMobileBottomNavHide';
import { ShowcaseDetailMobileActionBar } from '@/components/features/showcase-detail/ShowcaseDetailMobileActionBar';
import { ShowcaseDetailMobileScrollHeader } from '@/components/features/showcase-detail/ShowcaseDetailMobileScrollHeader';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { useFavorites } from '@/hooks/useFavorites';
import { StrictSpecsBlock } from '@/shared/ui/StrictSpecsBlock/StrictSpecsBlock';
import { Image } from '@/components/ui/image';
import useEmblaCarousel from 'embla-carousel-react';

const SECTION_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-wider text-gray-400';
const SECTION_TITLE_CLASS = 'text-[14px] font-semibold text-[var(--brand-navy-ink)]';

function StarRatingDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconClass = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3';
  return (
    <div className='flex items-center gap-0.5' aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconClass,
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-100 text-gray-200',
          )}
        />
      ))}
    </div>
  );
}

export function ProductDetailMobile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const data = useData();
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
  const breakdown = reviews?.summary.breakdown ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const latestReviews = reviews?.items ?? [];

  const specRows: { label: string; value: string }[] = [];
  const leadTimeDays = Number(String(item.leadTime ?? '').replace(/[^\d.]/g, ''));
  if (factory?.location) specRows.push({ label: 'สถานที่ผลิต', value: factory.location });
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

      <div className='bg-white px-4 pt-5 pb-5'>
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

        <div className='flex items-center gap-3 mt-3 text-[12px] text-gray-500'>
          <span className='inline-flex items-center gap-1'>
            <span className='border-b' style={{ color: BRAND.orange, borderColor: BRAND.orange }}>
              {avgRating.toFixed(1)}
            </span>
            <Star className='w-3 h-3 fill-current' style={{ color: BRAND.orange }} />
          </span>
          <span>{reviewCount} รีวิว</span>
          <span>•</span>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void toggleFavorite(item.id)}
            className='inline-flex items-center gap-1 active:opacity-70'
          >
            <Heart
              className='w-3 h-3'
              style={
                liked
                  ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' }
                  : { color: BRAND.orange }
              }
            />
            <span className='text-[12px]'>{likeCount}</span>
            <span className='text-[12px]'>สนใจ</span>
          </Button>
        </div>
      </div>

      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />

      {item.tags.length > 0 ? (
        <>
          <div className='bg-white px-4 py-3'>
            <p className='text-[14px] font-semibold mb-2' style={{ color: BRAND.ink }}>
              แท็กสินค้า
            </p>
            <div className='flex flex-wrap gap-1.5'>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className='inline-flex items-center px-2 py-1 rounded-sm text-[12px] font-medium'
                  style={{ background: BRAND.purpleSoft, color: BRAND.purple }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />

      <div className='bg-white px-4 py-3'>
        <p className={cn('mb-2', SHOWCASE_SECTION_HEADER_TITLE_CLASS)} style={{ color: BRAND.ink }}>
          ข้อมูลจำเพาะของสินค้า
        </p>
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
              className='flex items-start justify-between py-2 gap-3'
              style={idx > 0 ? { borderTop: `1px solid ${BRAND.border}` } : undefined}
            >
              <span className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'text-gray-500 w-32 shrink-0')}>
                {row.label}
              </span>
              <span
                className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'text-right flex-1')}
                style={{ color: BRAND.ink }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />
      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />

      <div className='bg-white px-4 py-3'>
        <p className={cn('mb-2', SHOWCASE_SECTION_HEADER_TITLE_CLASS)} style={{ color: BRAND.ink }}>
          รายละเอียดสินค้า
        </p>
        {markdown ? (
          <MarkdownBody source={markdown} typography='showcase-detail' />
        ) : (
          <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'text-gray-400')}>
            ยังไม่มีรายละเอียดเพิ่มเติม
          </p>
        )}
      </div>

      <div className='h-2' style={{ background: 'var(--brand-panel)' }} />

      <div className='bg-white px-4 py-4'>
        <p className={SECTION_EYEBROW_CLASS}>โรงงานผู้ผลิต</p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(`/factories/${item.factoryId}`)}
          className='group -mx-1 mt-2 flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left active:bg-gray-50/80'
        >
          <div
            className={`relative block size-14 shrink-0 overflow-hidden rounded-lg border aspect-square ${
              factory?.image ? 'border-gray-100' : 'border-dashed border-indigo-200 bg-violet-50'
            }`}
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
                <span className='text-[8px] font-semibold leading-tight text-indigo-600'>โปรไฟล์</span>
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

        <div className='mt-1 border-t border-gray-50 pt-5'>
          <header className='mb-4'>
            <p className={SECTION_EYEBROW_CLASS}>ความคิดเห็น</p>
            <h2 className={cn(SECTION_TITLE_CLASS, 'mt-0.5')}>คะแนนรีวิว</h2>
          </header>

          <div className='flex items-start gap-3'>
            <div className='flex shrink-0 flex-col items-center rounded-xl bg-[var(--brand-page)] px-5 py-3.5'>
              <p className='text-[32px] font-bold leading-none tabular-nums tracking-tight text-[var(--brand-ink)]'>
                {avgRating.toFixed(1)}
              </p>
              <div className='mt-2'>
                <StarRatingDisplay rating={avgRating} />
              </div>
              <p className='mt-1.5 text-[11px] text-gray-500'>{reviewCount} รีวิว</p>
            </div>

            <div className='min-w-0 flex-1 space-y-1.5 pt-1'>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = Number(breakdown[String(star)] ?? 0);
                const intensity =
                  reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
                return (
                  <div key={star} className='flex items-center gap-2'>
                    <span className='w-2.5 shrink-0 text-[11px] tabular-nums text-gray-400'>{star}</span>
                    <Star className='h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400' />
                    <div className='h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100'>
                      <div
                        className='h-full rounded-full bg-amber-400 transition-all duration-500'
                        style={{ width: `${intensity}%` }}
                      />
                    </div>
                    <span className='w-4 shrink-0 text-right text-[10px] tabular-nums text-gray-400'>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='mt-1 border-t border-gray-50 pt-4'>
          <p className='mb-3 text-[12px] font-medium text-gray-500'>รีวิวล่าสุด</p>
          {latestReviews.length === 0 ? (
            <p className='py-4 text-center text-[12px] text-gray-400'>ยังไม่มีรีวิวจากลูกค้า</p>
          ) : (
            <ul className='divide-y divide-gray-50'>
              {latestReviews.slice(0, 2).map((r) => (
                <li key={r.id} className='py-3.5 first:pt-0 last:pb-0'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='truncate text-[13px] font-semibold text-gray-800'>{r.reviewer}</p>
                      <div className='mt-1'>
                        <StarRatingDisplay rating={Number(r.rating || 0)} />
                      </div>
                    </div>
                    <span className='shrink-0 text-[12px] font-semibold tabular-nums text-amber-600'>
                      {Number(r.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className='mt-2 text-[13px] leading-relaxed text-gray-600'>
                    {r.comment || '—'}
                  </p>
                  {r.imageUrls && r.imageUrls.length > 0 ? (
                    <div className='mt-2'>
                      <ReviewImageAttachments
                        urls={r.imageUrls}
                        onPreviewUrl={(u) => openImageLightbox(u)}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>
      </div>

      <>
        <div className='h-2' style={{ background: 'var(--brand-panel)' }} />
        <div className='h-2' style={{ background: 'var(--brand-panel)' }} />
        <div className='bg-white px-4 py-3'>
          <div className='flex items-center justify-between mb-2'>
            <p className={cn(SHOWCASE_SECTION_HEADER_TITLE_CLASS)} style={{ color: BRAND.ink }}>
              สินค้าที่ใกล้เคียง
            </p>
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
                  <Button
                    variant='unstyled'
                    key={rp.id}
                    type='button'
                    onClick={() =>
                      navigate(
                        `/${isPromo ? 'promotion-detail' : 'product-detail'}?showcase_id=${rp.id}`,
                      )
                    }
                    className='bg-white rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-gray-300 transition-all group flex flex-col h-full w-full text-left active:scale-[0.98]'
                  >
                    <div className='relative aspect-[4/3] overflow-hidden bg-gray-100 shrink-0'>
                      <ImageWithFallback
                        src={rp.image}
                        alt={rp.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                      />
                      <span
                        className='absolute top-1 left-1 z-[1] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white'
                        style={{ backgroundColor: BRAND.orange }}
                      >
                        {isPromo ? 'โปรโมชัน' : 'สินค้า'}
                      </span>
                    </div>
                    <div className='p-2 flex flex-col flex-1 justify-between gap-0.5 min-w-0'>
                      <div>
                        <h3 className='mb-0.5 truncate text-xs font-medium leading-tight text-gray-700 transition-colors group-hover:text-brand-purple'>
                          {rp.title}
                        </h3>
                        <div className='mt-0.5 flex items-center gap-0.5'>
                          <MapPin className='h-2.5 w-2.5 shrink-0 text-gray-400' />
                          <span className='truncate text-[10px] text-gray-500'>
                            {province || '—'}
                          </span>
                        </div>
                      </div>
                      <div className='mt-auto pt-1 border-t border-gray-50'>
                        <div className='flex items-center justify-between min-w-0'>
                          <div className='flex items-center gap-0.5 min-w-0'>
                            <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                            <span className='text-[10px] font-semibold text-gray-700'>
                              {rating}
                            </span>
                            <span className='truncate text-[10px] text-gray-400'>({reviews})</span>
                          </div>
                          <span className='shrink-0 text-[8px] text-gray-400'>
                            ขั้นต่ำ {rp.minOrder}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className='text-center text-[12px] text-gray-400 py-4'>
              ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้
            </p>
          )}
        </div>
      </>

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
