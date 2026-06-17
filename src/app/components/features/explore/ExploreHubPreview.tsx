import { Link, useNavigate } from 'react-router';
import { Boxes, ChevronRight, Factory, Leaf, PackageSearch, type LucideIcon } from 'lucide-react';
import { cn } from '@lib/utils';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { HubSectionSkeleton } from '@/components/features/hub/HubSectionSkeleton';
import { buildFactoryIdeasHubPageUrl } from '@/components/features/explore/exploreHubFilter';
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
    <section className={cn('space-y-2.5', className)} data-tour='categories'>
      <div className='flex items-center justify-between px-4 md:px-0'>
        <div className='min-w-0'>
          <p className='text-[10px] font-bold uppercase tracking-[0.08em] text-brand-orange/70'>
            Explore by category
          </p>
          <h3 className='text-[15px] font-bold text-brand-navy-ink'>เลือกหมวดที่อยากเริ่ม</h3>
        </div>
        <Link
          to={buildFactoryIdeasHubPageUrl(activeScope)}
          className='flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-brand-purple hover:underline'
        >
          ดูทั้งหมด <ChevronRight size={13} />
        </Link>
      </div>

      <div className='px-4 md:px-0'>
        <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
          <ScopeSwitch activeScope={activeScope} onScopeChange={onScopeChange} />

          <div className='space-y-3 px-3 py-3 md:px-4'>
            {!isLoading && hubs.length > 0 ? (
              <div className='flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide'>
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
              <div className='rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center'>
                <p className='text-sm text-gray-500'>ยังไม่มีหมวดในขอบเขตนี้</p>
              </div>
            ) : null}

            {!isLoading && selectedHub ? (
              <div className={cn('rounded-xl bg-[var(--brand-page)]/45 p-2.5', sectionClassName)}>
                <div className='mb-2 flex items-center justify-between gap-2'>
                  <div className='min-w-0'>
                    <h4 className='truncate text-[13px] font-bold text-[var(--brand-navy)]'>
                      {selectedHub.name}
                    </h4>
                    <p className='mt-0.5 text-[10px] text-gray-500'>
                      {totalFactories > 0
                        ? `${totalFactories} โรงงานพร้อมรับงาน`
                        : 'เลือกดูหมวดที่เกี่ยวข้อง'}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() =>
                      navigate(
                        `/factory-ideas?hub_id=${selectedHub.hub_id}&hub_scope=${selectedHub.scope}`,
                      )
                    }
                    className='flex shrink-0 items-center gap-0.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 shadow-sm transition-colors hover:border-brand-purple/30 hover:text-brand-purple'
                  >
                    ดูครบ
                    <ChevronRight size={12} />
                  </button>
                </div>

                {selectedHub.categories.length > 0 ? (
                  <div className='flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide'>
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
                  <div className='rounded-lg bg-white px-3 py-4 text-center text-xs text-gray-400'>
                    ยังไม่มีหมวดย่อยในกลุ่มนี้
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
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
    { scope: 'PD', label: 'รับผลิต', icon: Factory },
    { scope: 'MT', label: 'วัตถุดิบ', icon: Leaf },
  ];

  return (
    <div className='grid grid-cols-2 gap-1 border-b border-gray-100 bg-gray-50/70 p-1'>
      {items.map(({ scope, label, icon: Icon }) => {
        const active = activeScope === scope;
        return (
          <button
            key={scope}
            type='button'
            onClick={() => onScopeChange(scope)}
            className={cn(
              'flex h-9 items-center justify-center gap-1.5 rounded-xl text-[12px] font-bold transition-all',
              active
                ? 'bg-white text-brand-purple shadow-sm ring-1 ring-brand-purple/15'
                : 'text-gray-500 hover:bg-white/70 hover:text-gray-700',
            )}
          >
            <Icon size={14} strokeWidth={2.25} />
            {label}
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
        'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-left text-[11px] font-bold transition-all',
        active
          ? 'border-brand-purple/35 bg-[var(--brand-lavender-chip)] text-brand-purple shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-brand-purple/25 hover:text-brand-purple',
      )}
    >
      <Boxes size={13} className={active ? 'text-brand-purple' : 'text-gray-400'} />
      <span className='max-w-[132px] truncate'>{hub.name}</span>
      {totalFactories > 0 ? (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[9px]',
            active ? 'bg-white/80 text-brand-purple' : 'bg-gray-100 text-gray-500',
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
  const subText = (cat.sub_preview ?? []).slice(0, 2).join(' · ');

  return (
    <button
      type='button'
      onClick={onClick}
      className='group flex h-[82px] w-[148px] shrink-0 flex-col rounded-xl border border-brand-purple/12 bg-white px-3 py-2.5 text-left shadow-[0_2px_8px_rgba(46,34,82,0.05)] transition-all hover:-translate-y-0.5 hover:border-brand-purple/35 hover:shadow-[0_5px_16px_rgba(122,75,148,0.13)] active:scale-[0.98] md:w-[172px]'
    >
      <div className='mb-1 flex items-center gap-1.5'>
        <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple'>
          <PackageSearch size={13} strokeWidth={2.25} />
        </span>
        <span className='line-clamp-1 text-[12px] font-bold leading-tight text-[var(--brand-navy)] group-hover:text-brand-purple'>
          {cat.name}
        </span>
      </div>
      {subText ? (
        <span className='line-clamp-2 text-[9.5px] leading-tight text-[var(--brand-muted-purple)]'>
          {subText}
        </span>
      ) : (
        <span className='text-[9.5px] text-gray-400'>ดูรายการในหมวดนี้</span>
      )}
      <span
        className={cn(
          'mt-auto text-[10px] font-bold leading-none',
          cat.factory_count > 0 ? 'text-brand-purple' : 'text-gray-400',
        )}
      >
        {cat.factory_count > 0 ? `${cat.factory_count} โรงงาน` : 'ดูหมวดนี้'}
      </span>
    </button>
  );
}
