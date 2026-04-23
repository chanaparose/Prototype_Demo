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

export function IdeaDetailDesktop() {
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
      <div className="hidden min-h-[calc(100vh-4rem)] items-center justify-center lg:flex" style={{ background: '#F8F6FA' }}>
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" aria-hidden />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className="hidden lg:block px-8 pt-8 pb-20 min-h-[calc(100vh-4rem)]" style={{ background: '#F8F6FA' }}>
        <button type="button" onClick={handleBack} className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#7A4B94' }}>
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">💡</p>
          <p className="text-[14px] text-gray-500 font-medium">{error || 'ไม่พบบทความไอเดีย'}</p>
        </div>
      </div>
    );
  }

  const isSelfFactory = String(user?.id ?? '') === String(item.factoryId ?? '');
  const canChat = !isSelfFactory && String(item.factoryId ?? '').trim() !== '';

  return (
    <div className="hidden lg:block min-h-[calc(100vh-4rem)]" style={{ background: '#F8F6FA' }}>
      <div className="relative h-72 overflow-hidden bg-gray-200">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <button type="button" onClick={handleBack} className="absolute top-5 left-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 border border-white/20 text-white text-[13px] font-medium">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>

        {canChat ? (
          <button
            type="button"
            onClick={() => void startChat(item.factoryId, { type: 'ID', id: Number(resolvedId), title: item.title })}
            disabled={starting}
            className="absolute top-5 right-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[13px] font-bold shadow-md disabled:opacity-70"
            style={{ color: '#7A4B94' }}
          >
            {starting ? <span className="w-4 h-4 border-2 border-[#7A4B94] border-t-transparent rounded-full animate-spin" /> : <MessageCircle className="w-4 h-4" />} แชทกับโรงงาน
          </button>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 px-8 pb-7">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white mb-3" style={{ background: 'rgba(122,75,148,0.90)' }}>
            <Lightbulb className="w-3 h-3" /> บทความไอเดีย
          </span>
          <h1 className="text-[26px] font-bold text-white leading-snug max-w-3xl">{item.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-white/75 text-[12px]">
            <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> เผยแพร่ {formatThaiDate(item.postedAt)}</span>
            <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 text-white text-[11px] font-semibold px-2.5 py-0.5">{item.category}</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <article className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-3">บทความ</p>
            <MarkdownBody source={item.content || ''} className="max-w-none !text-[16px] md:!text-[17px] leading-8 text-gray-800 [&_h1]:!text-[30px] [&_h2]:!text-[24px] [&_h3]:!text-[20px]" />
          </article>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-3" style={{ color: '#9D77B2' }}>โรงงานที่โพสต์</p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                  <ImageWithFallback src={factory?.image ?? ''} alt={item.factoryName} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-bold truncate" style={{ color: '#2E2252' }}>{item.factoryName}</p>
                    {factory?.verified && <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#7A4B94' }} />}
                  </div>
                  <p className="text-[12px] text-gray-500 truncate mt-0.5">{factory?.specialization}</p>
                  <p className="text-[12px] text-gray-500 mt-1 inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {factory?.location ?? '-'}</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border" style={{ borderColor: 'rgba(122,75,148,0.30)', color: '#7A4B94' }}>
                ดูโปรไฟล์โรงงาน <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-[16px] font-bold mb-4" style={{ color: '#2E2252' }}>บทความที่น่าสนใจให้อ่านต่อ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedIdeas.map((next) => {
                const relFactory = data.factories.find((f) => f.id === next.factoryId);
                const excerpt = next.excerpt || next.description || '';
                return (
                  <article
                    key={next.id}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    onClick={() => navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)}
                  >
                    <div className="relative h-36 overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={next.image}
                        alt={next.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: CARD.purple }}
                        >
                          ไอเดีย
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={11} className="text-white" />
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-2 min-h-0">
                      <div className="min-w-0">
                        <h3 className="text-[12px] font-bold line-clamp-2 leading-snug" style={{ color: CARD.blue }}>{next.title}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{excerpt || ' '}</p>
                      </div>
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/factories/${next.factoryId}`);
                          }}
                          className="flex items-center gap-1 w-full min-w-0 text-left text-[10px] font-semibold transition-colors hover:opacity-90"
                          style={{ color: CARD.blue }}
                        >
                          <span className="truncate">{next.factoryName}</span>
                          {relFactory?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: CARD.purple }} />}
                        </button>
                        <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
                          <span className="min-w-0 truncate">
                            MOQ{' '}
                            <span className="font-semibold tabular-nums" style={{ color: CARD.blue }}>
                              {next.minOrder}
                            </span>
                          </span>
                          <span className="flex items-center gap-0.5 shrink-0 tabular-nums">
                            <Heart className="w-2.5 h-2.5 shrink-0" />
                            {next.likes}
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
    </div>
  );
}
