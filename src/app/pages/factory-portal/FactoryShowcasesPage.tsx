import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Plus, Pencil, Trash2, ImageIcon, Sparkles, MapPin, Star, Search, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { showcasesApi } from '@/services/api/factoryApi';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { formatCompactNumber, formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { partitionLinkedShowcases } from '@/utils/linkedShowcases';

type Row = Record<string, unknown>;
type ShowcaseType = 'PD' | 'PM' | 'ID' | 'MT';
type ShowcaseStatus = 'DR' | 'AC' | 'HI' | 'AR';

const TAB_META = {
  PD: { icon: '🏷', label: 'สินค้า', btnLabel: 'เพิ่มสินค้า', empty: 'ยังไม่มีสินค้า' },
  PM: { icon: '🎁', label: 'โปรโมชัน', btnLabel: 'เพิ่มโปรโมชัน', empty: 'ยังไม่มีโปรโมชัน' },
  ID: { icon: '💡', label: 'ไอเดีย', btnLabel: 'เพิ่มไอเดีย', empty: 'ยังไม่มีไอเดีย' },
  MT: { icon: '🧱', label: 'วัตถุดิบ', btnLabel: 'เพิ่มวัตถุดิบ', empty: 'ยังไม่มีวัตถุดิบ' },
} as const;

/** PM tab disabled on /factory/showcases */
const SHOWCASE_TAB_TYPES: ShowcaseType[] = ['PD', 'MT', 'ID'];

const STATUS_META: Record<ShowcaseStatus, { label: string; bg: string; color: string }> = {
  DR: { label: 'ร่าง', bg: 'rgba(107,114,128,0.12)', color: 'var(--neutral-subtle)' },
  AC: { label: 'Active', bg: 'rgba(16,185,129,0.12)', color: 'var(--status-success)' },
  HI: { label: 'ซ่อน', bg: 'rgba(245,158,11,0.12)', color: 'var(--status-warning-deep)' },
  AR: { label: 'Archived', bg: 'rgba(107,114,128,0.10)', color: 'var(--neutral-placeholder)' },
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
      return String(
        (f as Record<string, unknown>).url ?? (f as Record<string, unknown>).image_url ?? '',
      );
    }
  }
  const { imageUrls } = partitionLinkedShowcases(r.linked_showcases ?? r.linkedShowcases);
  if (imageUrls.length > 0) return imageUrls[0];
  return undefined;
}

function contextLine(r: Row, type: ShowcaseType): string {
  const parts: string[] = [];
  const moq = Number(r.moq ?? 0);
  const price = Number(r.base_price ?? 0);
  const promo = Number(r.promo_price ?? 0);
  const lead = Number(r.lead_time_days ?? 0);
  if (moq > 0) parts.push(`MOQ ${formatCompactNumber(moq)}`);
  if (type === 'PM' && promo > 0) parts.push(`${formatCurrencyNoDecimals(promo)} (โปร)`);
  else if (price > 0) parts.push(formatCurrencyNoDecimals(price));
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
    if (t === 'PM') return 'PD';
    return t === 'ID' || t === 'MT' ? t : 'PD';
  })();

  const [activeType, setActiveType] = useState<ShowcaseType>(initialType);
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [filterStatus, setFilterStatus] = useState<ShowcaseStatus | 'ALL'>('ALL');

  const rows = allRows.filter((r) => String(r.content_type ?? '').toUpperCase() === activeType);
  const displayRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const matchSearch = !q || String(r.title ?? '').toLowerCase().includes(q);
      const matchStatus = filterStatus === 'ALL' || String(r.status ?? 'DR').toUpperCase() === filterStatus;
      return matchSearch && matchStatus;
    });
    const toTs = (r: Row): number => {
      const raw = String(r.created_at ?? r.updated_at ?? r.published_at ?? '');
      const ts = Date.parse(raw);
      return Number.isFinite(ts) ? ts : 0;
    };
    return [...filtered].sort((a, b) => {
      const diff = toTs(b) - toTs(a);
      return sortDir === 'desc' ? diff : -diff;
    });
  }, [rows, search, sortDir, filterStatus]);

  const changeType = (type: ShowcaseType) => {
    setActiveType(type);
    setSearchParams({ type }, { replace: true });
  };

  const load = useCallback(async () => {
    if (fid == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const raw = await showcasesApi.listByFactory(fid);
      setAllRows(Array.isArray(raw) ? (raw as Row[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('type') === 'PM') {
      setActiveType('PD');
      setSearchParams({ type: 'PD' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const remove = async (r: Row) => {
    const id = rowId(r);
    if (!id || !window.confirm(`ลบ "${String(r.title ?? 'รายการนี้')}" ออก?`)) return;
    setDeletingId(id);
    setError('');
    try {
      await showcasesApi.delete(id);
      setAllRows((prev) => prev.filter((row) => rowId(row) !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  if (fid == null) {
    return <ErrorAlert>บัญชีนี้ไม่ใช่โรงงาน</ErrorAlert>;
  }

  const { btnLabel, empty, icon } = TAB_META[activeType];

  return (
    <div className='space-y-4'>
      <FactoryPageHeader
        title='โชว์เคสของฉัน'
        subtitle='Factory Portal'
        icon={Sparkles}
        count={`${rows.length} รายการ`}
        action={{ label: btnLabel, to: `/factory/showcases/new?type=${activeType}` }}
      />

      <div className='overflow-hidden rounded-2xl border border-slate-100 bg-white'>
        {/* Filter bar */}
        <div className='flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-4'>
          {/* Tabs */}
          <div className='flex min-w-0 flex-1 items-center gap-1'>
            {SHOWCASE_TAB_TYPES.map((type) => {
              const meta = TAB_META[type];
              const active = activeType === type;
              const count = allRows.filter((r) => String(r.content_type ?? '').toUpperCase() === type).length;
              return (
                <Button
                  variant='unstyled'
                  key={type}
                  type='button'
                  onClick={() => changeType(type)}
                  className='whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium flex items-center justify-center gap-1.5'
                  style={{
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    backgroundColor: active ? 'var(--brand-indigo)' : 'transparent',
                    color: active ? '#fff' : '#475569',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span>{meta.label}</span>
                  {count > 0 && (
                    <span
                      className='rounded-full px-1.5 py-0.5 text-xs font-bold'
                      style={{
                        transition: 'background-color 0.15s ease, color 0.15s ease',
                        backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                        color: active ? '#fff' : '#475569',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
            <Button
              variant='unstyled'
              type='button'
              disabled
              title='โปรโมชัน — เร็วๆ นี้'
              className='cursor-not-allowed whitespace-nowrap rounded-lg px-3 py-2 text-sm text-gray-300 flex items-center gap-1'
            >
              โปรโมชัน
              <span className='ml-1 text-[9px] text-gray-300'>เร็วๆ นี้</span>
            </Button>
          </div>

          {/* Search + filters */}
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative flex-1 min-w-[220px] sm:min-w-[280px]'>
              <Search className='pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
              <input
                type='search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='ค้นหา showcase'
                className='h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100'
              />
            </div>
 

            {/* Sort */}
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className='h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 inline-flex items-center gap-2 transition-colors hover:bg-slate-50'
              title={sortDir === 'desc' ? 'ใหม่สุด → เก่าสุด' : 'เก่าสุด → ใหม่สุด'}
            >
              <ArrowUpDown className='h-4 w-4' />
              {sortDir === 'desc' ? 'ใหม่สุด' : 'เก่าสุด'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4'>
          {error ? <ErrorAlert>{error}</ErrorAlert> : null}

          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='rounded-2xl overflow-hidden border border-gray-100 bg-white'>
              <div className='aspect-video bg-gray-100 animate-pulse' />
              <div className='p-3 space-y-2'>
                <div className='h-4 bg-gray-100 rounded-lg animate-pulse w-3/4' />
                <div className='h-3 bg-gray-100 rounded-lg animate-pulse w-1/2' />
                <div className='h-8 bg-gray-100 rounded-xl animate-pulse mt-3' />
              </div>
            </div>
          ))}
        </div>
      ) : displayRows.length === 0 ? (
        <div className='rounded-2xl border border-gray-100 bg-white px-4 py-14 text-center space-y-4'>
          <div className='text-5xl'>{icon}</div>
          <p className='text-base font-bold' style={{ color: 'var(--brand-navy)' }}>
            {empty}
          </p>
          <p className='text-sm text-gray-400'>กดปุ่มด้านล่างเพื่อเริ่มต้น</p>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate(`/factory/showcases/new?type=${activeType}`)}
            className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors'
          >
            <Plus size={15} />
            {btnLabel}
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          {displayRows.map((r) => {
                const id = rowId(r);
            const img = firstImage(r);
            const statusKey = String(r.status ?? 'DR').toUpperCase() as ShowcaseStatus;
            const {
              label: statusLabel,
              bg: statusBg,
              color: statusColor,
            } = STATUS_META[statusKey] ?? STATUS_META.DR;
            const ctx = contextLine(r, activeType);
            const catLine = [r.category_name, r.sub_category_name].filter(Boolean).join(' › ');
            const isDeleting = deletingId === id;
            const isIdea = activeType === 'ID';
            const likes = asPositiveInt(r.like_count ?? r.likes ?? r.likes_count);
            const locationLine =
              String(r.factory_location ?? r.province_name ?? catLine ?? '—').trim() || '—';
            const rating = Number(r.rating_avg ?? r.factory_rating_avg ?? 0);
            const reviews = asPositiveInt(r.review_count ?? r.reviews ?? 0);
            const moq = asPositiveInt(r.moq ?? 0);

                return (
              <article
                    key={id}
                className={
                  isIdea
                    ? 'group rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200'
                    : 'bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col'
                }
              >
                {!isIdea ? (
                  <>
                    <div className='aspect-[4/3] bg-gray-100 relative overflow-hidden'>
                      {img ? (
                        <ImageWithFallback
                          src={img}
                          alt={String(r.title ?? '')}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                        />
                      ) : (
                        <div className='w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300'>
                          <ImageIcon size={28} strokeWidth={1.5} />
                          <span className='text-[10px]'>ไม่มีภาพ</span>
                        </div>
                      )}
                      <span
                        className='absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white'
                        style={{
                          backgroundColor:
                            activeType === 'MT'
                              ? 'var(--brand-teal-light)'
                              : activeType === 'PM'
                                ? 'var(--brand-orange)'
                                : 'var(--brand-sky)',
                        }}
                      >
                        {activeType === 'MT'
                          ? 'วัตถุดิบ'
                          : activeType === 'PM'
                            ? 'โปรโมชัน'
                            : 'สินค้า'}
                      </span>
                      </div>
                    <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                      <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                        {String(r.title ?? '—')}
                      </p>
                      <div className='flex items-center gap-0.5 mt-0.5'>
                        <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                        <span className='text-gray-500 text-[10px] truncate'>{locationLine}</span>
                      </div>
                      <div className='mt-auto pt-1 border-t border-gray-50'>
                        <div className='flex items-center justify-between min-w-0'>
                          <div className='flex items-center gap-0.5 min-w-0'>
                            <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                            <span className='text-gray-700 text-[10px] font-semibold'>
                              {rating.toFixed(1)}
                            </span>
                            <span className='text-gray-400 text-[9px] truncate'>({reviews})</span>
                          </div>
                          <span className='text-gray-400 text-[8px] shrink-0'>ขั้นต่ำ {moq}</span>
                        </div>
                    </div>
                    </div>
                  </>
                ) : (
                  <div className='px-3 pt-3 pb-2'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span className='px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-violet-600'>
                        ไอเดีย
                      </span>
                      <span
                        className='rounded-full text-[10px] font-semibold px-2 py-0.5'
                        style={{ backgroundColor: statusBg, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className='font-semibold text-sm line-clamp-2 leading-snug text-slate-900 min-h-[40px]'>
                            {String(r.title ?? '—')}
                          </p>
                    <div className='border-t border-gray-100 mt-3 pt-2'>
                      <div className='flex items-center justify-between gap-2 text-[11px] text-gray-500'>
                        <p className='min-w-0 flex-1 text-xs font-semibold text-brand-navy line-clamp-1'>
                          {String(
                            r.factory_name ?? user?.factory_name ?? user?.name ?? 'โรงงานของคุณ',
                          )}
                        </p>
                      </div>
                    </div>
                          </div>
                )}

                <div className='flex gap-2 px-3 pb-3'>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() =>
                      navigate(`/factory/showcases/${id}/edit`, {
                        state: { from: `${location.pathname}${location.search}` },
                      })
                    }
                    className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors'
                    style={{ backgroundColor: '#EEF2FF', color: 'var(--brand-indigo-dark)' }}
                  >
                    <Pencil size={13} />
                    แก้ไข
                  </Button>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => void remove(r)}
                    disabled={isDeleting}
                    className='p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40'
                    aria-label='ลบ'
                    title='ลบ'
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </article>
                      );
                    })}
        </div>
        )}
        </div>{/* /Content */}
      </div>{/* /outer card */}
    </div>
  );
}
