import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { getFactoryIdeasHubPath } from '@/components/features/factory-ideas/factoryIdeasHubNav';
import { factoryBadgeClass } from '@/pages/factory-portal/factoryUi';
import { type HubScope } from '@/components/features/hub/hubRowShared';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { useEffect, useMemo, useRef } from 'react';
import type { IHubResponse } from '@/services/api/types/master.types';

type ScopeOption = HubScope | 'all';

const SCOPE_TAB_OPTIONS: { id: HubScope; label: string }[] = [
  { id: 'PD', label: 'ผลิตสินค้า' },
  { id: 'MT', label: 'วัตถุดิบ' },
];

type FactoryIdeasPageHeaderProps = {
  title: string;
  count: string;
  hubScope?: HubScope;
  showBack?: boolean;
  currentHubId?: number;
  onHubChange?: (hubId: number | null, scope: HubScope | undefined) => void;
  onScopeChange?: (scope: HubScope | null) => void;
  className?: string;
};

/** Soft brand wash — use on the parent section, not inside a bordered card. */
export function FactoryIdeasHeaderBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      <div className='absolute inset-0 bg-gradient-to-br from-brand-purple/[0.11] via-[var(--brand-page)] to-brand-orange/[0.08]' />
      <div className='absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white/90' />
      <div className='absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/[0.09] blur-3xl' />
      <div className='absolute -left-12 top-6 h-36 w-36 rounded-full bg-brand-purple/[0.07] blur-3xl' />
    </div>
  );
}

function HubTabButton({
  label,
  active,
  onClick,
  tabRef,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tabRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={tabRef}
      type='button'
      onClick={onClick}
      className={cn(
        'relative shrink-0 pb-2 pt-0.5 text-[13px] transition-colors',
        active
          ? 'font-bold text-brand-navy-ink'
          : 'font-medium text-slate-400 hover:text-slate-600',
      )}
    >
      <span className='max-w-[10rem] truncate'>{label}</span>
      {active ? (
        <span
          className='absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-brand-purple'
          aria-hidden
        />
      ) : null}
    </button>
  );
}

export function FactoryIdeasPageHeader({
  title,
  count,
  hubScope,
  showBack = false,
  currentHubId,
  onHubChange,
  onScopeChange,
  className,
}: FactoryIdeasPageHeaderProps) {
  const navigate = useNavigate();
  const { data: allHubs = [] } = useLbiHubsQuery();
  const activeTabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeScope: ScopeOption = hubScope ?? 'all';

  const scopedHubs = useMemo(
    () => (activeScope === 'all' ? allHubs : allHubs.filter((hub) => hub.scope === activeScope)),
    [allHubs, activeScope],
  );

  const canSwitchHub = !!(onHubChange && scopedHubs.length > 0);
  const canSwitchScope = !!onScopeChange;
  const selectedHubId = currentHubId ?? null;

  // Keep the active hub tab visible in the horizontal scroller.
  useEffect(() => {
    const key = selectedHubId == null ? 'all' : String(selectedHubId);
    const el = activeTabRefs.current.get(key);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedHubId, activeScope]);

  const pickHub = (hub: IHubResponse | null) => {
    if (!onHubChange) return;
    if (hub == null) {
      onHubChange(null, activeScope === 'all' ? undefined : activeScope);
    } else {
      onHubChange(hub.hub_id, (hub.scope as HubScope | undefined) ?? undefined);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Row 1 — scope tabs with | + count */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          {showBack ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() =>
                navigate(getFactoryIdeasHubPath(activeScope === 'all' ? undefined : activeScope))
              }
              aria-label='กลับหมวดหมู่'
              className='-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/70 hover:text-brand-purple'
            >
              <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
            </Button>
          ) : null}

          {canSwitchScope ? (
            <div
              role='tablist'
              aria-label='ประเภทหมวดหมู่'
              className='flex min-w-0 items-center gap-2.5'
            >
              {SCOPE_TAB_OPTIONS.map((opt, idx) => {
                const selected = activeScope === opt.id;
                return (
                  <div key={opt.id} className='flex items-center gap-2.5'>
                    {idx > 0 ? (
                      <span className='select-none text-[15px] font-light text-slate-300' aria-hidden>
                        |
                      </span>
                    ) : null}
                    <button
                      type='button'
                      role='tab'
                      aria-selected={selected}
                      onClick={() => onScopeChange(opt.id)}
                      className={cn(
                        'truncate text-[15px] transition-colors sm:text-base',
                        selected
                          ? 'font-bold text-brand-navy-ink'
                          : 'font-semibold text-slate-400 hover:text-slate-600',
                      )}
                    >
                      {opt.label}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <h1 className='truncate text-[15px] font-bold text-brand-navy-ink sm:text-base'>
              {title}
            </h1>
          )}
        </div>

        <span
          className={factoryBadgeClass({
            variant: 'count',
            className: 'shrink-0 bg-white/70 text-slate-600 backdrop-blur-sm',
          })}
        >
          {count}
        </span>
      </div>

      {/* Row 2 — hub text tabs */}
      {canSwitchHub ? (
        <div className='min-w-0 overflow-x-auto scrollbar-hide' style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className='flex items-end gap-4 pr-2'>
            <HubTabButton
              label='ทั้งหมด'
              active={selectedHubId === null}
              onClick={() => pickHub(null)}
              tabRef={(el) => {
                if (el) activeTabRefs.current.set('all', el);
                else activeTabRefs.current.delete('all');
              }}
            />
            {scopedHubs.map((hub) => {
              const active = selectedHubId === hub.hub_id;
              const key = String(hub.hub_id);
              return (
                <HubTabButton
                  key={hub.hub_id}
                  label={hub.name}
                  active={active}
                  onClick={() => pickHub(hub)}
                  tabRef={(el) => {
                    if (el) activeTabRefs.current.set(key, el);
                    else activeTabRefs.current.delete(key);
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : !canSwitchScope ? null : (
        <h1 className='truncate text-[14px] font-semibold leading-snug text-brand-navy-ink'>
          {title}
        </h1>
      )}
    </div>
  );
}
