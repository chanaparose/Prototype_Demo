import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@lib/utils';
import {
  SHOWCASE_DETAIL_BRAND as BRAND,
  SHOWCASE_DETAIL_TITLE_CLASS,
  SHOWCASE_DETAIL_DATA_TEXT_CLASS,
  formatShowcaseThaiDate as formatThaiDate,
  normalizeShowcaseMarkdown,
} from '@/components/features/showcase-detail/showcaseDetailShared';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight as Chevron,
  Heart,
  ImageIcon,
  MapPin,
  Star,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import { IdeaPostCard } from '@/components/features/factory-ideas/IdeaPostCard';
import { useIdeaDetailShowcase } from '@/hooks/useShowcaseDetailPage';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { useShowcases } from '@/hooks/useShowcases';
import { RelatedShowcasesSection } from '@/components/features/idea-detail/RelatedShowcasesSection';
import { ReviewPreviewSection } from '@/components/features/reviews/ReviewPreviewSection';
import {
  getFactoryReviewsBrowsePath,
  normalizeShowcaseReview,
} from '@/components/features/reviews/reviewBrowseUtils';
import { partitionLinkedShowcases } from '@/utils/linkedShowcases';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { ProductDetailSkeleton } from '@/components/skeletons/PageSkeletons';
import { mobileShowcaseDetailPaddingBottom, useScrollPast } from '@/hooks/useMobileBottomNavHide';
import { ShowcaseDetailMobileActionBar } from '@/components/features/showcase-detail/ShowcaseDetailMobileActionBar';
import { ShowcaseDetailMobileScrollHeader } from '@/components/features/showcase-detail/ShowcaseDetailMobileScrollHeader';

const SECTION_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-wider text-gray-400';
const SECTION_TITLE_CLASS = 'text-[14px] font-semibold text-[var(--brand-navy-ink)]';

const PANEL_STRIP_CLASS = 'h-2 bg-[var(--brand-panel)]';

type IdeaDetailTab = 'content' | 'references' | 'reviews';

const IDEA_DETAIL_TABS: { id: IdeaDetailTab; label: string }[] = [
  { id: 'content', label: 'เนื้อหา' },
  { id: 'references', label: 'สินค้าอ้างอิง' },
  { id: 'reviews', label: 'รีวิว' },
];

export function IdeaDetailMobile() {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, resolvedId, reviews } = useIdeaDetailShowcase();
  const { showcases: relatedIdeas, loading: relatedIdeasLoading } = useShowcases({ type: 'ID' });
  const [activeTab, setActiveTab] = useState<IdeaDetailTab>('content');

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const scrollNavVisible = useScrollPast(56);

  useEffect(() => {
    history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    setActiveTab('content');
  }, [resolvedId]);

  const { showcaseIds } = useMemo(
    () => partitionLinkedShowcases(item?.linkedShowcases),
    [item?.linkedShowcases],
  );

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
          style={{ color: BRAND.purple }}
        >
          <ArrowLeft className='w-4 h-4' /> กลับ
        </Button>
        <div className='rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500'>
          {error || 'ไม่พบบทความไอเดีย'}
        </div>
      </div>
    );
  }

  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const markdown = normalizeShowcaseMarkdown(item.content ?? item.excerpt ?? '');
  const liked = isLiked(item.id);
  const likeCount = item.likes + (liked ? 1 : 0);
  const avgRating = Number(reviews?.summary.average ?? factory?.rating ?? 0);
  const reviewCount = Number(reviews?.summary.total ?? factory?.reviews ?? 0);
  const browseReviews = (reviews?.items ?? []).map(normalizeShowcaseReview);
  const hasReferences = showcaseIds.length > 0;

  const handleStartChat = () =>
    void startChat(item.factoryId, {
      type: 'ID',
      id: Number(resolvedId),
      title: item.title,
    });

  const filteredRelatedIdeas = relatedIdeas.filter((next) => next.id !== item.id).slice(0, 5);

  return (
    <div
      className='min-h-screen bg-[var(--brand-panel)] animate-[fadeIn_0.2s_ease-in]'
      style={{ paddingBottom: mobileShowcaseDetailPaddingBottom() }}
    >
      <ShowcaseDetailMobileScrollHeader
        title={item.title}
        onBack={handleBack}
        revealAt={56}
        liked={liked}
        likeCount={likeCount}
        onToggleFavorite={() => void toggleFavorite(item.id)}
        factoryId={item.factoryId}
        canChat={canChat}
        onChat={handleStartChat}
        chatStarting={starting}
        searchType='idea'
      />

      <article className='bg-white'>
        <div className='px-4 pt-3'>
          {!scrollNavVisible ? (
            <div className='mb-2 flex items-center gap-2'>
              <Button
                variant='unstyled'
                type='button'
                onClick={handleBack}
                className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white active:bg-gray-50'
                aria-label='กลับ'
              >
                <ArrowLeft className='h-4 w-4 text-gray-700' />
              </Button>
              <div className='flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden'>
                <span className='shrink-0 rounded-full bg-brand-magenta/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-magenta'>
                  ไอเดีย
                </span>
                {item.category ? (
                  <>
                    <span className='shrink-0 text-[10px] text-gray-300'>·</span>
                    <span className='truncate text-[11px] text-gray-500'>{item.category}</span>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className='flex items-start gap-2'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate(`/factories/${item.factoryId}`)}
              className='h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100'
            >
              <ImageWithFallback
                src={factory?.image ?? item.factoryImageUrl ?? ''}
                alt={item.factoryName}
                className='h-full w-full object-cover'
              />
            </Button>
            <div className='min-w-0 flex-1 pt-0.5'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate(`/factories/${item.factoryId}`)}
                className='block w-full text-left'
              >
                <div className='flex items-center gap-1'>
                  <span className='truncate text-[14px] font-semibold text-brand-navy-ink'>
                    {item.factoryName}
                  </span>
                  {factory?.verified ? (
                    <BadgeCheck size={13} className='shrink-0 text-brand-purple' />
                  ) : null}
                </div>
                <div className='mt-0.5 flex items-center gap-1.5 text-[12px] text-gray-400'>
                  {factory?.location ? (
                    <>
                      <MapPin size={9} className='shrink-0' />
                      <span className='truncate'>{factory.location}</span>
                      <span>·</span>
                    </>
                  ) : null}
                  <span>{formatThaiDate(item.postedAt)}</span>
                </div>
              </Button>
            </div>
             
          </div>

          <h1 className={cn('mt-2', SHOWCASE_DETAIL_TITLE_CLASS)} style={{ color: BRAND.ink }}>
            {item.title}
          </h1>

          <div className='mt-2 flex flex-wrap items-center gap-3 pb-2.5 text-[12px] text-gray-500'>
            <span className='inline-flex items-center gap-1'>
              <span className='border-b' style={{ color: BRAND.orange, borderColor: BRAND.orange }}>
                {avgRating.toFixed(1)}
              </span>
              <Star className='h-3 w-3 fill-current' style={{ color: BRAND.orange }} />
            </span>
            <span>{reviewCount} รีวิว</span>
            <span>•</span>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void toggleFavorite(item.id)}
              className='inline-flex items-center gap-1 text-[12px] active:opacity-70'
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
            </Button>
          </div>
        </div>

        <div
          role='tablist'
          aria-label='รายละเอียดไอเดีย'
          className='grid grid-cols-3 border-y border-gray-100 bg-white'
        >
          {IDEA_DETAIL_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === 'references'
                ? showcaseIds.length
                : tab.id === 'reviews'
                  ? reviewCount
                  : null;
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
                ยังไม่มีเนื้อหาบทความ
              </p>
            )
          ) : null}

          {activeTab === 'references' ? (
            hasReferences ? (
              <RelatedShowcasesSection
                variant='inline'
                embedded
                linkedShowcases={item.linkedShowcases}
                onItemClick={(s) =>
                  navigate(
                    s.contentType === 'promotion'
                      ? `/factory-ideas/promotions/${s.id}`
                      : `/factory-ideas/products/${s.id}`,
                  )
                }
              />
            ) : (
              <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'py-6 text-center text-gray-400')}>
                ยังไม่มีสินค้าหรือโปรโมชันอ้างอิง
              </p>
            )
          ) : null}

          {activeTab === 'reviews' ? (
            <div className='space-y-4'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate(`/factories/${item.factoryId}`)}
                className='group -mx-1 flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left active:bg-gray-50/80'
              >
                <div
                  className={cn(
                    'relative block size-12 shrink-0 overflow-hidden rounded-lg border aspect-square',
                    factory?.image || item.factoryImageUrl
                      ? 'border-gray-100'
                      : 'border-dashed border-indigo-200 bg-violet-50',
                  )}
                >
                  {factory?.image || item.factoryImageUrl ? (
                    <ImageWithFallback
                      src={factory?.image ?? item.factoryImageUrl ?? ''}
                      alt={item.factoryName}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <span className='flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-center'>
                      <ImageIcon size={18} className='text-indigo-400' strokeWidth={1.5} />
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
                    <span>{reviewCount} รีวิว</span>
                  </div>
                </div>
                <Chevron className='h-4 w-4 shrink-0 text-gray-300 transition-transform group-active:translate-x-0.5' />
              </Button>

              <ReviewPreviewSection
                reviews={browseReviews}
                previewLimit={4}
                onViewAll={
                  item.factoryId
                    ? () => navigate(getFactoryReviewsBrowsePath(String(item.factoryId)))
                    : undefined
                }
                footerNote='การรีวิวทำผ่านหน้าออเดอร์ที่เสร็จสมบูรณ์แล้วเท่านั้น เพื่อป้องกันรีวิวปลอมและรีวิวซ้ำ'
              />
            </div>
          ) : null}
        </div>
      </article>

      {filteredRelatedIdeas.length > 0 || relatedIdeasLoading ? (
        <>
          <div className={PANEL_STRIP_CLASS} />
          <section className='bg-white px-4 py-4' aria-label='ไอเดียที่เกี่ยวข้อง'>
            <p className={SECTION_EYEBROW_CLASS}>อ่านต่อ</p>
            <h2 className={cn(SECTION_TITLE_CLASS, 'mb-3')}>ไอเดียที่น่าสนใจ</h2>
            {relatedIdeasLoading ? (
              <p className={cn(SHOWCASE_DETAIL_DATA_TEXT_CLASS, 'py-2 text-gray-400')}>
                กำลังโหลดไอเดีย…
              </p>
            ) : (
              <div className='space-y-3'>
                {filteredRelatedIdeas.map((next) => (
                  <IdeaPostCard
                    key={next.id}
                    item={next}
                    isLiked={isLiked(next.id)}
                    onToggleFavorite={(id) => void toggleFavorite(id)}
                    onClick={() =>
                      navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

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
