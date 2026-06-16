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
import { ShowcaseHeroGallery } from '@/components/features/showcase-detail/ShowcaseHeroGallery';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
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
import { ReviewPreviewSection } from '@/components/features/reviews/ReviewPreviewSection';
import {
  getProductReviewsBrowsePath,
  normalizeShowcaseReview,
} from '@/components/features/reviews/reviewBrowseUtils';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { useFavorites } from '@/hooks/useFavorites';
import { ShowcaseGridCard } from '@/components/features/factory-ideas/ShowcaseGridCard';
import { getFactoryIdeaDetailPath } from '@/components/features/factory-ideas/factoryIdeasTheme';

const SECTION_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-wider text-gray-400';
const SECTION_TITLE_CLASS = 'text-[14px] font-semibold text-[var(--brand-navy-ink)]';

function DetailSection({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-gray-100 bg-white', className)}>
      <header className='border-b border-gray-50 px-6 py-2'>
        {eyebrow ? <p className={SECTION_EYEBROW_CLASS}>{eyebrow}</p> : null}
        <h2 className={cn(SECTION_TITLE_CLASS, eyebrow ? 'mt-0.5' : '')}>{title}</h2>
      </header>
      <div className='px-6 py-1'>{children}</div>
    </section>
  );
}

export function ProductDetailDesktop() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const browseReviews = (reviews?.items ?? []).map(normalizeShowcaseReview);

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
      <div className='mx-auto max-w-[1280px] px-8 2xl:px-10 pt-5 pb-3'>
        <div className={cn('flex items-center gap-2 text-gray-400', SHOWCASE_DETAIL_DATA_TEXT_CLASS)}>
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

      <div className='mx-auto max-w-[1280px] px-8 2xl:px-10 pb-12 space-y-3'>
        <article className='rounded-xl border border-gray-100 bg-white p-6 shadow-sm'>
          <div className='flex gap-10'>
            <div className={cn('w-[420px] shrink-0 2xl:w-[480px]', SHOWCASE_DETAIL_DATA_TEXT_CLASS)}>
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

              <div className='mt-4 flex items-center justify-between border-t border-gray-50 pt-3 text-[14px] text-gray-500'>
                <Button
                  variant='unstyled'
                  type='button'
                  className='inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors hover:text-gray-800'
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      void navigator.share({ title: item.title, url: window.location.href });
                    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      void navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                >
                  <Share2 className='w-3.5 h-3.5' /> แชร์
                </Button>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => void toggleFavorite(item.id)}
                  className='inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors hover:text-gray-800'
                >
                  <Heart
                    className='w-3.5 h-3.5'
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

            <div className={cn('flex min-w-0 flex-1 flex-col', SHOWCASE_DETAIL_DATA_TEXT_CLASS)}>
              <div className='mb-3 flex flex-wrap items-center gap-1.5'>
                {factory?.verified ? (
                  <span className='inline-flex items-center gap-1 rounded-full bg-[var(--brand-orange)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand-orange-vivid)]'>
                    <BadgeCheck className='h-3 w-3' /> Preferred
                  </span>
                ) : null}
                <span
                  className='inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white'
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

              <h1 className={SHOWCASE_DETAIL_TITLE_CLASS}>{item.title}</h1>

              <div
                className={cn(
                  'mt-2 flex flex-wrap items-center gap-x-4 gap-y-1',
                  SHOWCASE_DETAIL_META_TEXT_CLASS,
                )}
              >
                <span className='inline-flex items-center gap-1.5'>
                  <Star className='h-3.5 w-3.5 fill-amber-400 text-amber-400' />
                  <span className='font-semibold text-gray-800'>{avgRating.toFixed(1)}</span>
                  <span className='text-gray-400'>({reviewCount} รีวิว)</span>
                </span>
                <span className='text-gray-300'>·</span>
                <span>
                  <span className='font-medium text-gray-700'>{likeCount}</span>{' '}
                  <span className='text-gray-400'>คนสนใจ</span>
                </span>
                <span className='text-gray-300'>·</span>
                <span className='text-gray-400'>{formatThaiDate(item.postedAt)}</span>
              </div>

              <div className='mt-4 rounded-lg bg-[var(--brand-page)] px-4 py-3'>
                {priceText ? (
                  <div className='flex items-baseline gap-2'>
                    <p className={SHOWCASE_DETAIL_EMPHASIS_CLASS}>{priceText}</p>
                    {item.promoPrice && item.basePrice && item.promoPrice < item.basePrice ? (
                      <p className='text-[13px] line-through text-gray-400'>
                        {formatTHB(item.basePrice)}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className={cn(SHOWCASE_DETAIL_EMPHASIS_CLASS, 'font-semibold')}>
                    สอบถามราคากับโรงงาน
                  </p>
                )}
                <p className={cn('mt-1', SHOWCASE_DETAIL_META_TEXT_CLASS)}>
                  ราคาอาจแตกต่างตามปริมาณสั่งผลิต — แชทเพื่อขอใบเสนอราคา
                </p>
              </div>

              <dl className='mt-5 space-y-2.5 border-t border-gray-50 pt-5'>
                <div className='flex items-baseline justify-between gap-4'>
                  <dt className='text-gray-400'>ขั้นต่ำผลิต</dt>
                  <dd className='text-right text-[var(--brand-ink)]'>
                    <span className='font-semibold'>{item.minOrder}</span>{' '}
                    <span className='text-gray-500'>{moqUnit}</span>
                  </dd>
                </div>
                {item.leadTime ? (
                  <div className='flex items-baseline justify-between gap-4'>
                    <dt className='text-gray-400'>ระยะเวลาผลิต</dt>
                    <dd className='text-right text-[var(--brand-ink)]'>{item.leadTime}</dd>
                  </div>
                ) : null}
                {factory?.location ? (
                  <div className='flex items-baseline justify-between gap-4'>
                    <dt className='text-gray-400'>สถานที่ผลิต</dt>
                    <dd className='inline-flex items-center justify-end gap-1 text-right text-[var(--brand-ink)]'>
                      <MapPin className='h-3.5 w-3.5 shrink-0 text-gray-400' />
                      {factory.location}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {item.tags.length > 0 ? (
                <div className='mt-4 flex flex-wrap gap-1.5'>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className='inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-[12px] font-medium text-gray-600 ring-1 ring-gray-100'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className='mt-auto flex items-center gap-2 pt-6'>
                {canChat ? (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={handleStartChat}
                    disabled={starting}
                    className='inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-70'
                  >
                    {starting ? (
                      <span
                        className='h-4 w-4 animate-spin rounded-full border-2 border-t-transparent'
                        style={{ borderColor: BRAND.orangeDark }}
                      />
                    ) : (
                      <MessageCircle className='h-4 w-4' />
                    )}
                    แชทกับโรงงาน
                  </Button>
                ) : null}
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => navigate(`/factories/${item.factoryId}`)}
                  className='inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--brand-orange)] px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90'
                >
                  <Store className='h-4 w-4' />
                  ดูโปรไฟล์โรงงาน
                </Button>
              </div>
            </div>
          </div>
        </article>

        <DetailSection eyebrow='ข้อมูลสินค้า' title='รายละเอียด'>
          {markdown ? (
            <MarkdownBody source={markdown} typography='showcase-detail' />
          ) : (
            <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'text-gray-400')}>
              ยังไม่มีรายละเอียดเพิ่มเติม
            </p>
          )}
        </DetailSection>

        <section className='overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm'>
          <div className='px-6 py-5'>
            <p className={SECTION_EYEBROW_CLASS}>โรงงานผู้ผลิต</p>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate(`/factories/${item.factoryId}`)}
              className='group -mx-1 mt-2 flex w-full items-center gap-4 rounded-lg px-1 py-1 text-left transition-colors hover:bg-gray-50/60'
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
                    <span className='text-[8px] font-semibold leading-tight text-indigo-600'>
                      โปรไฟล์
                    </span>
                  </span>
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-1.5'>
                  <p className='truncate text-[14px] font-semibold text-[var(--brand-navy-ink)]'>
                    {item.factoryName}
                  </p>
                  {factory?.verified ? (
                    <BadgeCheck className='h-3.5 w-3.5 shrink-0 text-[var(--brand-purple)]' />
                  ) : null}
                </div>
                {factory?.specialization ? (
                  <p className='mt-0.5 truncate text-[14px] font-normal text-gray-500'>
                    {factory.specialization}
                  </p>
                ) : null}
              </div>
              <div className='hidden shrink-0 text-right sm:block'>
                <p className={SHOWCASE_DETAIL_META_TEXT_CLASS}>ออเดอร์สำเร็จ</p>
                <p className='text-[14px] font-semibold tabular-nums text-[var(--brand-orange)]'>
                  {factory?.completedOrders ?? 0}
                </p>
              </div>
              <Chevron className='h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5' />
            </Button>
          </div>

          <div className='border-t border-gray-50 px-6 py-5'>
            <ReviewPreviewSection
              reviews={browseReviews}
              onViewAll={
                resolvedId
                  ? () => navigate(getProductReviewsBrowsePath(resolvedId, location.pathname))
                  : undefined
              }
              footerNote='การรีวิวทำผ่านหน้าออเดอร์ที่เสร็จสมบูรณ์แล้วเท่านั้น เพื่อป้องกันรีวิวปลอมและรีวิวซ้ำ'
            />
          </div>
        </section>

        <DetailSection eyebrow='แนะนำ' title='สินค้าที่ใกล้เคียง' className='overflow-hidden [&>div:last-child]:pt-4'>
          {relatedProducts.length > 0 ? (
            <div className='grid grid-cols-5 gap-2 2xl:grid-cols-6'>
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
            <p className={cn('py-4 text-center text-gray-400', SHOWCASE_DETAIL_META_TEXT_CLASS)}>
              ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้
            </p>
          )}
        </DetailSection>
      </div>
    </div>
  );
}
