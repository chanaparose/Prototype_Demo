import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Share2,
  MapPin,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { useIdeaDetailShowcase } from '@/hooks/useShowcaseDetailPage';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { type FactoryShowcase } from '@/stores/types';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { showcasesApi } from '@/services/api/factoryApi';
import { mapShowcaseFromApi } from '@/hooks/useShowcases';
import { RelatedShowcasesSection } from '@/components/features/idea-detail/RelatedShowcasesSection';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { ProductDetailSkeleton } from '@/components/skeletons/PageSkeletons';
import { mobileShowcaseDetailPaddingBottom } from '@/hooks/useMobileBottomNavHide';
import { ShowcaseDetailMobileActionBar } from '@/components/features/showcase-detail/ShowcaseDetailMobileActionBar';
import { Image } from '@/components/ui/image';

export function IdeaDetailMobile() {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, resolvedId } = useIdeaDetailShowcase();
  const [relatedIdeas, setRelatedIdeas] = useState<FactoryShowcase[]>([]);
  const coverImage = useMemo(() => {
    const urls = Array.isArray(item?.imageUrls)
      ? item.imageUrls.filter((u) => String(u).trim() !== '')
      : [];
    if (urls.length > 0) return urls[0];
    return item?.image?.trim() || null;
  }, [item?.image, item?.imageUrls]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (!item?.id) {
      setRelatedIdeas([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await showcasesApi.list('ID');
        if (cancelled) return;
        const list = (Array.isArray(rows) ? rows : [])
          .map((r) => mapShowcaseFromApi((r ?? {}) as Record<string, unknown>))
          .filter((s) => s.contentType === 'idea' && s.id !== item.id)
          .slice(0, 6);
        setRelatedIdeas(list);
      } catch {
        if (!cancelled) setRelatedIdeas([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item?.id]);

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

        {relatedIdeas.length > 0 ? (
          <section className='mt-4 pb-2' aria-label='อ่านต่อ'>
            <h2 className='mb-2.5 text-[13px] font-bold text-[var(--brand-navy)]'>
              อ่านต่อ
            </h2>
            <div className='-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory'>
              {relatedIdeas.map((next) => {
                const excerpt = (next.excerpt || next.description || '').trim();
                return (
                  <article
                    key={next.id}
                    className='w-[11.5rem] shrink-0 snap-start cursor-pointer rounded-xl border border-gray-100 bg-white p-3 active:scale-[0.98] transition-transform'
                    onClick={() =>
                      navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)
                    }
                  >
                    <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-1.5 py-px text-[9px] font-bold text-brand-magenta'>
                      ไอเดีย
                    </span>
                    <h3
                      className='mt-1.5 text-[12px] font-bold leading-snug line-clamp-3 text-[var(--brand-navy)]'
                    >
                      {next.title}
                    </h3>
                    {excerpt ? (
                      <p className='mt-1 text-[10px] leading-relaxed text-gray-500 line-clamp-2'>
                        {excerpt}
                      </p>
                    ) : null}
                    <p className='mt-2 truncate text-[10px] text-gray-400'>{next.factoryName}</p>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
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
