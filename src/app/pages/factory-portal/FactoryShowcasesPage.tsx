import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Sparkles,
  MapPin,
  Star,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { showcasesApi } from '@/services/api/factoryApi';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import {
  FactoryStatusBadge,
  type FactoryStatusTone,
} from '@/pages/factory-portal/components/FactoryStatusBadge';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { partitionLinkedShowcases } from '@/utils/linkedShowcases';
import { ShowcaseTypeIcon } from '@/components/factory/showcase/ShowcaseTypeIcon';
import {
  factoryBadgeClass,
  factoryButtonClass,
  factoryCardClass,
} from '@/pages/factory-portal/factoryUi';

type Row = Record<string, unknown>;
type ShowcaseType = 'PD' | 'PM' | 'ID' | 'MT';
type ShowcaseStatus = 'DR' | 'AC' | 'HI' | 'AR';

const TAB_META = {
  PD: { label: 'สินค้า', btnLabel: 'เพิ่มสินค้า', empty: 'ยังไม่มีสินค้า' },
  PM: { label: 'โปรโมชัน', btnLabel: 'เพิ่มโปรโมชัน', empty: 'ยังไม่มีโปรโมชัน' },
  ID: { label: 'ไอเดีย', btnLabel: 'เพิ่มไอเดีย', empty: 'ยังไม่มีไอเดีย' },
  MT: { label: 'วัตถุดิบ', btnLabel: 'เพิ่มวัตถุดิบ', empty: 'ยังไม่มีวัตถุดิบ' },
} as const;

/** PM tab disabled on /factory/showcases */
const SHOWCASE_TAB_TYPES: ShowcaseType[] = ['PD', 'MT', 'ID'];

const STATUS_META: Record<ShowcaseStatus, { label: string; tone: FactoryStatusTone }> = {
  DR: { label: 'ร่าง', tone: 'neutral' },
  AC: { label: 'Active', tone: 'success' },
  HI: { label: 'ซ่อน', tone: 'warning' },
  AR: { label: 'Archived', tone: 'neutral' },
};

const TYPE_TONE: Record<Exclude<ShowcaseType, 'PM'>, FactoryStatusTone> = {
  PD: 'brand',
  MT: 'teal',
  ID: 'brand',
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

  const rows = allRows.filter((r) => String(r.content_type ?? '').toUpperCase() === activeType);
  const displayRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const matchSearch =
        !q ||
        String(r.title ?? '')
          .toLowerCase()
          .includes(q);
      return matchSearch;
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
  }, [rows, search, sortDir]);

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

  const { btnLabel, empty } = TAB_META[activeType];

  return (
    <div className='space-y-4'>
      <FactoryPageHeader
        title='โชว์เคสของฉัน'
        subtitle='Factory Portal'
        icon={Sparkles}
        count={`${rows.length} รายการ`}
        action={{ label: btnLabel, to: `/factory/showcases/new?type=${activeType}` }}
        variant='minimal'
      />

      <div className={factoryCardClass({ variant: 'shell' })}>
        {/* Filter bar */}
        <div className='flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-4'>
          {/* Tabs */}
          <div className='flex min-w-0 flex-1 items-center gap-1'>
            {SHOWCASE_TAB_TYPES.map((type) => {
              const meta = TAB_META[type];
              const active = activeType === type;
              const count = allRows.filter(
                (r) => String(r.content_type ?? '').toUpperCase() === type,
              ).length;
              return (
                <Button
                  variant='unstyled'
                  key={type}
                  type='button'
                  onClick={() => changeType(type)}
                  className={factoryButtonClass({
                    variant: active ? 'primary' : 'toolbar',
                    size: 'sm',
                    className: 'whitespace-nowrap',
                  })}
                >
                  <span>{meta.label}</span>
                  {count > 0 && (
                    <span
                      className={
                        active
                          ? 'rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold text-white'
                          : factoryBadgeClass({
                              variant: 'count',
                              className: 'bg-slate-100 text-slate-600',
                            })
                      }
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
              className={factoryButtonClass({
                variant: 'toolbar',
                size: 'sm',
                className: 'cursor-not-allowed whitespace-nowrap text-gray-300',
              })}
            >
              โปรโมชัน
              <span className='text-[10px] text-gray-300'>เร็วๆ นี้</span>
            </Button>
          </div>

          {/* Search + filters */}
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative min-w-[220px] flex-1 sm:min-w-[280px]'>
              <Search className='pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
              <input
                type='search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='ค้นหา showcase'
                className='h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/15'
              />
            </div>

            {/* Sort */}
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className={factoryButtonClass({
                variant: 'toolbar',
                size: 'md',
                className: 'text-xs',
              })}
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
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className='overflow-hidden rounded-lg border border-slate-200 bg-white'
                >
                  <div className='aspect-[4/3] animate-pulse bg-slate-100' />
                  <div className='space-y-2 p-3.5'>
                    <div className='h-4 w-3/4 animate-pulse rounded-lg bg-slate-100' />
                    <div className='h-3 w-1/2 animate-pulse rounded-lg bg-slate-100' />
                    <div className='mt-3 h-8 animate-pulse rounded-lg bg-slate-100' />
                  </div>
                </div>
              ))}
            </div>
          ) : displayRows.length === 0 ? (
            <div className={factoryCardClass({ variant: 'empty', className: 'space-y-4 py-14' })}>
              <ShowcaseTypeIcon type={activeType} size={42} className='mx-auto text-slate-300' />
              <p className='text-base font-normal text-slate-900'>{empty}</p>
              <p className='text-sm text-gray-400'>กดปุ่มด้านล่างเพื่อเริ่มต้น</p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate(`/factory/showcases/new?type=${activeType}`)}
                className={factoryButtonClass({
                  variant: 'primary',
                  size: 'md',
                  className: 'gap-2',
                })}
              >
                <Plus size={15} />
                {btnLabel}
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
              {displayRows.map((r) => {
                const id = rowId(r);
                const img = firstImage(r);
                const statusKey = String(r.status ?? 'DR').toUpperCase() as ShowcaseStatus;
                const { label: statusLabel, tone: statusTone } =
                  STATUS_META[statusKey] ?? STATUS_META.DR;
                const catLine = [r.category_name, r.sub_category_name].filter(Boolean).join(' › ');
                const isDeleting = deletingId === id;
                const isIdea = activeType === 'ID';
                const locationLine =
                  String(r.factory_location ?? r.province_name ?? catLine ?? '—').trim() || '—';
                const rating = Number(r.rating_avg ?? r.factory_rating_avg ?? 0);
                const reviews = asPositiveInt(r.review_count ?? r.reviews ?? 0);
                const moq = asPositiveInt(r.moq ?? 0);

                return (
                  <article
                    key={id}
                    className='group flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-brand-purple/25'
                  >
                    {!isIdea ? (
                      <>
                        <div className='relative aspect-[4/3] overflow-hidden bg-slate-100'>
                          {img ? (
                            <ImageWithFallback
                              src={img}
                              alt={String(r.title ?? '')}
                              className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                            />
                          ) : (
                            <div className='flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300'>
                              <ImageIcon size={28} strokeWidth={1.5} />
                              <span className='text-xs'>ไม่มีภาพ</span>
                            </div>
                          )}
                          <div className='absolute left-2 top-2'>
                            <FactoryStatusBadge
                              tone={TYPE_TONE[activeType as Exclude<ShowcaseType, 'PM'>]}
                            >
                              {activeType === 'MT' ? 'วัตถุดิบ' : 'สินค้า'}
                            </FactoryStatusBadge>
                          </div>
                        </div>
                        <div className='flex flex-1 flex-col gap-2 p-3.5'>
                          <p className='truncate text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-purple'>
                            {String(r.title ?? '—')}
                          </p>
                          <div className='flex items-center gap-1 text-xs text-slate-500'>
                            <MapPin className='h-3 w-3 shrink-0 text-slate-400' />
                            <span className='truncate'>{locationLine}</span>
                          </div>
                          <div className='mt-auto border-t border-slate-100 pt-2'>
                            <div className='flex min-w-0 items-center justify-between'>
                              <div className='flex min-w-0 items-center gap-1'>
                                <Star className='h-3 w-3 shrink-0 fill-amber-400 text-amber-400' />
                                <span className='text-xs font-semibold text-slate-700'>
                                  {rating.toFixed(1)}
                                </span>
                                <span className='truncate text-xs text-slate-400'>({reviews})</span>
                              </div>
                              <span className='shrink-0 text-xs text-slate-400'>ขั้นต่ำ {moq}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className='flex flex-1 flex-col px-3.5 pb-3 pt-3.5'>
                        <div className='mb-2 flex items-center gap-2'>
                          <FactoryStatusBadge tone='brand'>ไอเดีย</FactoryStatusBadge>
                          <FactoryStatusBadge tone={statusTone}>{statusLabel}</FactoryStatusBadge>
                        </div>
                        <p className='min-h-[42px] line-clamp-2 text-sm font-semibold leading-snug text-slate-900'>
                          {String(r.title ?? '—')}
                        </p>
                        <div className='mt-3 border-t border-slate-100 pt-2'>
                          <div className='flex items-center justify-between gap-2 text-xs text-slate-500'>
                            <p className='line-clamp-1 min-w-0 flex-1 font-semibold text-slate-700'>
                              {String(
                                r.factory_name ??
                                  user?.factory_name ??
                                  user?.name ??
                                  'โรงงานของคุณ',
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className='mt-auto flex gap-2 px-3.5 pb-3.5'>
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() =>
                          navigate(`/factory/showcases/${id}/edit`, {
                            state: { from: `${location.pathname}${location.search}` },
                          })
                        }
                        className={factoryButtonClass({
                          variant: 'secondary',
                          size: 'sm',
                          className: 'flex-1',
                        })}
                      >
                        <Pencil size={13} />
                        แก้ไข
                      </Button>
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() => void remove(r)}
                        disabled={isDeleting}
                        className={factoryButtonClass({ variant: 'dangerIcon', size: 'icon' })}
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
        </div>
        {/* /Content */}
      </div>
      {/* /outer card */}
    </div>
  );
}
