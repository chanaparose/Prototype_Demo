import { Link, useNavigate } from 'react-router';
import { Building2, ChevronRight, Leaf, type LucideIcon } from 'lucide-react';
import { cn } from '@lib/utils';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { HubSectionSkeleton } from '@/components/features/hub/HubSectionSkeleton';
import { buildFactoryIdeasHubPageUrl } from '@/components/features/explore/exploreHubFilter';
import {
  getPalette,
  HUB_CARD_IMG_FRAME_CLASS,
  HUB_CARD_IMG_CLASS,
} from '@/components/features/hub/HubCategoryCard';
import type { ICategoryForHubResponse, IHubResponse } from '@/services/api/types/master.types';

type ExploreHubPreviewProps = {
  activeScope: HubScope;
  onScopeChange: (scope: HubScope) => void;
  hubs: IHubResponse[];
  selectedHub: IHubResponse | null;
  selectedHubId: number | null;
  onSelectedHubChange: (hubId: number) => void;
  isLoading?: boolean;
  className?: string;
  sectionClassName?: string;
};

export function ExploreHubPreview({
  activeScope,
  onScopeChange,
  hubs,
  selectedHub,
  selectedHubId,
  onSelectedHubChange,
  isLoading = false,
  className,
  sectionClassName,
}: ExploreHubPreviewProps) {
  const navigate = useNavigate();
  const totalFactories =
    selectedHub?.categories.reduce((sum, cat) => sum + (cat.factory_count ?? 0), 0) ?? 0;

  return (
    <section className={cn('relative px-4 md:px-0', className)} data-tour='categories'>
      <div className='mb-2.5 flex items-center justify-between md:hidden'>
        <h3 className='text-[14px] font-bold text-brand-navy-ink'>เลือกหมวดที่อยากเริ่ม</h3>
        <Link
          to={buildFactoryIdeasHubPageUrl(activeScope)}
          className='flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-brand-purple'
        >
          หมวดหมู่ทั้งหมด <ChevronRight size={13} />
        </Link>
      </div>

      <div className='relative overflow-hidden rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm md:rounded-lg md:border-slate-200 md:p-3'>
        <ExploreHubPreviewBackdrop />

        <div className='relative z-10 mb-2 hidden items-center justify-between md:mb-2 md:flex'>
          <div className='min-w-0'>
            <p className='text-[10px] font-bold uppercase tracking-[0.08em] text-brand-orange/75'>
              Explore by category
            </p>
            <h3 className='text-sm font-bold text-brand-navy-ink'>เลือกหมวดที่อยากเริ่ม</h3>
          </div>
          <Link
            to={buildFactoryIdeasHubPageUrl(activeScope)}
            className='flex shrink-0 items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold text-brand-purple transition-colors hover:bg-brand-purple/8 hover:underline'
          >
            ดูทั้งหมด <ChevronRight size={13} />
          </Link>
        </div>

        <div className='relative z-10 space-y-2'>
          <ScopeSwitch activeScope={activeScope} onScopeChange={onScopeChange} />

          {!isLoading && hubs.length > 0 ? (
            <div className='grid grid-cols-2 gap-1.5 pb-0.5 sm:flex sm:gap-2 sm:overflow-x-auto sm:scrollbar-hide'>
              {hubs.map((hub) => (
                <HubPill
                  key={hub.hub_id}
                  hub={hub}
                  active={selectedHubId === hub.hub_id}
                  onClick={() => onSelectedHubChange(hub.hub_id)}
                />
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <div className='space-y-2'>
              <HubSectionSkeleton />
            </div>
          ) : null}

          {!isLoading && hubs.length === 0 ? (
            <div className='rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center'>
              <p className='text-xs text-gray-500'>ยังไม่มีหมวดในขอบเขตนี้</p>
            </div>
          ) : null}

          {!isLoading && selectedHub ? (
            <div className={cn('rounded-xl bg-slate-50/80 p-2', sectionClassName)}>
              <div className='mb-2 flex items-center justify-between gap-2 px-0.5'>
                <div className='min-w-0'>
                  <h4 className='truncate text-xs font-bold text-[var(--brand-navy)]'>
                    {selectedHub.name}
                  </h4>
                </div>
                <button
                  type='button'
                  onClick={() =>
                    navigate(
                      `/factory-ideas?hub_id=${selectedHub.hub_id}&hub_scope=${selectedHub.scope}`,
                    )
                  }
                  className='flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-brand-purple transition-colors hover:bg-white/60'
                >
                  ดูทั้งหมด
                  <ChevronRight size={12} />
                </button>
              </div>

              {selectedHub.categories.length > 0 ? (
                <div className='flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide'>
                  {selectedHub.categories.slice(0, 8).map((cat) => (
                    <CompactCategoryCard
                      key={cat.category_id}
                      cat={cat}
                      onClick={() =>
                        navigate(
                          `/factory-ideas?hub_id=${selectedHub.hub_id}&hub_scope=${selectedHub.scope}&category_id=${cat.category_id}`,
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className='rounded-lg bg-white px-3 py-3 text-center text-[10px] text-gray-400'>
                  ยังไม่มีหมวดย่อยในกลุ่มนี้
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ExploreHubPreviewBackdrop() {
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden>
      <div className='absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--brand-purple),var(--brand-orange),#FDBA74)]' />
      <div className='absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[rgba(242,120,48,0.10)] blur-3xl' />
      <div className='absolute -left-16 bottom-[-4rem] h-40 w-40 rounded-full bg-brand-purple/[0.08] blur-3xl' />
    </div>
  );
}

function ScopeSwitch({
  activeScope,
  onScopeChange,
}: {
  activeScope: HubScope;
  onScopeChange: (scope: HubScope) => void;
}) {
  const items: Array<{ scope: HubScope; label: string; icon: LucideIcon }> = [
    { scope: 'PD', label: 'รับผลิต', icon: Building2 },
    { scope: 'MT', label: 'วัตถุดิบ', icon: Leaf },
  ];

  return (
    <div className='relative grid grid-cols-2 border-b border-slate-200'>
      {items.map(({ scope, label, icon: Icon }) => {
        const active = activeScope === scope;
        return (
          <button
            key={scope}
            type='button'
            onClick={() => onScopeChange(scope)}
            className={cn(
              'relative flex h-9 items-center justify-center gap-1 text-[12px] font-bold transition-colors',
              active ? 'text-brand-purple' : 'text-slate-500 hover:text-[var(--brand-navy)]',
            )}
          >
            <Icon
              size={13}
              strokeWidth={2.25}
              className={cn(active ? 'text-brand-purple' : 'text-slate-400')}
            />
            {label}
            {active ? (
              <span className='absolute bottom-[-1px] left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-brand-purple' />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function HubPill({
  hub,
  active,
  onClick,
}: {
  hub: IHubResponse;
  active: boolean;
  onClick: () => void;
}) {
  const totalFactories = hub.categories.reduce((sum, cat) => sum + (cat.factory_count ?? 0), 0);

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border px-2.5 text-left text-[12px] font-semibold transition-colors sm:w-auto sm:min-w-[8.5rem]',
        active
          ? 'border-brand-purple/40 bg-brand-lavender-chip text-brand-violet-deep'
          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-purple/25 hover:bg-brand-lavender-chip/35 hover:text-brand-violet-deep',
      )}
    >
      <span className='min-w-0 truncate'>{hub.name}</span>
      {totalFactories > 0 ? (
        <span
          className={cn(
            'shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold',
            active
              ? 'border-brand-purple/15 bg-white/70 text-brand-violet-deep'
              : 'border-slate-200 bg-slate-50 text-slate-500',
          )}
        >
          {totalFactories}
        </span>
      ) : null}
    </button>
  );
}

function CompactCategoryCard({
  cat,
  onClick,
}: {
  cat: ICategoryForHubResponse;
  onClick: () => void;
}) {
  const palette = getPalette(cat.category_id);
  const imgSrc = cat.img || cat.image_url || cat.image || '';

  return (
    <button
      type='button'
      onClick={onClick}
      className='group flex w-[78px] shrink-0 flex-col items-center gap-1 text-center'
    >
      <div
        className={cn(HUB_CARD_IMG_FRAME_CLASS, 'rounded-xl border border-gray-100 transition-colors group-hover:border-brand-purple/40', palette.bg)}
        style={{ aspectRatio: '1 / 1' }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={cat.name}
            className={HUB_CARD_IMG_CLASS}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
      </div>
      <span className='line-clamp-2 text-[10px] font-medium leading-tight text-gray-700 group-hover:text-brand-purple'>
        {cat.name}
      </span>
    </button>
  );
}
