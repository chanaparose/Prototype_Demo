import React from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Heart, Package, Lightbulb, Tag } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useShowcases } from '@/hooks/useShowcases';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { type FactoryShowcase } from '@/stores/types';
import { Button } from '@/components/ui/button';

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
  return 'สินค้า';
}

function typeIcon(type: FactoryShowcase['contentType']) {
  if (type === 'promotion') return Tag;
  if (type === 'idea') return Lightbulb;
  return Package;
}

export function FavoriteShowcasesPage() {
  const navigate = useNavigate();
  const { likedIds, loading: favoritesLoading } = useFavorites();
  const { showcases, loading: showcasesLoading } = useShowcases();
  const [tab, setTab] = React.useState<FavoritesTab>('all');

  const allFavorites = React.useMemo(() => {
    if (!showcases.length || likedIds.size === 0) return [] as FactoryShowcase[];
    return showcases.filter((s) => likedIds.has(String(s.id)));
  }, [showcases, likedIds]);

  const filtered = React.useMemo(() => {
    if (tab === 'all') return allFavorites;
    return allFavorites.filter((s) => s.contentType === tab);
  }, [allFavorites, tab]);

  const loading = favoritesLoading || showcasesLoading;

  return (
    <div className='space-y-4 pb-24'>
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-2'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='text-slate-600'
          aria-label='ย้อนกลับ'
        >
          <ChevronLeft size={18} />
        </Button>
        <p className='text-sm font-bold text-slate-900'>รายการโปรด</p>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white p-3 shadow-sm'>
        <div className='flex gap-2 overflow-x-auto scrollbar-none'>
          {TABS.map((t) => (
            <Button
              variant='unstyled'
              key={t.id}
              type='button'
              onClick={() => setTab(t.id)}
              className='px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition'
              style={
                tab === t.id
                  ? {
                      background: 'var(--brand-royal-dark)',
                      color: 'var(--neutral-white)',
                      borderColor: 'var(--brand-royal-dark)',
                    }
                  : {
                      background: 'var(--neutral-white)',
                      color: '#475569',
                      borderColor: 'var(--neutral-slate-border)',
                    }
              }
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        {loading ? (
          <p className='text-sm text-slate-500'>กำลังโหลด...</p>
        ) : filtered.length === 0 ? (
          <p className='text-sm text-slate-500'>ยังไม่มีรายการโปรดในหมวดนี้</p>
        ) : (
          <ul className='space-y-3'>
            {filtered.map((item) => {
              const Icon = typeIcon(item.contentType);
              return (
                <li
                  key={item.id}
                  className='rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-white transition cursor-pointer'
                  onClick={() => navigate(detailHref(item))}
                >
                  <div className='flex items-start gap-3'>
                    <div className='w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0'>
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-1.5 mb-1'>
                        <span className='inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600'>
                          <Icon size={12} />
                          {typeLabel(item.contentType)}
                        </span>
                      </div>
                      <p className='text-sm font-semibold text-slate-900 line-clamp-2'>
                        {item.title}
                      </p>
                      <p className='text-xs text-slate-500 mt-1 truncate'>
                        {item.factoryName || 'โรงงาน'}
                      </p>
                      <div className='mt-2 inline-flex items-center gap-1 text-[11px] text-rose-500'>
                        <Heart size={12} className='fill-current' />
                        <span>{Number(item.likes || 0).toLocaleString()} คนถูกใจ</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
