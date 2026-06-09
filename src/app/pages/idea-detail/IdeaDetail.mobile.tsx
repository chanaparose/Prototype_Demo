import React, { useCallback } from 'react';
import {
  SHOWCASE_DETAIL_BRAND as BRAND,
  formatShowcaseThaiDate as formatThaiDate,
} from '@/components/features/showcase-detail/showcaseDetailShared';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Heart,
  Share2,
  MapPin,
} from 'lucide-react';
import { openImageLightbox } from '@/stores/useLightboxStore';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { useIdeaDetailShowcase } from '@/hooks/useShowcaseDetailPage';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { useShowcases } from '@/hooks/useShowcases';
import { RelatedShowcasesSection } from '@/components/features/idea-detail/RelatedShowcasesSection';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { ProductDetailSkeleton } from '@/components/skeletons/PageSkeletons';
import { mobileShowcaseDetailPaddingBottom } from '@/hooks/useMobileBottomNavHide';
import { ShowcaseDetailMobileActionBar } from '@/components/features/showcase-detail/ShowcaseDetailMobileActionBar';
const CARD = {
  purple: 'var(--brand-mauve)',
  blue: 'var(--brand-navy)',
} as const;

export function IdeaDetailMobile() {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const data = useData();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, resolvedId, reviews } = useIdeaDetailShowcase();
  const { showcases: relatedIdeas, loading: relatedIdeasLoading } = useShowcases({ type: 'ID' });

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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
          aria-label='กลับไป'
          className='mb-4 inline-flex items-center gap-1 text-sm'
          style={{ color: 'var(--brand-mauve)' }}
        >
          <ArrowLeft className='w-4 h-4' /> กลับ
        </Button>
        <div className='rounded-xl border border-slate-100 bg-white p-6 text-center text-sm text-gray-500'>
          {error || 'ไม่พบบทความไอเดีย'}
        </div>
      </div>
    );
  }

  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const markdown = String(item.content ?? '').trim();
  const liked = isLiked(item.id);
  const likeCount = item.likes + (liked ? 1 : 0);
  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'ID',
      id: Number(resolvedId),
      title: item.title,
    });

  const avgRating = Number(reviews?.summary.average ?? factory?.rating ?? 0);
  const reviewCount = Number(reviews?.summary.total ?? factory?.reviews ?? 0);
  const breakdown = reviews?.summary.breakdown ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const latestReviews = reviews?.items ?? [];

  return (
    <div
      className='min-h-screen bg-[var(--brand-page)]'
      style={{ paddingBottom: mobileShowcaseDetailPaddingBottom() }}
    >
      <header
        className='sticky top-0 z-30 flex items-center gap-2 border-b border-gray-100 bg-white/95 px-3 py-2.5 backdrop-blur-md'
      >
        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white'
          aria-label='กลับ'
        >
          <ArrowLeft className='h-4 w-4 text-gray-700' />
        </Button>
        <span className='min-w-0 flex-1 truncate text-[13px] font-semibold text-gray-800'>
          บทความไอเดีย
        </span>
        <Button
          variant='unstyled'
          type='button'
          className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white'
          aria-label='แชร์'
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              void navigator.share({ title: item.title, url: window.location.href });
            } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
              void navigator.clipboard.writeText(window.location.href);
            }
          }}
        >
          <Share2 className='h-4 w-4 text-gray-700' />
        </Button>
      </header>
 

      <main className='mx-auto max-w-lg px-4 pt-4'>
        <div className='mb-3 flex flex-wrap items-center gap-1.5'>
          <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[10px] font-semibold text-brand-magenta'>
            ไอเดีย
          </span>
          {item.category ? (
            <span className='text-[11px] text-gray-500'>{item.category}</span>
          ) : null}
          <span className='text-[11px] text-gray-400 inline-flex items-center gap-1'>
            <CalendarDays className='h-3 w-3' />
            {formatThaiDate(item.postedAt)}
          </span>
        </div>

        <h1
          className='text-[20px] font-bold leading-snug tracking-tight'
          style={{ color: BRAND.ink }}
        >
          {item.title}
        </h1>

        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(`/factories/${item.factoryId}`)}
          className='mt-3 flex w-full items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-left active:bg-gray-50'
        >
          <div className='h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-100'>
            <ImageWithFallback
              src={factory?.image ?? ''}
              fallbackSrc={item.factoryImageUrl ?? ''}
              alt={item.factoryName}
              className='h-full w-full object-cover'
            />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-1'>
              <p className='truncate text-[13px] font-semibold' style={{ color: BRAND.ink }}>
                {item.factoryName}
              </p>
              {factory?.verified ? (
                <BadgeCheck className='h-3.5 w-3.5 shrink-0' style={{ color: BRAND.purple }} />
              ) : null}
            </div>
            <p className='mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-500'>
              <MapPin className='h-3 w-3 shrink-0' />
              <span className='truncate'>{factory?.location ?? 'โรงงานผู้ผลิต'}</span>
            </p>
          </div>
          <ChevronRight className='h-4 w-4 shrink-0 text-gray-300' />
        </Button>

        <article className='mt-4 rounded-2xl border border-gray-100/90 bg-white px-4 py-4 shadow-sm'>
          {markdown ? (
            <MarkdownBody source={markdown} typography='showcase-detail' />
          ) : (
            <p className='text-[14px] text-gray-400'>ยังไม่มีเนื้อหาบทความ</p>
          )}

          <RelatedShowcasesSection
            variant='inline'
            linkedShowcases={item.linkedShowcases}
            onItemClick={(s) =>
              navigate(
                s.contentType === 'promotion'
                  ? `/factory-ideas/promotions/${s.id}`
                  : `/factory-ideas/products/${s.id}`,
              )
            }
          />
        </article>

        <section className='mt-4 rounded-2xl border border-gray-100/90 bg-white px-4 py-4 shadow-sm'>
          <p className='text-[14px] font-bold' style={{ color: BRAND.ink }}>
            คะแนนรีวิวโรงงาน
          </p>
          <div className='mt-3 flex items-center gap-4'>
            <div>
              <p className='text-[26px] font-bold leading-none' style={{ color: BRAND.orange }}>
                {avgRating.toFixed(1)}
              </p>
              <p className='mt-1 text-[12px] text-gray-500'>{reviewCount} รีวิว</p>
            </div>
            <div className='flex-1 space-y-1.5'>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = Number(breakdown[String(star)] ?? 0);
                const intensity =
                  reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
                return (
                  <div key={star} className='flex items-center gap-2'>
                    <span className='w-7 text-[11px] text-gray-500'>{star}★</span>
                    <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100'>
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
          <div className='mt-4 space-y-2 border-t border-gray-100 pt-3'>
            <p className='text-[13px] font-semibold' style={{ color: BRAND.ink }}>
              รีวิวล่าสุดจากลูกค้า
            </p>
            {latestReviews.length === 0 ? (
              <p className='text-[12px] text-gray-400'>ยังไม่มีรีวิว</p>
            ) : (
              latestReviews.slice(0, 2).map((r) => (
                <div key={r.id} className='rounded-lg border border-gray-100 px-2.5 py-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <p className='truncate text-[12px] font-semibold text-gray-700'>{r.reviewer}</p>
                    <p className='shrink-0 text-[12px] text-amber-600'>
                      ★ {Number(r.rating || 0).toFixed(1)}
                    </p>
                  </div>
                  <p className='mt-1 line-clamp-2 text-[12px] text-gray-600'>{r.comment || '-'}</p>
                  {r.imageUrls && r.imageUrls.length > 0 ? (
                    <div className='mt-1.5'>
                      <ReviewImageAttachments
                        urls={r.imageUrls}
                        onPreviewUrl={(u) => openImageLightbox(u)}
                      />
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className='mt-4 rounded-2xl border border-gray-100/90 bg-white p-4 pb-2 shadow-sm'
          aria-label='บทความที่เกี่ยวข้อง'
        >
          <h2 className='mb-3 text-[14px] font-bold' style={{ color: CARD.blue }}>
            บทความที่น่าสนใจให้อ่านต่อ
          </h2>
          {relatedIdeasLoading ? (
            <p className='text-[12px] text-gray-400 py-2'>กำลังโหลดบทความ…</p>
          ) : (
            <div className='space-y-3'>
              {relatedIdeas.slice(0, 5).map((next) => {
                const relFactory = data.factories.find((f) => f.id === next.factoryId);
                const excerpt = next.excerpt || next.description || '';
                return (
                  <article
                    key={next.id}
                    className='cursor-pointer rounded-xl border border-slate-100 bg-white p-3 transition-transform active:scale-[0.98]'
                    onClick={() =>
                      navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)
                    }
                  >
                    <div className='mb-2 flex items-center gap-2'>
                      <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[9px] font-bold text-brand-magenta'>
                        ไอเดีย
                      </span>
                      <span className='truncate text-[10px] text-gray-400'>{next.factoryName}</span>
                    </div>
                    <h3
                      className='text-[13px] font-bold leading-[19px] line-clamp-2'
                      style={{ color: CARD.blue }}
                    >
                      {next.title}
                    </h3>
                    <p className='mt-1 line-clamp-3 text-[11px] leading-[16px] text-gray-500'>
                      {excerpt || ' '}
                    </p>
                    <div className='mt-2 border-t border-gray-100 pt-2'>
                      <div className='mb-1 min-w-0 h-[18px]'>
                        {next.factoryName ? (
                          <Button
                            variant='unstyled'
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/factories/${next.factoryId}`);
                            }}
                            className='flex w-full min-w-0 items-center gap-1 text-left text-[10px] font-semibold active:opacity-80'
                            style={{ color: CARD.blue }}
                          >
                            <span className='truncate'>{next.factoryName}</span>
                            {relFactory?.verified ? (
                              <BadgeCheck
                                className='h-3 w-3 shrink-0'
                                style={{ color: CARD.purple }}
                              />
                            ) : null}
                          </Button>
                        ) : null}
                      </div>
                      <div className='flex min-w-0 items-center justify-between'>
                        <span className='shrink-0 text-[10px] text-gray-400'>
                          MOQ{' '}
                          <span className='font-semibold tabular-nums' style={{ color: CARD.blue }}>
                            {next.minOrder}
                          </span>
                        </span>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleFavorite(next.id);
                          }}
                          className='flex shrink-0 items-center gap-1 text-[10px] text-gray-400'
                        >
                          <Heart
                            className={`h-3 w-3 shrink-0 ${isLiked(next.id) ? 'fill-red-500 text-red-500' : ''}`}
                          />
                          <span className='font-medium tabular-nums text-gray-500'>
                            {next.likes + (isLiked(next.id) ? 1 : 0)}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

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
