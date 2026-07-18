import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@lib/utils';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import {
  buildFactoryIdeasCategoryUrl,
  flattenHubCategories,
} from '@/components/features/explore/exploreCategoryUtils';
import { FactoryIdeasHeaderBackdrop } from '@/components/features/factory-ideas/FactoryIdeasPageHeader';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { getPalette } from '@/components/features/hub/HubCategoryCard';

function parseScope(raw: string | null): HubScope {
  return raw === 'MT' ? 'MT' : 'PD';
}

/** Full category list — light theme with brand header wash. */
export function ExploreCategoriesAllPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scope = parseScope(searchParams.get('scope'));
  const hubsQ = useLbiHubsQuery();

  const categories = useMemo(() => {
    const hubs = (hubsQ.data ?? []).filter((hub) => hub.scope === scope);
    return flattenHubCategories(hubs, scope);
  }, [hubsQ.data, scope]);

  const scopeLabel = scope === 'MT' ? 'วัตถุดิบ' : 'ผลิตสินค้า';

  return (
    <div className='min-h-[100dvh] bg-white text-brand-navy-ink'>
      <header className='sticky top-0 z-20 overflow-hidden border-b border-slate-200/70 bg-white/80 backdrop-blur-md'>
        <FactoryIdeasHeaderBackdrop />
        <div className='relative z-10'>
          <div className='relative flex h-12 items-center px-2 md:h-14 md:px-4'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              aria-label='ย้อนกลับ'
              className='absolute left-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-white/70 hover:text-brand-purple md:left-4'
            >
              <ChevronLeft size={22} strokeWidth={2.25} />
            </button>
            <h1 className='mx-auto text-[15px] font-bold tracking-tight text-brand-navy-ink md:text-base'>
              หมวดหมู่ทั้งหมด
            </h1>
          </div>
          <p className='px-4 pb-3 text-center text-[11px] font-medium text-slate-500 md:pb-4'>
            {scopeLabel} · {categories.length.toLocaleString('th-TH')} หมวด
          </p>
        </div>
      </header>

      <div className='mx-auto w-full max-w-lg px-4 pb-10 pt-2 md:max-w-2xl md:px-6'>
        {hubsQ.isLoading ? (
          <ul className='space-y-4'>
            {[...Array(8)].map((_, i) => (
              <li key={i} className='flex items-center gap-3.5'>
                <div className='h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-slate-100' />
                <div className='min-w-0 flex-1 space-y-2'>
                  <div className='h-3.5 w-32 animate-pulse rounded bg-slate-100' />
                  <div className='h-3 w-48 animate-pulse rounded bg-slate-50' />
                </div>
              </li>
            ))}
          </ul>
        ) : categories.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center'>
            <p className='text-sm font-medium text-slate-600'>ยังไม่มีหมวดในขอบเขตนี้</p>
            <p className='mt-1 text-xs text-slate-400'>ลองสลับไปอีกประเภทบนหน้า Explore</p>
          </div>
        ) : (
          <ul className='space-y-1'>
            {categories.map((cat) => {
              const palette = getPalette(cat.categoryId);
              return (
                <li key={cat.categoryId}>
                  <button
                    type='button'
                    onClick={() => navigate(buildFactoryIdeasCategoryUrl(cat))}
                    className='flex w-full items-center gap-3.5 rounded-2xl px-1.5 py-2.5 text-left transition-colors hover:bg-brand-lavender-chip/50 active:bg-brand-lavender-chip/80'
                  >
                    <div
                      className={cn(
                        'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100',
                        cat.img ? 'bg-white' : palette.bg,
                      )}
                    >
                      {cat.img ? (
                        <ImageWithFallback
                          src={cat.img}
                          alt={cat.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <span className={cn('text-lg font-bold opacity-50', palette.text)}>
                          {cat.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-[14px] font-bold leading-tight text-brand-navy-ink'>
                        {cat.name}
                      </p>
                      <p className='mt-1 line-clamp-1 text-[12px] leading-tight text-slate-400'>
                        {cat.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
