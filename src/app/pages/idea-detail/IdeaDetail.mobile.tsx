import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SHOWCASE_DETAIL_BRAND as BRAND, formatShowcaseThaiDate as formatThaiDate } from '@/components/features/showcase-detail/showcaseDetailShared';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Heart,
  Share2,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { useIdeaDetailShowcase } from '@/hooks/useShowcaseDetailPage';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { type FactoryShowcase } from '@/stores/types';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { showcasesApi } from '@/services/api/factoryApi';
import { mapShowcaseFromApi } from '@/hooks/useShowcases';
import { RelatedShowcasesSection } from '@/components/features/idea-detail/RelatedShowcasesSection';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';

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
  const { item, loading, error, factory, resolvedId } = useIdeaDetailShowcase();
  const [relatedIdeas, setRelatedIdeas] = useState<FactoryShowcase[]>([]);
  const gallery = useMemo(() => {
    const urls = Array.isArray(item?.imageUrls)
      ? item.imageUrls.filter((u) => String(u).trim() !== '')
      : [];
    if (urls.length > 0) return urls.slice(0, 8);
    return item?.image ? [item.image] : [];
  }, [item?.image, item?.imageUrls]);
  const [activeImage, setActiveImage] = useState(0);

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
          .slice(0, 5);
        setRelatedIdeas(list);
      } catch {
        if (!cancelled) setRelatedIdeas([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item?.id]);

  useEffect(() => {
    setActiveImage(0);
  }, [item?.id]);

  if (loading) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center px-4 pb-20 pt-8'>
        <span
          className='h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent'
          aria-hidden
        />
      </div>
    );
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
        <div className='rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm'>
          {error || 'ไม่พบบทความไอเดีย'}
        </div>
      </div>
    );
  }

  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const markdown = String(item.content ?? '').trim();

  return (
    <div className='min-h-screen bg-neutral-warm-surface pb-[72px]'>
      <div className='bg-white px-4 pt-4 pb-3 border-b' style={{ borderColor: BRAND.divider }}>
        <div className='flex items-start'>
          <Button
            variant='unstyled'
            type='button'
            onClick={handleBack}
            className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shrink-0'
            aria-label='กลับ'
          >
            <ArrowLeft className='w-4 h-4 text-gray-700' />
          </Button>

          <div className='ml-[15px] min-w-0 flex-1'>
            <h1 className='text-[16px] font-semibold leading-snug' style={{ color: BRAND.ink }}>
              {item.title}
            </h1>
            <div className='mt-1.5 text-[11px] text-gray-500 inline-flex items-center gap-1.5'>
              <CalendarDays className='w-3 h-3' /> เผยแพร่ {formatThaiDate(item.postedAt)}
            </div>
            <div className='mt-1 flex flex-wrap items-center gap-1.5'>
              <span
                className='inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-semibold'
                style={{ background: BRAND.purpleSoft, color: BRAND.purple }}
              >
                บทความไอเดีย
              </span>
              {item.category ? (
                <span className='text-[10px] text-gray-500'>{item.category}</span>
              ) : null}
            </div>
          </div>

          <Button
            variant='unstyled'
            type='button'
            className='ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shrink-0'
            aria-label='แชร์'
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.share) {
                void navigator.share({
                  title: item.title,
                  url: window.location.href,
                });
              } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                void navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <Share2 className='w-4 h-4 text-gray-700' />
          </Button>
        </div>
      </div>

      <div className='px-4 pt-4 space-y-3'>
        <article className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
          <MarkdownBody
            source={markdown}
            className='max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]'
          />
        </article>

        <div
          className='bg-white px-4 py-3 border rounded-2xl shadow-sm'
          style={{ borderColor: BRAND.divider }}
        >
          <div className='flex items-center gap-3 min-w-0'>
            <div className='w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shrink-0'>
              <ImageWithFallback
                src={factory?.image ?? ''}
                fallbackSrc={item.factoryImageUrl ?? ''}
                alt={item.factoryName}
                className='w-full h-full object-cover'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1.5'>
                <p className='text-[13px] font-bold truncate' style={{ color: BRAND.ink }}>
                  {item.factoryName}
                </p>
                {factory?.verified && (
                  <BadgeCheck className='w-4 h-4 shrink-0' style={{ color: BRAND.purple }} />
                )}
              </div>
              <p className='text-[11px] text-gray-500 mt-0.5 inline-flex items-center gap-1'>
                <MapPin className='w-3 h-3' /> {factory?.location ?? '-'}
              </p>
            </div>
            <button
              type='button'
              onClick={() => void toggleFavorite(item.id)}
              className='inline-flex items-center gap-1 text-[11px] text-gray-500'
            >
              <Heart className={`w-3 h-3 ${isLiked(item.id) ? 'text-red-500 fill-red-500' : ''}`} style={isLiked(item.id) ? undefined : { color: BRAND.orange }} />
              {item.likes + (isLiked(item.id) ? 1 : 0)}
            </button>
          </div>
          <div className='mt-3 flex gap-2'>
            {canChat ? (
              <Button
                variant='unstyled'
                type='button'
                onClick={() =>
                  void startChat(item.factoryId, {
                    type: 'ID',
                    id: Number(resolvedId),
                    title: item.title,
                  })
                }
                disabled={starting}
                className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-bold text-white disabled:opacity-70'
                style={{ background: BRAND.purple }}
              >
                {starting ? (
                  <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
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
              className={`inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-2.5 text-[11px] font-semibold border ${canChat ? '' : 'flex-1'}`}
              style={{
                borderColor: 'rgba(122,75,148,0.30)',
                color: BRAND.purple,
              }}
            >
              โปรไฟล์ <ArrowUpRight className='w-3 h-3' />
            </Button>
          </div>
        </div>

        <RelatedShowcasesSection
          linkedShowcases={item.linkedShowcases}
          onItemClick={(s) =>
            navigate(
              s.contentType === 'promotion'
                ? `/factory-ideas/promotions/${s.id}`
                : `/factory-ideas/products/${s.id}`,
            )
          }
        />

        <section className='bg-white rounded-2xl border border-gray-100 shadow-sm p-4'>
          <h2 className='text-[14px] font-bold mb-3' style={{ color: 'var(--brand-navy)' }}>
            บทความที่น่าสนใจให้อ่านต่อ
          </h2>
          <div className='space-y-3'>
            {relatedIdeas.map((next) => {
              const relFactory = data.factories.find((f) => f.id === next.factoryId);
              const excerpt = next.excerpt || next.description || '';
              return (
                <article
                  key={next.id}
                  className='bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer p-3'
                  onClick={() =>
                    navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)
                  }
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <span
                      className='px-2 py-0.5 rounded-full text-[9px] font-bold text-white'
                      style={{ backgroundColor: CARD.purple }}
                    >
                      ไอเดีย
                    </span>
                    <span className='text-[10px] text-gray-400 truncate'>{next.factoryName}</span>
                  </div>
                  <h3
                    className='text-[13px] font-bold leading-[19px] line-clamp-2'
                    style={{ color: CARD.blue }}
                  >
                    {next.title}
                  </h3>
                  <p className='text-[11px] leading-[16px] text-gray-500 mt-1 line-clamp-3'>
                    {excerpt || ' '}
                  </p>
                  <div className='pt-2 mt-2 border-t border-gray-100'>
                    <div className='h-[18px] mb-1 min-w-0'>
                      {next.factoryName ? (
                        <Button
                          variant='unstyled'
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/factories/${next.factoryId}`);
                          }}
                          className='flex items-center gap-1 w-full text-left text-[10px] font-semibold active:opacity-80 min-w-0'
                          style={{ color: CARD.blue }}
                        >
                          <span className='truncate'>{next.factoryName}</span>
                          {relFactory?.verified && (
                            <BadgeCheck
                              className='w-3 h-3 shrink-0'
                              style={{ color: CARD.purple }}
                            />
                          )}
                        </Button>
                      ) : null}
                    </div>
                    <div className='flex items-center justify-between min-w-0'>
                      <span className='text-[10px] text-gray-400 shrink-0'>
                        MOQ{' '}
                        <span className='font-semibold tabular-nums' style={{ color: CARD.blue }}>
                          {next.minOrder}
                        </span>
                      </span>
                      <button
                        type='button'
                        onClick={(e) => { e.stopPropagation(); void toggleFavorite(next.id); }}
                        className='flex items-center gap-1 shrink-0 text-[10px] text-gray-400'
                      >
                        <Heart className={`w-3 h-3 shrink-0 ${isLiked(next.id) ? 'text-red-500 fill-red-500' : ''}`} />
                        <span className='tabular-nums font-medium text-gray-500'>{next.likes + (isLiked(next.id) ? 1 : 0)}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
