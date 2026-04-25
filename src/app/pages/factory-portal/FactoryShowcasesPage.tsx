import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, Pencil, Trash2, ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { showcasesApi } from '../../services/api';

type Row = Record<string, unknown>;
type ShowcaseType = 'PD' | 'PM' | 'ID';
type ShowcaseStatus = 'DR' | 'AC' | 'HI' | 'AR';

const TAB_META = {
  PD: { icon: '🏷', label: 'สินค้า', btnLabel: 'เพิ่มสินค้า', empty: 'ยังไม่มีสินค้า' },
  PM: { icon: '🎁', label: 'โปรโมชัน', btnLabel: 'เพิ่มโปรโมชัน', empty: 'ยังไม่มีโปรโมชัน' },
  ID: { icon: '💡', label: 'ไอเดีย', btnLabel: 'เพิ่มไอเดีย', empty: 'ยังไม่มีไอเดีย' },
} as const;

const STATUS_META: Record<ShowcaseStatus, { label: string; cls: string }> = {
  DR: { label: 'ร่าง', cls: 'bg-gray-100 text-gray-600' },
  AC: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' },
  HI: { label: 'ซ่อน', cls: 'bg-amber-100 text-amber-700' },
  AR: { label: 'Archived', cls: 'bg-gray-200 text-gray-500' },
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

export function FactoryShowcasesPage() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const navigate = useNavigate();
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
    <div className="space-y-5 pb-12">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">โชว์เคส</h2>
          <p className="text-xs text-gray-500 mt-0.5">จัดการสินค้า โปรโมชัน และไอเดียของคุณ</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/factory/showcases/new?type=${activeType}`)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shrink-0 shadow-sm active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
        >
          <Plus size={16} />
          {btnLabel}
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1">
        {(['PD', 'PM', 'ID'] as ShowcaseType[]).map((type) => {
          const meta = TAB_META[type];
          const active = activeType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => changeType(type)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      ) : null}

      {/* ── Skeleton ── */}
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
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60">
          <span className="text-5xl mb-3">{icon}</span>
          <p className="text-sm font-semibold text-gray-700">{empty}</p>
          <p className="text-xs text-gray-400 mt-1 mb-5">กดปุ่มด้านล่างเพื่อเริ่มต้น</p>
          <button
            type="button"
            onClick={() => navigate(`/factory/showcases/new?type=${activeType}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
          >
            <Plus size={15} />
            {btnLabel}
          </button>
        </div>
      ) : (
        /* ── Card grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r) => {
            const id = rowId(r);
            const img = firstImage(r);
            const statusKey = String(r.status ?? 'DR').toUpperCase() as ShowcaseStatus;
            const { label: statusLabel, cls: statusCls } = STATUS_META[statusKey] ?? STATUS_META.DR;
            const ctx = contextLine(r, activeType);
            const catLine = [r.category_name, r.sub_category_name].filter(Boolean).join(' › ');
            const isDeleting = deletingId === id;

            return (
              <article
                key={id}
                className="group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Cover */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {img ? (
                    <img
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
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Info */}
                <div className="px-3 pt-3 pb-2">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[40px] leading-snug">
                    {String(r.title ?? '—')}
                  </p>
                  {ctx ? (
                    <p className="text-[11px] text-orange-600 font-medium mt-1.5">{ctx}</p>
                  ) : null}
                  {catLine ? (
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{catLine}</p>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-3 pb-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/factory/showcases/${id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors"
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
