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
import { RelatedShowcasesSection } from '../../components/features/idea-detail/RelatedShowcasesSection';

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
    <div className="pb-8">
      <div className="px-4 pt-4">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <button type="button" onClick={handleBack} className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: '#7A4B94' }}>
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
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
                <p className="text-[11px] text-gray-500 mt-0.5 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {factory?.location ?? '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {canChat ? (
                <button
                  type="button"
                  onClick={() => void startChat(item.factoryId, { type: 'ID', id: Number(resolvedId), title: item.title })}
                  disabled={starting}
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-70"
                  style={{ background: '#7A4B94' }}
                  aria-label="แชทกับโรงงาน"
                >
                  {starting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                </button>
              ) : null}
              <button type="button" onClick={() => navigate(`/factories/${item.factoryId}`)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border" style={{ borderColor: 'rgba(122,75,148,0.30)', color: '#7A4B94' }}>
                โปรไฟล์ <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <h1 className="text-[21px] leading-tight mt-4" style={{ fontWeight: 700, color: '#2E2252' }}>{item.title}</h1>
          <div className="mt-2 text-[11px] text-gray-500 inline-flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" /> เผยแพร่ {formatThaiDate(item.postedAt)}
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5">
              {item.category || 'บทความไอเดีย'}
            </span>
          </div>
        </section>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <article className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <MarkdownBody
            source={item.content || ''}
            className="max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]"
          />
        </article>

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

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-[14px] font-bold mb-3" style={{ color: '#2E2252' }}>บทความที่น่าสนใจให้อ่านต่อ</h2>
          <div className="space-y-3">
            {relatedIdeas.map((next) => {
              const relFactory = data.factories.find((f) => f.id === next.factoryId);
              const excerpt = next.excerpt || next.description || '';
              return (
                <article
                  key={next.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer p-3"
                  onClick={() => navigate(`/idea-detail?showcase_id=${encodeURIComponent(next.id)}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: CARD.purple }}
                    >
                      ไอเดีย
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">{next.factoryName}</span>
                  </div>
                  <h3
                    className="text-[13px] font-bold leading-[19px] line-clamp-2"
                    style={{ color: CARD.blue }}
                  >
                    {next.title}
                  </h3>
                  <p className="text-[11px] leading-[16px] text-gray-500 mt-1 line-clamp-3">
                    {excerpt || ' '}
                  </p>
                  <div className="pt-2 mt-2 border-t border-gray-100">
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
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
