import { ChevronRight, Store } from 'lucide-react';
import { cn } from '@lib/utils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { getPalette } from '@/components/features/hub/HubCategoryCard';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { ICategoryForHubResponse, IHubResponse } from '@/services/api/types/master.types';

export function catImg(cat: ICategoryForHubResponse): string {
  return String(cat.img || cat.image_url || cat.image || '').trim();
}

export function factoryCountLabel(count: number): string {
  if (count > 0) return `${count.toLocaleString('th-TH')} โรงงาน`;
  return 'ดูไอเดียในหมวดนี้';
}

export function hubFactoryIdeasUrl(hub: IHubResponse, categoryId?: number): string {
  const scope = (hub.scope === 'MT' ? 'MT' : 'PD') as HubScope;
  const params = new URLSearchParams({
    hub_id: String(hub.hub_id),
    hub_scope: scope,
    type: scope === 'MT' ? 'material' : 'product',
  });
  if (categoryId != null) params.set('category_id', String(categoryId));
  return `/factory-ideas?${params.toString()}`;
}

type HubBrowseContentProps = {
  hub: IHubResponse;
  subsByCategoryId: Map<number, { id: string; name: string }[]>;
  categoriesOverride?: ICategoryForHubResponse[];
  onGoAll: (hub: IHubResponse) => void;
  onGoCategory: (hub: IHubResponse, cat: ICategoryForHubResponse) => void;
  onGoSub: (hub: IHubResponse, categoryId: number, subCategoryId: string) => void;
};

export function HubBrowseContent({
  hub,
  subsByCategoryId,
  categoriesOverride,
  onGoAll,
  onGoCategory,
  onGoSub,
}: HubBrowseContentProps) {
  const categories = categoriesOverride ?? hub.categories ?? [];

  return (
    <div className='space-y-0'>
      <button
        type='button'
        onClick={() => onGoAll(hub)}
        className='mb-1 flex w-full items-center gap-3 rounded-2xl bg-brand-lavender-chip/55 px-3 py-3.5 text-left transition-colors hover:bg-brand-lavender-chip/80 active:bg-brand-lavender-chip'
      >
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white shadow-sm'>
          <Store size={20} strokeWidth={2} />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block text-[14px] font-bold leading-snug text-brand-navy-ink'>
            ดูทั้งหมดใน{hub.name}
          </span>
          <span className='mt-0.5 block text-[12px] leading-snug text-brand-purple/75'>
            ยังไม่ต้องเลือกหมวดย่อยก็เริ่มค้นหาได้
          </span>
        </span>
        <span
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white'
          aria-hidden='true'
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </span>
      </button>

      {categories.length === 0 ? (
        <p className='px-1.5 py-3 text-xs text-slate-400'>ยังไม่มีหมวดในกลุ่มนี้</p>
      ) : (
        <ul>
          {categories.map((cat) => {
            const palette = getPalette(cat.category_id);
            const img = catImg(cat);
            const subs = subsByCategoryId.get(cat.category_id) ?? [];

            return (
              <li
                key={cat.category_id}
                className='border-b border-slate-100 py-3 last:border-b-0'
              >
                <button
                  type='button'
                  onClick={() => onGoCategory(hub, cat)}
                  className='flex w-full items-start gap-3 text-left'
                >
                  <div
                    className={cn(
                      'flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100',
                      img ? 'bg-white' : palette.bg,
                    )}
                  >
                    {img ? (
                      <ImageWithFallback
                        src={img}
                        alt={cat.name}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <span className={cn('text-lg font-bold opacity-50', palette.text)}>
                        {cat.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className='flex min-w-0 flex-1 items-start gap-1 pt-0.5'>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-[14px] font-bold leading-snug text-brand-navy-ink'>
                        {cat.name}
                      </p>
                      <p className='mt-0.5 text-[12px] font-medium text-brand-purple'>
                        {factoryCountLabel(cat.factory_count ?? 0)}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      strokeWidth={2}
                      className='mt-0.5 shrink-0 text-slate-300'
                      aria-hidden='true'
                    />
                  </div>
                </button>

                {subs.length > 0 ? (
                  <div
                    className='mt-2.5 overflow-x-auto pl-[64px] pr-0.5 scrollbar-hide'
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <div className='flex w-max gap-2 pb-0.5'>
                      {subs.map((sub) => (
                        <button
                          key={sub.id}
                          type='button'
                          onClick={() => onGoSub(hub, cat.category_id, sub.id)}
                          className={cn(
                            'inline-flex shrink-0 items-center rounded-full',
                            'bg-gray-100 px-3 py-1.5 text-[12px] font-medium text-gray-700',
                            'transition-all hover:bg-gray-200 active:scale-[0.98]',
                          )}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
