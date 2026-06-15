import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@lib/utils';
import {
  SHOWCASE_DETAIL_BRAND as BRAND,
  SHOWCASE_DETAIL_DATA_TEXT_CLASS,
  SHOWCASE_DETAIL_EMPHASIS_CLASS,
  SHOWCASE_DETAIL_META_TEXT_CLASS,
  SHOWCASE_DETAIL_TITLE_CLASS,
  SHOWCASE_SECTION_HEADER_CLASS,
  SHOWCASE_SECTION_HEADER_TITLE_CLASS,
  formatShowcaseTHB as formatTHB,
  formatShowcaseThaiDate as formatThaiDate,
  normalizeShowcaseMarkdown as normalizeMarkdownContent,
} from '@/components/features/showcase-detail/showcaseDetailShared';
import { ShowcaseHeroGallery } from '@/components/features/showcase-detail/ShowcaseHeroGallery';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight as Chevron,
  Heart,
  ImageIcon,
  PackageX,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Store,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { useProductDetailShowcase } from '@/hooks/useProductDetailShowcase';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { useFavorites } from '@/hooks/useFavorites';
import { ShowcaseGridCard } from '@/components/features/factory-ideas/ShowcaseGridCard';
import { getFactoryIdeaDetailPath } from '@/components/features/factory-ideas/factoryIdeasTheme';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ProductDetailDesktop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
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

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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

  if (loading || transitioning) {
    return (
      <div className='hidden min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F5F3FF] lg:flex'>
        <span
          className='h-10 w-10 animate-spin rounded-full border-2 border-purple-600 border-t-transparent'
          aria-hidden
        />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className='hidden min-h-[calc(100vh-4rem)] bg-[#F5F3FF] px-8 pb-20 pt-8 lg:block'>
        <div className={cn('mb-5 flex items-center gap-2 text-gray-500', SHOWCASE_DETAIL_DATA_TEXT_CLASS)}>
          <Button
            variant='unstyled'
            type='button'
            onClick={handleBack}
            aria-label='กลับไปหน้าก่อนหน้า'
            className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50'
          >
            <ArrowLeft className='h-3.5 w-3.5' />
          </Button>
          <span>สินค้า</span>
        </div>
        <div className='bg-white rounded-lg border border-gray-200 p-10 text-center'>
          <PackageX size={38} className='mx-auto mb-3 text-gray-400' />
          <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'font-medium text-gray-500')}>{error || 'ไม่พบข้อมูลสินค้า'}</p>
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

  const specRows: { label: string; value: React.ReactNode }[] = [];
  if (Array.isArray(item.specs) && item.specs.length > 0) {
    const sorted = [...item.specs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const s of sorted) {
      const label = String(s.spec_key ?? '').trim();
      const value = String(s.spec_value ?? '').trim();
      if (label && value) specRows.push({ label, value });
    }
  }

  return (
    <div className='hidden min-h-[calc(100vh-4rem)] bg-[var(--brand-panel)] lg:block animate-[fadeIn_0.2s_ease-in]'>
      <div className='px-8 2xl:px-10 pt-5 pb-3'>
        <div className={cn('flex items-center gap-2 text-gray-500', SHOWCASE_DETAIL_DATA_TEXT_CLASS)}>
          <Button
            variant='unstyled'
            type='button'
            onClick={handleBack}
            aria-label='กลับไปหน้าก่อนหน้า'
            className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50'
          >
            <ArrowLeft className='h-3.5 w-3.5' />
          </Button>
          <span>{item.category || 'ทั้งหมด'}</span>
          {subName && !isMaterial ? (
            <>
              <Chevron className='w-3 h-3 text-gray-300' />
              <span>{subName}</span>
            </>
          ) : null}
          <Chevron className='w-3 h-3 text-gray-300' />
          <span className='max-w-[32rem] truncate text-[var(--brand-ink)]'>{item.title}</span>
        </div>
      </div>

      <div className='px-8 2xl:px-10 pb-10 space-y-4'>
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex gap-8'>
            <div className={cn('w-[450px] shrink-0 2xl:w-[520px]', SHOWCASE_DETAIL_DATA_TEXT_CLASS)}>
              <ShowcaseHeroGallery
                gallery={gallery}
                fallbackImage={item.image}
                title={item.title}
                activeImage={activeImage}
                onActiveImageChange={setActiveImage}
                accentColor={BRAND.orange}
                borderColor={BRAND.border}
                className=''
              />

              <div className='mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-[14px] text-gray-500'>
                <Button
                  variant='unstyled'
                  type='button'
                  className='inline-flex items-center gap-1.5 text-[14px] font-medium hover:text-gray-700 transition-colors'
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      void navigator.share({ title: item.title, url: window.location.href });
                    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      void navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                >
                  <Share2 className='w-4 h-4' /> แชร์สินค้านี้
                </Button>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => void toggleFavorite(item.id)}
                  className='inline-flex items-center gap-1.5 text-[14px] font-medium hover:text-gray-700 transition-colors'
                >
                  <Heart
                    className='w-4 h-4'
                    style={
                      liked
                        ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' }
                        : { color: BRAND.orange }
                    }
                  />
                  {likeCount} สนใจ
                </Button>
              </div>
            </div>

            <div className={cn('flex-1 min-w-0', SHOWCASE_DETAIL_DATA_TEXT_CLASS)}>
              <div className='mb-2 flex flex-wrap items-center gap-2'>
                {factory?.verified ? (
                  <span className='inline-flex items-center gap-1 rounded-sm bg-[var(--brand-orange)] px-2 py-0.5 font-bold text-white'>
                    <BadgeCheck className='h-3 w-3' /> Preferred
                  </span>
                ) : null}
                <span
                  className='inline-flex items-center rounded-sm px-2 py-0.5 font-semibold text-white'
                  style={{
                    background: isIdea
                      ? 'var(--brand-purple)'
                      : isMaterial
                        ? 'var(--status-success)'
                        : 'var(--brand-orange)',
                  }}
                >
                  {isIdea ? 'ไอเดีย / บทความ' : isMaterial ? 'วัตถุดิบ' : 'สินค้า'}
                </span>
              </div>

              <h1 className={SHOWCASE_DETAIL_TITLE_CLASS}>
                {item.title}
              </h1>

              <div className={cn('mt-1 flex items-center gap-4 border-b border-gray-100 py-3', SHOWCASE_DETAIL_META_TEXT_CLASS)}>
                <span className='inline-flex items-center gap-1'>
                  <span className='border-b border-[var(--brand-orange)] text-[var(--brand-orange)]'>
                    {avgRating.toFixed(1)}
                  </span>
                  <Star className='w-3.5 h-3.5 fill-current text-[var(--brand-orange)]' />
                </span>
                <span className='h-3 w-px bg-gray-200' />
                <span>
                  <span className='text-gray-700 border-b border-gray-300'>{reviewCount}</span>
                  <span className='ml-1'>รีวิว</span>
                </span>
                <span className='h-3 w-px bg-gray-200' />
                <span>
                  <span className='text-gray-700'>{likeCount}</span>
                  <span className='ml-1'>คนสนใจ</span>
                </span>
                <span className='h-3 w-px bg-gray-200' />
                <span>เผยแพร่ {formatThaiDate(item.postedAt)}</span>
              </div>

              <div className='mt-3 rounded-xl border border-[#F8DEC1] bg-[var(--surface-paper-warm)] px-3 py-2.5'>
                {priceText ? (
                  <div className='flex items-baseline gap-2'>
                    <p className={SHOWCASE_DETAIL_EMPHASIS_CLASS}>
                      {priceText}
                    </p>
                    {item.promoPrice && item.basePrice && item.promoPrice < item.basePrice ? (
                      <p className='line-through text-gray-400'>
                        {formatTHB(item.basePrice)}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className={cn(SHOWCASE_DETAIL_EMPHASIS_CLASS, 'font-semibold')}>
                    สอบถามราคากับโรงงาน
                  </p>
                )}
                <p className={cn('mt-1.5', SHOWCASE_DETAIL_META_TEXT_CLASS)}>
                  ราคาต่อชิ้นอาจแตกต่างตามปริมาณสั่งผลิต กรุณาแชทเพื่อขอใบเสนอราคา
                </p>
              </div>

              <div className='mt-5 grid grid-cols-[120px_1fr] gap-x-4 gap-y-3'>
                <span className='text-gray-400'>ขั้นต่ำผลิต</span>
                <span className='text-[var(--brand-ink)]'>
                  <span className='font-semibold'>{item.minOrder}</span>{' '}
                  <span className='text-gray-500'>{moqUnit} (MOQ)</span>
                </span>

                {item.leadTime ? (
                  <>
                    <span className='text-gray-400'>ระยะเวลาผลิต</span>
                    <span className='text-[var(--brand-ink)]'>{item.leadTime}</span>
                  </>
                ) : null}

                {factory?.location ? (
                  <>
                    <span className='text-gray-400'>สถานที่ผลิต</span>
                    <span className='inline-flex items-center gap-1 text-[var(--brand-ink)]'>
                      <MapPin className='w-3.5 h-3.5 text-gray-400' /> {factory.location}
                    </span>
                  </>
                ) : null}
              </div>

              {item.tags.length > 0 ? (
                <div className='mt-5 grid grid-cols-[120px_1fr] items-start gap-x-4'>
                  <span className='pt-1 text-gray-400'>แท็ก</span>
                  <div className='flex flex-wrap gap-1.5'>
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className='inline-flex cursor-pointer items-center rounded-sm bg-[#F5F3FF] px-2 py-1 font-medium text-[var(--brand-purple)] transition-colors hover:opacity-80'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className='mt-5 flex items-center gap-2'>
                {canChat ? (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={handleStartChat}
                    disabled={starting}
                    className='inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-[var(--brand-orange)] bg-[var(--surface-orange-tint)] px-4 text-[14px] font-semibold text-[var(--brand-orange-vivid)] transition-colors disabled:opacity-70'
                  >
                    {starting ? (
                      <span
                        className='w-4 h-4 border-2 border-t-transparent rounded-full animate-spin'
                        style={{ borderColor: BRAND.orangeDark }}
                      />
                    ) : (
                      <MessageCircle className='w-4 h-4' />
                    )}
                    แชทกับโรงงาน
                  </Button>
                ) : null}
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => navigate(`/factories/${item.factoryId}`)}
                  className='inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--brand-orange)] px-4 text-[14px] font-semibold text-white transition-opacity hover:opacity-90'
                >
                  <Store className='w-4 h-4' />
                  ดูโปรไฟล์โรงงาน
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-5'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex min-w-0 items-center gap-4'>
              <div className='w-fit shrink-0 rounded-lg'>
                <div
                  className={`relative block h-17 w-17 overflow-hidden rounded-lg border ${
                    factory?.image ? 'border-white' : 'border-dashed border-indigo-200 bg-violet-50'
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
                      <span className='text-[9px] font-semibold leading-tight text-indigo-600'>
                        โปรไฟล์
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className='min-w-0'>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => navigate(`/factories/${item.factoryId}`)}
                  className='flex max-w-full min-w-0 items-center gap-1.5 text-left transition-opacity hover:opacity-80'
                >
                  <p className={cn('truncate', SHOWCASE_DETAIL_TITLE_CLASS)}>
                    {item.factoryName}
                  </p>
                  {factory?.verified ? (
                    <BadgeCheck className='h-3.5 w-3.5 shrink-0 text-[var(--brand-purple)]' />
                  ) : null}
                </Button>
                {factory?.specialization ? (
                  <p className={cn('mt-1 truncate', SHOWCASE_DETAIL_META_TEXT_CLASS)}>
                    {factory.specialization}
                  </p>
                ) : null}
              </div>
            </div>

            <div className='shrink-0 rounded-lg border border-gray-100 bg-[var(--brand-page)] px-3 py-2 text-center'>
              <p className={SHOWCASE_DETAIL_META_TEXT_CLASS}>ออเดอร์สำเร็จ</p>
              <p className='text-[14px] font-semibold tabular-nums text-[var(--brand-orange)]'>
                {factory?.completedOrders ?? 0}
              </p>
            </div>
          </div>
        </div>
 

        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className={SHOWCASE_SECTION_HEADER_CLASS}>
            <p className={SHOWCASE_SECTION_HEADER_TITLE_CLASS}>รายละเอียดสินค้า</p>
          </div>
          <div className='p-6'>
            {markdown ? (
              <MarkdownBody source={markdown} typography='showcase-detail' />
            ) : (
              <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'text-gray-400')}>
                ยังไม่มีรายละเอียดเพิ่มเติม
              </p>
            )}
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className={SHOWCASE_SECTION_HEADER_CLASS}>
            <p className={SHOWCASE_SECTION_HEADER_TITLE_CLASS}>คะแนนรีวิว</p>
          </div>
          <div className='p-6'>
            <div className='flex items-center gap-8'>
              <div>
                <p className='text-[22px] font-bold leading-none text-[var(--brand-orange)]'>
                  {avgRating.toFixed(1)}
                </p>
                <p className={cn('mt-1', SHOWCASE_DETAIL_META_TEXT_CLASS)}>จาก {reviewCount} รีวิว</p>
              </div>
              <div className='flex-1 space-y-2'>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = Number(breakdown[String(star)] ?? 0);
                  const intensity =
                    reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
                  return (
                    <div key={star} className='flex items-center gap-2'>
                      <span className={cn('w-10', SHOWCASE_DETAIL_META_TEXT_CLASS)}>{star} ดาว</span>
                      <div className='h-2 flex-1 rounded-full bg-gray-100 overflow-hidden'>
                        <div
                          className='h-full rounded-full'
                          style={{ width: `${intensity}%`, background: BRAND.orange }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className='mt-5 border-t border-gray-100 pt-4 space-y-3'>
              <p className={SHOWCASE_SECTION_HEADER_TITLE_CLASS}>
                รีวิวล่าสุดจากลูกค้า
              </p>
              {latestReviews.length === 0 ? (
                <p className={cn(SHOWCASE_DETAIL_META_TEXT_CLASS, 'text-gray-400')}>ยังไม่มีรีวิว</p>
              ) : (
                latestReviews.slice(0, 3).map((r) => (
                  <div key={r.id} className='rounded-lg border border-gray-100 px-3 py-2'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'font-semibold text-gray-700 truncate')}>
                        {r.reviewer}
                      </p>
                      <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'text-amber-600')}>
                        ★ {Number(r.rating || 0).toFixed(1)}
                      </p>
                    </div>
                    <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'mt-1 line-clamp-2 text-gray-600')}>
                      {r.comment || '-'}
                    </p>
                    {r.imageUrls && r.imageUrls.length > 0 && (
                      <div className='mt-1.5'>
                        <ReviewImageAttachments urls={r.imageUrls} onPreviewUrl={(u) => openImageLightbox(u)} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className={SHOWCASE_SECTION_HEADER_CLASS}>
            <p className={SHOWCASE_SECTION_HEADER_TITLE_CLASS}>สินค้าที่ใกล้เคียง</p>
          </div>
          {relatedProducts.length > 0 ? (
            <div className='p-6 grid grid-cols-5 2xl:grid-cols-6 gap-2'>
              {relatedProducts.map((rp) => (
                <ShowcaseGridCard
                  key={rp.id}
                  item={rp}
                  isLiked={isLiked(rp.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => navigate(getFactoryIdeaDetailPath(rp.contentType, rp.id))}
                />
              ))}
            </div>
          ) : (
            <div className={cn('p-8 text-center text-gray-400', SHOWCASE_DETAIL_META_TEXT_CLASS)}>
              ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
