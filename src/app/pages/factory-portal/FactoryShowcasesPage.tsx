import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Plus, Pencil, Trash2, Heart, ImageIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { showcasesApi } from '../../services/api';
import { FactoryPageHeader } from './components/FactoryPageHeader';
import { ImageWithFallback } from '../../components/shared/ImageWithFallback';

type Row = Record<string, unknown>;
type ShowcaseType = 'PD' | 'PM' | 'ID';
type ShowcaseStatus = 'DR' | 'AC' | 'HI' | 'AR';

const TAB_META = {
  PD: { icon: '🏷', label: 'สินค้า', btnLabel: 'เพิ่มสินค้า', empty: 'ยังไม่มีสินค้า' },
  PM: { icon: '🎁', label: 'โปรโมชัน', btnLabel: 'เพิ่มโปรโมชัน', empty: 'ยังไม่มีโปรโมชัน' },
  ID: { icon: '💡', label: 'ไอเดีย', btnLabel: 'เพิ่มไอเดีย', empty: 'ยังไม่มีไอเดีย' },
} as const;

const STATUS_META: Record<ShowcaseStatus, { label: string; bg: string; color: string }> = {
  DR: { label: 'ร่าง', bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
  AC: { label: 'Active', bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  HI: { label: 'ซ่อน', bg: 'rgba(245,158,11,0.12)', color: '#D97706' },
  AR: { label: 'Archived', bg: 'rgba(107,114,128,0.10)', color: '#9CA3AF' },
};

function rowId(r: Row): string {
  return String(r.showcase_id ?? r.id ?? '');
}

function firstImage(r: Row): string | undefined {
  const direct = String(r.image_url ?? '').trim();
  if (direct) return direct;
  const imgs = r.images ?? r.image_urls;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const f = imgs[0];
    if (typeof f === 'string') return f;
    if (f && typeof f === 'object') {
      return String((f as Record<string, unknown>).url ?? (f as Record<string, unknown>).image_url ?? '');
    }
  }
  return undefined;
}

function contextLine(r: Row, type: ShowcaseType): string {
  const parts: string[] = [];
  const moq = Number(r.moq ?? 0);
  const price = Number(r.base_price ?? 0);
  const promo = Number(r.promo_price ?? 0);
  const lead = Number(r.lead_time_days ?? 0);
  if (moq > 0) parts.push(`MOQ ${moq.toLocaleString()}`);
  if (type === 'PM' && promo > 0) parts.push(`฿${promo.toLocaleString('th-TH')} (โปร)`);
  else if (price > 0) parts.push(`฿${price.toLocaleString('th-TH')}`);
  if (lead > 0 && type !== 'ID') parts.push(`${lead} วัน`);
  return parts.join(' · ');
}

function asPositiveInt(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function FactoryShowcasesPage() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialType = ((): ShowcaseType => {
    const t = searchParams.get('type');
    return t === 'PM' || t === 'ID' ? t : 'PD';
  })();

  const [activeType, setActiveType] = useState<ShowcaseType>(initialType);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const changeType = (type: ShowcaseType) => {
    setActiveType(type);
    setSearchParams({ type }, { replace: true });
  };

  const load = useCallback(async () => {
    if (fid == null) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const raw = await showcasesApi.listByFactory(fid, activeType);
      setRows(Array.isArray(raw) ? (raw as Row[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [fid, activeType]);

  useEffect(() => { void load(); }, [load]);

  const remove = async (r: Row) => {
    const id = rowId(r);
    if (!id || !window.confirm(`ลบ "${String(r.title ?? 'รายการนี้')}" ออก?`)) return;
    setDeletingId(id);
    setError('');
    try {
      await showcasesApi.delete(id);
      setRows((prev) => prev.filter((row) => rowId(row) !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  if (fid == null) {
    return <p className="text-sm text-red-600 px-4 py-3 bg-red-50 rounded-xl">บัญชีนี้ไม่ใช่โรงงาน</p>;
  }

  const { btnLabel, empty, icon } = TAB_META[activeType];

  return (
    <div className="space-y-4">
      <FactoryPageHeader
        title="โชว์เคสของฉัน"
        subtitle="Factory Portal"
        icon={Sparkles}
        count={`${rows.length} รายการ`}
        action={{ label: btnLabel, to: `/factory/showcases/new?type=${activeType}` }}
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
        {(['PD', 'PM', 'ID'] as ShowcaseType[]).map((type) => {
          const meta = TAB_META[type];
          const active = activeType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => changeType(type)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] transition-all"
              style={{
                backgroundColor: active ? '#4F46E5' : 'transparent',
                color: active ? '#fff' : '#334155',
                fontWeight: active ? 700 : 500,
                boxShadow: active ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
              }}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      ) : null}

      {/* Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 bg-white">
              <div className="aspect-video bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-1/2" />
                <div className="h-8 bg-gray-100 rounded-xl animate-pulse mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-14 text-center space-y-4">
          <div className="text-5xl">{icon}</div>
          <p className="text-base font-bold" style={{ color: '#2E2252' }}>{empty}</p>
          <p className="text-sm text-gray-400">กดปุ่มด้านล่างเพื่อเริ่มต้น</p>
          <button
            type="button"
            onClick={() => navigate(`/factory/showcases/new?type=${activeType}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            {btnLabel}
          </button>
        </div>
      ) : (
        /* Card grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r) => {
            const id = rowId(r);
            const img = firstImage(r);
            const statusKey = String(r.status ?? 'DR').toUpperCase() as ShowcaseStatus;
            const { label: statusLabel, bg: statusBg, color: statusColor } = STATUS_META[statusKey] ?? STATUS_META.DR;
            const ctx = contextLine(r, activeType);
            const catLine = [r.category_name, r.sub_category_name].filter(Boolean).join(' › ');
            const isDeleting = deletingId === id;
            const isIdea = activeType === 'ID';
            const likes = asPositiveInt(r.like_count ?? r.likes ?? r.likes_count);

            return (
              <article
                key={id}
                className="group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                {!isIdea ? (
                  <>
                    {/* Cover */}
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {img ? (
                        <ImageWithFallback
                          src={img}
                          alt={String(r.title ?? '')}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                          <ImageIcon size={28} strokeWidth={1.5} />
                          <span className="text-[10px]">ไม่มีภาพ</span>
                        </div>
                      )}
                      <span
                        className="absolute top-2 left-2 rounded-full text-[11px] font-semibold px-2.5 py-0.5"
                        style={{ backgroundColor: statusBg, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="px-3 pt-3 pb-2">
                      <p className="font-semibold text-sm line-clamp-2 min-h-[40px] leading-snug text-slate-900">
                        {String(r.title ?? '—')}
                      </p>
                      {ctx ? (
                        <p className="text-[11px] font-medium mt-1.5 text-indigo-600">{ctx}</p>
                      ) : null}
                      {catLine ? (
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{catLine}</p>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-violet-600">
                        ไอเดีย
                      </span>
                      <span
                        className="rounded-full text-[10px] font-semibold px-2 py-0.5"
                        style={{ backgroundColor: statusBg, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="font-semibold text-sm line-clamp-2 leading-snug text-slate-900 min-h-[40px]">
                      {String(r.title ?? '—')}
                    </p>
                    <div className="border-t border-gray-100 mt-3 pt-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
                        <p className="min-w-0 flex-1 text-xs font-semibold text-[#2E2252] line-clamp-1">
                          {String(r.factory_name ?? user?.factory_name ?? user?.name ?? 'โรงงานของคุณ')}
                        </p>
                         
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 px-3 pb-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/factory/showcases/${id}/edit`, {
                        state: { from: `${location.pathname}${location.search}` },
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}
                  >
                    <Pencil size={13} />
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(r)}
                    disabled={isDeleting}
                    className="p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                    aria-label="ลบ"
                    title="ลบ"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
