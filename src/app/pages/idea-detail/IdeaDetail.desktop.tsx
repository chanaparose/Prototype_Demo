import React, { useCallback, useEffect, useState } from 'react';
import {
  SHOWCASE_DETAIL_BRAND as BRAND,
  formatShowcaseThaiDate as formatThaiDate,
} from '@/components/features/showcase-detail/showcaseDetailShared';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight as Chevron,
  Heart,
  Lightbulb,
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

export function IdeaDetailDesktop() {
  const navigate = useNavigate();
  const { isLiked, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const data = useData();
  const { startChat, starting } = useStartChatWithFactory();
  const { item, loading, error, factory, resolvedId } = useIdeaDetailShowcase();
  const [relatedIdeas, setRelatedIdeas] = useState<FactoryShowcase[]>([]);

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

  if (loading) {
    return (
      <div className='hidden min-h-[calc(100vh-4rem)] items-center justify-center lg:flex bg-white'>
        <span
          className='h-10 w-10 animate-spin rounded-full border-2 border-purple-600 border-t-transparent'
          aria-hidden
        />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className='hidden lg:block px-8 pt-8 pb-20 min-h-[calc(100vh-4rem)] bg-white'>
        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          aria-label='กลับไป'
          className='mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium'
          style={{ color: BRAND.purple }}
        >
          <ArrowLeft className='w-4 h-4' /> กลับ
        </Button>
        <div className='bg-white rounded-xl border border-slate-100 p-10 text-center'>
          <Lightbulb size={38} className='mx-auto mb-3 text-gray-400' />
          <p className='text-[14px] text-gray-500 font-medium'>{error || 'ไม่พบบทความไอเดีย'}</p>
        </div>
      </div>
    );
  }

  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';
  const markdown = String(item.content ?? '').trim();
  const subName = item.sub_category_name?.trim() ?? null;

  return (
    <div className='hidden lg:block min-h-[calc(100vh-4rem)] bg-white'
    >
      <div className='px-8 pt-5 pb-3 border-b border-slate-100'>
        <div className='flex items-center gap-1.5 text-[12px] text-gray-500'>
          <Button
            variant='unstyled'
            type='button'
          onClick={handleBack}
            className='inline-flex items-center gap-1 font-medium hover:opacity-80'
            style={{ color: BRAND.purple }}
          >
            <ArrowLeft className='w-3.5 h-3.5' /> กลับ
          </Button>
          <Chevron className='w-3 h-3 text-gray-300' />
          <span>{item.category || 'บทความไอเดีย'}</span>
          {subName ? (
            <>
              <Chevron className='w-3 h-3 text-gray-300' />
              <span>{subName}</span>
            </>
        ) : null}
          <Chevron className='w-3 h-3 text-gray-300' />
          <span className='truncate max-w-[32rem]' style={{ color: BRAND.ink }}>
            {item.title}
          </span>
        </div>
      </div>

      <div className='px-8 pb-10 space-y-3 pt-5'>
        <div className='bg-white rounded-xl border border-slate-100 p-4'>
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[11px] font-semibold text-brand-magenta'>
                บทความไอเดีย
              </span>
              {item.category ? (
                <span className='inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium text-gray-500 border border-gray-200'>
                  {item.category}
                </span>
              ) : null}
            </div>

            <h1 className='text-[28px] leading-tight font-bold' style={{ color: BRAND.ink }}>
              {item.title}
            </h1>

            <div className='inline-flex items-center gap-1.5 text-[12px] text-gray-500'>
              <CalendarDays className='w-3.5 h-3.5' />
              เผยแพร่ {formatThaiDate(item.postedAt)}
            </div>
          </div>
        </div>

        <article className='bg-white rounded-xl p-8 border border-slate-100'>
          <MarkdownBody
            source={markdown}
            className='max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]'
          />
        </article>

        <div className='rounded-xl border border-slate-100 p-3 bg-white'>
          <div className='flex items-center gap-3 min-w-0'>
            <div className='w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0'>
              <ImageWithFallback
                src={factory?.image ?? ''}
                fallbackSrc={item.factoryImageUrl ?? ''}
                alt={item.factoryName}
                className='w-full h-full object-cover'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1.5'>
                <p className='text-[20px] font-bold truncate' style={{ color: BRAND.ink }}>
                  {item.factoryName}
                </p>
                {factory?.verified ? (
                  <BadgeCheck className='w-3.5 h-3.5 shrink-0' style={{ color: BRAND.purple }} />
                ) : null}
              </div>
              <p className='text-[14px] text-gray-500 truncate'>
                {factory?.specialization || 'โรงงานผู้ผลิต'}
              </p>
              <p className='text-[13px] text-gray-500 mt-0.5 inline-flex items-center gap-1'>
                <MapPin className='w-3.5 h-3.5' /> {factory?.location ?? '-'}
              </p>
            </div>
          </div>

          <div className='mt-3 grid grid-cols-2 gap-2'>
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
                className='inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold text-white disabled:opacity-70'
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
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold border ${canChat ? '' : 'col-span-2'}`}
              style={{
                borderColor: 'rgba(122,75,148,0.30)',
                color: BRAND.purple,
              }}
            >
              ดูโปรไฟล์โรงงาน <ArrowUpRight className='w-4 h-4' />
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

        <section className='bg-white rounded-xl border border-slate-100 p-6'>
          <h2 className='text-[16px] font-bold mb-4' style={{ color: 'var(--brand-navy)' }}>
            บทความที่น่าสนใจให้อ่านต่อ
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {relatedIdeas.map((next) => {
              const relFactory = data.factories.find((f) => f.id === next.factoryId);
              const excerpt = next.excerpt || next.description || '';
              return (
                <article
                  key={next.id}
                  className='group bg-white rounded-xl border border-slate-100 cursor-pointer hover:shadow-md transition-all duration-200 p-4'
                  onClick={() =>
                    navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)
                  }
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='inline-flex items-center rounded-full bg-brand-lavender-chip px-2 py-0.5 text-[9px] font-bold text-brand-magenta'>
                      ไอเดีย
                    </span>
                    <span className='text-[10px] text-gray-400 truncate'>{next.factoryName}</span>
                  </div>
                  <h3
                    className='text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-brand-magenta transition-colors'
                    style={{ color: CARD.blue }}
                  >
                    {next.title}
                  </h3>
                  <p className='text-[12px] text-gray-500 mt-1 line-clamp-3'>{excerpt || ' '}</p>
                  <div className='pt-2 mt-3 border-t border-gray-100 space-y-1.5'>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/factories/${next.factoryId}`);
                      }}
                      className='flex items-center gap-1 w-full min-w-0 text-left text-[10px] font-semibold transition-colors hover:opacity-90'
                      style={{ color: CARD.blue }}
                    >
                      <span className='truncate'>{next.factoryName}</span>
                      {relFactory?.verified ? (
                        <BadgeCheck className='w-3 h-3 shrink-0' style={{ color: CARD.purple }} />
                      ) : null}
                    </Button>
                    <div className='flex items-center justify-between gap-2 text-[10px] text-gray-400'>
                      <span className='min-w-0 truncate'>
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
                        className='flex items-center gap-0.5 shrink-0 tabular-nums'
                      >
                        <Heart
                          className={`w-2.5 h-2.5 shrink-0 ${isLiked(next.id) ? 'text-red-500 fill-red-500' : ''}`}
                        />
                        {next.likes + (isLiked(next.id) ? 1 : 0)}
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
