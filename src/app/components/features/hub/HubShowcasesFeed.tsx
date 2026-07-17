import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HubHighlightGridCard, resolvePrice } from '@/components/features/hub/HubHighlightGridCard';
import { useHubShowcasesQuery } from '@/components/features/hub/useHubShowcasesQuery';
import { getFactoryIdeaDetailPath } from '@/components/features/factory-ideas/factoryIdeasTheme';
import { mapShowcaseFromApi } from '@/domain/showcase/mappers/mapShowcase';
import type { IHubShowcaseItem, IHubWithShowcases } from '@/services/api/types/master.types';

const FETCH_PER_HUB = 12;
const DISPLAY_LIMIT = 12;
const RANKED_LIMIT = 10;

type PriceRangeKey = 'all' | 'lt500' | '500-2000' | '2000-5000' | 'gte5000';
type MoqRangeKey = 'all' | 'lt100' | '100-500' | '500-1000' | 'gte1000';
type FilterMode = 'price' | 'moq';

const PRICE_CHIPS: { key: PriceRangeKey; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'lt500', label: 'น้อยกว่า ฿500' },
  { key: '500-2000', label: '฿500 – ฿2,000' },
  { key: '2000-5000', label: '฿2,000 – ฿5,000' },
  { key: 'gte5000', label: '฿5,000 ขึ้นไป' },
];

const MOQ_CHIPS: { key: MoqRangeKey; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'lt100', label: 'MOQ < 100' },
  { key: '100-500', label: 'MOQ 100 – 500' },
  { key: '500-1000', label: 'MOQ 500 – 1,000' },
  { key: 'gte1000', label: 'MOQ 1,000+' },
];

type FlatItem = IHubShowcaseItem & { hub_id: number; hub_name: string };

function flattenHubShowcases(hubs: IHubWithShowcases[]): FlatItem[] {
  const seen = new Set<number>();
  const out: FlatItem[] = [];
  for (const hub of hubs) {
    for (const s of hub.showcases) {
      if (seen.has(s.showcase_id)) continue;
      seen.add(s.showcase_id);
      out.push({ ...s, hub_id: hub.hub_id, hub_name: hub.hub_name });
    }
  }
  return out;
}

function shuffleCopy<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

/**
 * Prefer highest likes first; if fewer than `limit`, randomly fill from the rest.
 * Top liked keep likes order; fillers are shuffled.
 */
function pickHighlightItems(pool: FlatItem[], limit: number): FlatItem[] {
  if (pool.length <= limit) {
    return [...pool].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
  }

  const byLikes = [...pool].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
  const withLikes = byLikes.filter((item) => (item.likes_count ?? 0) > 0);

  if (withLikes.length >= limit) {
    return withLikes.slice(0, limit);
  }

  const selectedIds = new Set(withLikes.map((item) => item.showcase_id));
  const fillers = shuffleCopy(byLikes.filter((item) => !selectedIds.has(item.showcase_id)));
  return [...withLikes, ...fillers.slice(0, limit - withLikes.length)];
}

function matchesPriceRange(item: FlatItem, range: PriceRangeKey): boolean {
  if (range === 'all') return true;
  const price = resolvePrice(item);
  if (price == null) return false;
  if (range === 'lt500') return price < 500;
  if (range === '500-2000') return price >= 500 && price <= 2000;
  if (range === '2000-5000') return price >= 2000 && price <= 5000;
  return price >= 5000;
}

function matchesMoqRange(item: FlatItem, range: MoqRangeKey): boolean {
  if (range === 'all') return true;
  const moq = item.moq;
  if (moq == null || !Number.isFinite(moq) || moq <= 0) return false;
  if (range === 'lt100') return moq < 100;
  if (range === '100-500') return moq >= 100 && moq <= 500;
  if (range === '500-1000') return moq >= 500 && moq <= 1000;
  return moq >= 1000;
}

function matchesSearch(item: FlatItem, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.trim().toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    item.factory_name.toLowerCase().includes(q) ||
    item.hub_name.toLowerCase().includes(q)
  );
}

function HubShowcaseFeedSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-6 w-48 rounded-md' />
      <Skeleton className='h-8 w-full rounded-full' />
      <div className='grid grid-cols-2 gap-3'>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='aspect-square w-full rounded-xl' />
            <Skeleton className='h-3 w-3/4 rounded' />
            <Skeleton className='h-4 w-1/2 rounded' />
          </div>
        ))}
      </div>
    </div>
  );
}

type HubShowcasesFeedProps = {
  search?: string;
  isLiked: (id: string | number) => boolean;
  onToggleFavorite: (id: string | number) => void;
};

export function HubShowcasesFeed({
  search = '',
  isLiked,
  onToggleFavorite,
}: HubShowcasesFeedProps) {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<FilterMode>('price');
  const [priceRange, setPriceRange] = useState<PriceRangeKey>('all');
  const [moqRange, setMoqRange] = useState<MoqRangeKey>('all');
  const showcasesQ = useHubShowcasesQuery(FETCH_PER_HUB);

  const allHubs = showcasesQ.data ?? [];

  const items = useMemo(() => {
    const flat = flattenHubShowcases(allHubs).filter((item) => matchesSearch(item, search));
    const filtered =
      filterMode === 'price'
        ? flat.filter((item) => matchesPriceRange(item, priceRange))
        : flat.filter((item) => matchesMoqRange(item, moqRange));
    return pickHighlightItems(filtered, DISPLAY_LIMIT);
  }, [allHubs, search, filterMode, priceRange, moqRange]);

  if (showcasesQ.isLoading) {
    return <HubShowcaseFeedSkeleton />;
  }

  if (allHubs.length === 0) {
    return null;
  }

  return (
    <section className='space-y-2.5'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <span className='h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-orange/85 to-brand-orange/35' />
          <div className='min-w-0'>
            <h2 className='truncate text-[14px] font-bold text-[var(--brand-navy)] lg:text-[15px]'>
              {filterMode === 'price' ? 'ไฮไลท์ยอดฮิตตามช่วงราคา' : 'ไฮไลท์ยอดฮิตตาม MOQ'}
            </h2>
          </div>
        </div>
        <div className='flex shrink-0 gap-1 rounded-full border border-gray-200 bg-white p-0.5'>
          <button
            type='button'
            onClick={() => setFilterMode('price')}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors lg:text-[12px]',
              filterMode === 'price'
                ? 'bg-brand-orange text-white'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            ราคา
          </button>
          <button
            type='button'
            onClick={() => setFilterMode('moq')}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors lg:text-[12px]',
              filterMode === 'moq'
                ? 'bg-brand-orange text-white'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            MOQ
          </button>
        </div>
      </div>

      <div className='flex flex-nowrap gap-2 overflow-x-auto pb-0.5 scrollbar-hide'>
        {filterMode === 'price'
          ? PRICE_CHIPS.map((chip) => {
              const active = priceRange === chip.key;
              return (
                <button
                  key={chip.key}
                  type='button'
                  onClick={() => setPriceRange(chip.key)}
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors lg:text-[12px]',
                    active
                      ? 'border-brand-orange bg-brand-orange text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                  )}
                >
                  {chip.label}
                </button>
              );
            })
          : MOQ_CHIPS.map((chip) => {
              const active = moqRange === chip.key;
              return (
                <button
                  key={chip.key}
                  type='button'
                  onClick={() => setMoqRange(chip.key)}
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors lg:text-[12px]',
                    active
                      ? 'border-brand-orange bg-brand-orange text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
      </div>

      {items.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center'>
          <p className='text-sm text-gray-500'>
            {search ? `ไม่พบรายการที่ตรงกับ "${search}"` : 'ไม่พบรายการในช่วงที่เลือก'}
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
          {items.map((item, index) => {
            const rank = index + 1;
            return (
              <HubHighlightGridCard
                key={item.showcase_id}
                item={item}
                rank={rank <= RANKED_LIMIT ? rank : null}
                isLiked={isLiked(item.showcase_id)}
                onToggleFavorite={onToggleFavorite}
                onClick={() => {
                  const mapped = mapShowcaseFromApi(item as unknown as Record<string, unknown>);
                  navigate(getFactoryIdeaDetailPath(mapped.contentType, mapped.id));
                }}
              />
            );
          })}
        </div>
      )}

      <div className='flex justify-center pt-1'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/factory-ideas')}
          className='group flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-[12px] font-medium text-brand-orange transition-colors hover:bg-brand-orange/8'
        >
          ดูทั้งหมด
          <span className='flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange/10 transition-colors group-hover:bg-brand-orange/15'>
            <ChevronRight size={11} strokeWidth={2.5} />
          </span>
        </Button>
      </div>
    </section>
  );
}
