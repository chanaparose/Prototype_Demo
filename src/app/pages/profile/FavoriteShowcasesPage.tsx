import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, ChevronLeft, Heart, Package, Lightbulb, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { useFavorites } from '@/hooks/useFavorites';
import { useShowcases } from '@/hooks/useShowcases';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import { type FactoryShowcase } from '@/stores/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationItemSkeleton } from '@/components/skeletons/PageSkeletons';

type FavoritesTab = 'all' | 'product' | 'promotion' | 'idea';

const TABS: { id: FavoritesTab; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'product', label: 'สินค้า' },
  { id: 'promotion', label: 'โปรโมชัน' },
  { id: 'idea', label: 'ไอเดีย' },
];

function detailHref(item: FactoryShowcase): string {
  if (item.contentType === 'promotion')
    return `/promotion-detail?showcase_id=${encodeURIComponent(item.id)}`;
  if (item.contentType === 'idea') return `/idea-detail?showcase_id=${encodeURIComponent(item.id)}`;
  return `/product-detail?showcase_id=${encodeURIComponent(item.id)}`;
}

function typeLabel(type: FactoryShowcase['contentType']): string {
  if (type === 'promotion') return 'โปรโมชัน';
  if (type === 'idea') return 'ไอเดีย';
  if (type === 'material') return 'วัตถุดิบ';
  return 'สินค้า';
}

function typeIcon(type: FactoryShowcase['contentType']) {
  if (type === 'promotion') return Tag;
  if (type === 'idea') return Lightbulb;
  return Package;
}

export function FavoriteShowcasesPage() {
  const navigate = useNavigate();
  const { likedIds, loading: favoritesLoading, isLiked, toggleFavorite } = useFavorites();
  const { showcases, loading: showcasesLoading } = useShowcases();
  const [tab, setTab] = useState<FavoritesTab>('all');
  const [searchText, setSearchText] = useState('');

  const allFavorites = useMemo(() => {
    if (!showcases.length || likedIds.size === 0) return [] as FactoryShowcase[];
    return showcases.filter((s) => likedIds.has(String(s.id)));
  }, [showcases, likedIds]);

  const filtered = useMemo(() => {
    let items = tab === 'all' ? allFavorites : allFavorites.filter((s) => s.contentType === tab);
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((s) => {
      const haystack = [s.title, s.factoryName, s.category, s.excerpt, typeLabel(s.contentType)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [allFavorites, tab, searchText]);

  const loading = favoritesLoading || showcasesLoading;
  const totalCount = allFavorites.length;

  return (
    <div className='flex min-h-screen flex-col bg-white pb-20'>
      <div className='flex items-center justify-between px-4 pb-3 pt-4'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm'
          aria-label='ย้อนกลับ'
        >
          <ChevronLeft size={22} className='text-gray-700' />
        </Button>
        <div className='flex flex-col items-center'>
          <p className='text-[10px] text-gray-400'>บันทึกไว้</p>
          <div className='flex items-center gap-2'>
            <h1 className='truncate text-[13px] text-gray-900' style={{ fontWeight: 700 }}>
              รายการโปรด
            </h1>
            
          </div>
        </div>
        <div className='h-10 w-10' aria-hidden />
      </div>

      <div className='flex-1 px-4 py-3'>
        <div className='relative mb-3'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
            <Search className='h-5 w-5 text-slate-400' />
          </div>
          <Input
            type='text'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className='block w-full rounded-xl border border-slate-100 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple'
            placeholder='ค้นหารายการโปรด...'
          />
        </div>

        <div className='mb-3 grid grid-cols-4 gap-2'>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <Button
                variant='unstyled'
                key={t.id}
                type='button'
                onClick={() => setTab(t.id)}
                className='rounded-lg border px-1.5 py-1.5 text-[10px] font-semibold transition-colors sm:px-2 sm:text-[11px]'
                style={{
                  borderColor: active ? 'var(--brand-purple)' : 'var(--neutral-slate-border)',
                  background: active ? '#F3E8FF' : 'var(--neutral-white)',
                  color: active ? '#7E22CE' : 'var(--neutral-slate-subtle)',
                }}
              >
                {t.label}
              </Button>
            );
          })}
        </div>

        <div className='mb-4 flex items-center justify-end'>
          <span className='text-[11px] text-slate-400'>{filtered.length} รายการ</span>
        </div>

        <div className='space-y-3'>
          {loading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <NotificationItemSkeleton key={i} />
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div className='py-12 text-center text-sm text-slate-500'>
              {totalCount === 0
                ? 'ยังไม่มีรายการโปรด — กดหัวใจที่ showcase เพื่อบันทึก'
                : 'ไม่พบรายการในหมวดนี้'}
            </div>
          ) : (
            filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to={detailHref(item)} className='block'>
                  <FavoriteShowcaseCard
                    item={item}
                    isLiked={isLiked(item.id)}
                    onToggleFavorite={() => void toggleFavorite(item.id)}
                  />
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FavoriteShowcaseCard({
  item,
  isLiked,
  onToggleFavorite,
}: {
  item: FactoryShowcase;
  isLiked: boolean;
  onToggleFavorite: () => void;
}) {
  const Icon = typeIcon(item.contentType);
  return (
    <div className='flex items-center gap-3 rounded-2xl border border-brand-purple/15 bg-violet-50/30 p-3 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all'>
      <div className='relative h-12 w-12 shrink-0'>
        <div className='h-full w-full overflow-hidden rounded-2xl bg-violet-100'>
          {item.image ? (
            <ImageWithFallback
              src={item.image}
              alt={item.title}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <Icon size={20} className='text-brand-purple' />
            </div>
          )}
        </div>
        <span className='absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-rose-500'>
          <Heart size={8} className='fill-white text-white' />
        </span>
      </div>

      <div className='min-w-0 flex-1'>
        <div className='mb-1 flex items-start justify-between gap-2'>
          <h3 className='line-clamp-1 text-[13px] font-bold text-slate-800'>{item.title}</h3>
          <span className='inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-brand-purple'>
            <Icon size={10} />
            {typeLabel(item.contentType)}
          </span>
        </div>
        <p className='line-clamp-1 text-[13px] font-medium text-slate-600'>
          {item.factoryName || 'โรงงาน'}
        </p>
        {item.category ? (
          <p className='mt-0.5 line-clamp-1 text-[11px] text-slate-400'>{item.category}</p>
        ) : null}
      </div>

      <ShowcaseHeartButton
        showcaseId={item.id}
        isLiked={isLiked}
        onToggle={onToggleFavorite}
        size='md'
        className='shrink-0 border border-slate-200 !bg-white'
      />
    </div>
  );
}
