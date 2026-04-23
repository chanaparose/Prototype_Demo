import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Heart,
  Lightbulb,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { ImageWithFallback } from '../../components/shared';
import { useIdeaDetailShowcase } from '../../hooks/useShowcaseDetailPage';
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useAuth } from '../../contexts/AuthContext';
import { useData, type FactoryShowcase } from '../../contexts/DataContext';
import { MarkdownBody } from '../../shared/markdown/MarkdownBody';
import { showcasesApi } from '../../services/api';
import { normShowcase } from '../../hooks/useShowcases';

const CARD = {
  purple: '#7A4B94',
  blue: '#2E2252',
} as const;

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function IdeaDetailMobile() {
  const navigate = useNavigate();
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
          .map((r) => normShowcase((r ?? {}) as Record<string, unknown>))
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
      <div className="flex min-h-[50vh] items-center justify-center px-4 pb-20 pt-8">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button type="button" onClick={handleBack} className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: '#7A4B94' }}>
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">{error || 'ไม่พบบทความไอเดีย'}</div>
      </div>
    );
  }

  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';

  return (
    <div>
      <div className="relative h-56">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <button type="button" onClick={handleBack} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        {canChat ? (
          <button
            type="button"
            onClick={() => void startChat(item.factoryId, { type: 'ID', id: Number(resolvedId), title: item.title })}
            disabled={starting}
            className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md disabled:opacity-70"
            aria-label="แชทกับโรงงาน"
          >
            {starting ? <span className="w-4 h-4 border-2 border-[#7A4B94] border-t-transparent rounded-full animate-spin" /> : <MessageCircle className="w-5 h-5" style={{ color: '#7A4B94' }} />}
          </button>
        ) : null}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2" style={{ background: 'rgba(122,75,148,0.90)' }}>
            <Lightbulb className="w-3 h-3" /> บทความไอเดีย
          </span>
          <h1 className="text-lg leading-snug" style={{ fontWeight: 700 }}>{item.title}</h1>
          <div className="mt-1 text-[11px] text-white/85 inline-flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> เผยแพร่ {formatThaiDate(item.postedAt)}</div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-3">
        <article className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">บทความ</p>
          <MarkdownBody source={item.content || ''} className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
              />
        </article>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-3" style={{ color: '#9D77B2' }}>โรงงานที่โพสต์</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                <ImageWithFallback src={factory?.image ?? ''} alt={item.factoryName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold truncate" style={{ color: '#2E2252' }}>{item.factoryName}</p>
                  {factory?.verified && <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#7A4B94' }} />}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {factory?.location ?? '-'}</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border" style={{ borderColor: 'rgba(122,75,148,0.30)', color: '#7A4B94' }}>
              โปรไฟล์ <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-[14px] font-bold mb-3" style={{ color: '#2E2252' }}>บทความที่น่าสนใจให้อ่านต่อ</h2>
          <div className="grid grid-cols-2 gap-3">
            {relatedIdeas.map((next) => {
              const relFactory = data.factories.find((f) => f.id === next.factoryId);
              const excerpt = next.excerpt || next.description || '';
              return (
                <article
                  key={next.id}
                  className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                  onClick={() => navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)}
                >
                  <div className="relative h-[150px] shrink-0 bg-gray-100">
                    <ImageWithFallback
                      src={next.image}
                      alt={next.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                    <span
                      className="absolute top-2 left-2 z-[1] px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: CARD.purple }}
                    >
                      ไอเดีย
                    </span>
                  </div>
                  <div className="p-3 flex flex-col flex-1 min-w-0">
                    <h3
                      className="text-xs font-bold leading-[18px] line-clamp-2 min-h-[36px]"
                      style={{ color: CARD.blue }}
                    >
                      {next.title}
                    </h3>
                    <p className="text-[10px] leading-[14px] text-gray-400 mt-1 line-clamp-2 min-h-[28px]">
                      {excerpt || ' '}
                    </p>
                    <div className="mt-auto pt-2 border-t border-gray-100">
                      <div className="h-[18px] mb-1 min-w-0">
                        {next.factoryName ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/factories/${next.factoryId}`);
                            }}
                            className="flex items-center gap-1 w-full text-left text-[10px] font-semibold active:opacity-80 min-w-0"
                            style={{ color: CARD.blue }}
                          >
                            <span className="truncate">{next.factoryName}</span>
                            {relFactory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: CARD.purple }} />}
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between min-w-0">
                        <span className="text-[10px] text-gray-400 shrink-0">
                          MOQ{' '}
                          <span className="font-semibold tabular-nums" style={{ color: CARD.blue }}>
                            {next.minOrder}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0 text-[10px] text-gray-400">
                          <Heart className="w-3 h-3 shrink-0" />
                          <span className="tabular-nums font-medium text-gray-500">{next.likes}</span>
                        </span>
                      </div>
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
