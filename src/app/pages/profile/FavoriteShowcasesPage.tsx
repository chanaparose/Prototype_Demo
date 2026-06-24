import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Search, ChevronLeft, Heart, Package, Lightbulb } from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { EmptyState } from '@/components/ui/empty-state';
import { motion } from 'motion/react';
import { cn } from '@lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useShowcases } from '@/hooks/useShowcases';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { ShowcaseHeartButton } from '@/components/shared/ShowcaseHeartButton';
import { type FactoryShowcase } from '@/stores/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationItemSkeleton } from '@/components/skeletons/PageSkeletons';
import { TabSwipeContent } from '@/components/layout/TabSwipeContent';

type FavoritesTab = 'all' | 'product' | 'idea';

const TABS: { id: FavoritesTab; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'product', label: 'สินค้า' },
  { id: 'idea', label: 'ไอเดีย' },
];

const FAVORITES_TAB_ORDER = TABS.map((t) => t.id);

function detailHref(item: FactoryShowcase): string {
  if (item.contentType === 'idea') return `/idea-detail?showcase_id=${encodeURIComponent(item.id)}`;
  return `/product-detail?showcase_id=${encodeURIComponent(item.id)}`;
}

function typeLabel(type: FactoryShowcase['contentType']): string {
  if (type === 'idea') return 'ไอเดีย';
  if (type === 'material') return 'วัตถุดิบ';
  return 'สินค้า';
}

function typeIcon(type: FactoryShowcase['contentType']) {
  if (type === 'idea') return Lightbulb;
  return Package;
}

export function FavoriteShowcasesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { open: openModal } = useAuthModalStore();
  const modalShown = useRef(false);
  const { likedIds, loading: favoritesLoading, isLiked, toggleFavorite } = useFavorites();
  const { showcases, loading: showcasesLoading } = useShowcases();
  const [tab, setTab] = useState<FavoritesTab>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !modalShown.current) {
      modalShown.current = true;
      openModal(location.pathname + location.search);
    }
  }, [isAuthenticated, authLoading, openModal, location.pathname, location.search]);

  const allFavorites = useMemo(() => {
    if (!showcases.length || likedIds.size === 0) return [] as FactoryShowcase[];
    return showcases.filter(
      (s) => likedIds.has(String(s.id)) && s.contentType !== 'promotion',
    );
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

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className='flex min-h-[100dvh] flex-col bg-[var(--brand-page)]'>
        <div className='px-2 pt-3'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate(-1)}
            className='flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-slate-100'
          >
            <ChevronLeft size={22} />
          </Button>
        </div>
        <div className='flex flex-1 flex-col items-center justify-center px-4'>
          <EmptyState
            title='ยังไม่มีรายการโปรด'
            description='เข้าสู่ระบบเพื่อดูรายการโปรดของคุณ'
            icon={
              <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50'>
                <Heart size={26} className='text-rose-400' />
              </span>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col bg-white pb-20'>
      <div className='flex items-center justify-between gap-2 px-4 pb-2 pt-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-slate-50'
          aria-label='ย้อนกลับ'
        >
          <ChevronLeft size={20} strokeWidth={2.25} />
        </Button>
        <h1 className='truncate text-[14px] font-bold text-brand-navy-ink'>รายการโปรด</h1>
        <div className='h-9 w-9 shrink-0' aria-hidden />
      </div>

      <div className='flex-1 px-4 py-2'>
        <div className='relative mb-2.5'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <Search className='h-4 w-4 text-gray-400' />
          </div>
          <Input
            type='text'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className='block w-full rounded-lg border border-gray-100 bg-white py-2 pl-9 pr-3 text-[12px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-purple/30'
            placeholder='ค้นหารายการโปรด...'
          />
        </div>

        <div
          role='tablist'
          aria-label='ประเภทรายการโปรด'
          className='mb-2.5 grid grid-cols-3 border-b border-slate-200'
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type='button'
                role='tab'
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative flex h-9 items-center justify-center text-[12px] font-bold transition-colors',
                  active ? 'text-brand-purple' : 'text-slate-500 hover:text-[var(--brand-navy)]',
                )}
              >
                {t.label}
                {active ? (
                  <span className='absolute bottom-[-1px] left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-brand-purple' />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className='mb-3 flex items-center justify-end'>
          <span className='text-[10px] text-gray-400'>{filtered.length} รายการ</span>
        </div>

        <TabSwipeContent activeKey={tab} tabOrder={FAVORITES_TAB_ORDER}>
          <div className='space-y-2'>
            {loading ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <NotificationItemSkeleton key={i} />
                ))}
              </>
            ) : filtered.length === 0 ? (
              <div className='rounded-lg border border-dashed border-gray-100 bg-slate-50/80 py-10 text-center text-[12px] text-gray-500'>
                {totalCount === 0
                  ? 'ยังไม่มีรายการโปรด — กดหัวใจที่ showcase เพื่อบันทึก'
                  : 'ไม่พบรายการในหมวดนี้'}
              </div>
            ) : (
              filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.12) }}
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
        </TabSwipeContent>
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
    <div className='flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white p-2.5 transition-colors hover:border-brand-purple/25 hover:bg-slate-50/50'>
      <div className='relative h-11 w-11 shrink-0'>
        <div className='h-full w-full overflow-hidden rounded-lg bg-brand-purple/10'>
          {item.image ? (
            <ImageWithFallback
              src={item.image}
              alt={item.title}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <Icon size={16} strokeWidth={2.25} className='text-brand-purple' />
            </div>
          )}
        </div>
        <span className='absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-white bg-rose-500'>
          <Heart size={7} className='fill-white text-white' />
        </span>
      </div>

      <div className='min-w-0 flex-1'>
        <div className='mb-0.5 flex items-start justify-between gap-2'>
          <h3 className='line-clamp-1 text-xs font-medium leading-tight text-gray-700'>
            {item.title}
          </h3>
          <span className='inline-flex shrink-0 items-center gap-0.5 rounded-full border border-gray-100 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-brand-purple'>
            <Icon size={9} strokeWidth={2.25} />
            {typeLabel(item.contentType)}
          </span>
        </div>
        <p className='line-clamp-1 text-[10px] text-gray-500'>
          {item.factoryName || 'โรงงาน'}
        </p>
        {item.category ? (
          <p className='mt-0.5 line-clamp-1 text-[10px] text-gray-400'>{item.category}</p>
        ) : null}
      </div>

      <ShowcaseHeartButton
        showcaseId={item.id}
        isLiked={isLiked}
        onToggle={onToggleFavorite}
        size='md'
        className='shrink-0 border border-gray-100 !bg-white'
      />
    </div>
  );
}
