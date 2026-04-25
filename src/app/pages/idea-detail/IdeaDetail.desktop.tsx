import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Heart,
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
      <div className="px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <button
              type="button"
              onClick={handleBack}
              className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: '#7A4B94' }}
            >
              <ArrowLeft className="w-4 h-4" /> กลับ
            </button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-100 shrink-0">
                  <ImageWithFallback
                    src={factory?.image ?? ''}
                    alt={item.factoryName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-bold truncate" style={{ color: '#2E2252' }}>
                      {item.factoryName}
                    </p>
                    {factory?.verified && <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#7A4B94' }} />}
                  </div>
                  <p className="text-[12px] text-gray-500 truncate mt-0.5">{factory?.specialization || 'โรงงานผู้ผลิต'}</p>
                  <p className="text-[12px] text-gray-500 mt-1 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {factory?.location ?? '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canChat ? (
                  <button
                    type="button"
                    onClick={() =>
                      void startChat(item.factoryId, { type: 'ID', id: Number(resolvedId), title: item.title })
                    }
                    disabled={starting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-70"
                    style={{ background: '#7A4B94' }}
                  >
                    {starting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}{' '}
                    แชทกับโรงงาน
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate(`/factories/${item.factoryId}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border"
                  style={{ borderColor: 'rgba(122,75,148,0.30)', color: '#7A4B94' }}
                >
                  ดูโปรไฟล์โรงงาน <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h1 className="mt-5 text-[30px] leading-tight font-bold" style={{ color: '#2E2252' }}>
              {item.title}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-[12px] text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> เผยแพร่ {formatThaiDate(item.postedAt)}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 font-semibold px-2.5 py-0.5">
                {item.category || 'บทความไอเดีย'}
              </span>
            </div>
          </section>

          <article className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <MarkdownBody
              source={item.content || ''}
              className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
            />
          </article>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-[16px] font-bold mb-4" style={{ color: '#2E2252' }}>บทความที่น่าสนใจให้อ่านต่อ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedIdeas.map((next) => {
                const relFactory = data.factories.find((f) => f.id === next.factoryId);
                const excerpt = next.excerpt || next.description || '';
                return (
                  <article
                    key={next.id}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 p-4"
                    onClick={() => navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: CARD.purple }}>
                        ไอเดีย
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">{next.factoryName}</span>
                    </div>
                    <h3 className="text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#A656A0] transition-colors" style={{ color: CARD.blue }}>
                      {next.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 mt-1 line-clamp-3">{excerpt || ' '}</p>
                    <div className="pt-2 mt-3 border-t border-gray-100 space-y-1.5">
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
