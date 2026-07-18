import {
  ArrowLeft,
  Check,
  ChevronDown,
  Factory,
  Layers,
  LayoutGrid,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { getFactoryIdeasHubPath } from '@/components/features/factory-ideas/factoryIdeasHubNav';
import { factoryBadgeClass } from '@/pages/factory-portal/factoryUi';
import { type HubScope } from '@/components/features/hub/hubRowShared';
import { resolveHubIcon } from '@/components/features/hub/HubFilterChips';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { useState, useRef, useEffect, useMemo, type ComponentType } from 'react';
import { createPortal } from 'react-dom';

type ScopeOption = HubScope | 'all';
const HUB_SCOPES: ScopeOption[] = ['all', 'PD', 'MT'];
const SCOPE_LABELS: Record<ScopeOption, string> = {
  all: 'ทั้งหมด',
  PD: 'โรงงานรับผลิต',
  MT: 'วัตถุดิบ',
};
const SCOPE_ICONS: Record<ScopeOption, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  all: LayoutGrid,
  PD: Factory,
  MT: Package,
};
const SCOPE_HINTS: Record<ScopeOption, string> = {
  all: 'ดูทุกประเภท',
  PD: 'สินค้าจากโรงงานรับผลิต',
  MT: 'วัตถุดิบและชิ้นส่วน',
};

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
  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeDropdownRef = useRef<HTMLDivElement>(null);
  const scopeTriggerRef = useRef<HTMLButtonElement>(null);
  const [scopeDropdownPos, setScopeDropdownPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const activeScope: ScopeOption = hubScope ?? 'all';
  const activeScopeLabel = SCOPE_LABELS[activeScope] ?? activeScope;

  const scopedHubs = useMemo(
    () => (activeScope === 'all' ? allHubs : allHubs.filter((hub) => hub.scope === activeScope)),
    [allHubs, activeScope],
  );

  useEffect(() => {
    if (!scopeOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideScope =
        scopeDropdownRef.current?.contains(target) || scopeTriggerRef.current?.contains(target);
      if (!insideScope) setScopeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [scopeOpen]);

  const handleScopeToggle = () => {
    if (!scopeOpen) {
      const rect = scopeTriggerRef.current?.getBoundingClientRect();
      if (rect) setScopeDropdownPos({ top: rect.bottom + 6, left: rect.left });
    }
    setScopeOpen((v) => !v);
  };

  const canSwitchHub = !!(onHubChange && scopedHubs.length > 0);
  const canSwitchScope = !!onScopeChange;
  const selectedHubId = currentHubId ?? null;
  const ActiveScopeIcon = SCOPE_ICONS[activeScope];

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className='flex items-start justify-between gap-3'>
        <div className='mb-0 flex min-w-0 flex-wrap items-center gap-2'>
          {showBack ? (
            <>
              <Button
                variant='unstyled'
                type='button'
                onClick={() =>
                  navigate(getFactoryIdeasHubPath(activeScope === 'all' ? undefined : activeScope))
                }
                className='-ml-1 inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-brand-purple'
              >
                <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
                กลับหมวดหมู่
              </Button>
              <span className='h-3.5 w-px shrink-0 bg-slate-200/80' aria-hidden />
            </>
          ) : null}

          {canSwitchScope ? (
            <div className='relative min-w-0'>
              <button
                ref={scopeTriggerRef}
                type='button'
                onClick={handleScopeToggle}
                aria-haspopup='listbox'
                aria-expanded={scopeOpen}
                aria-label={`ประเภทหมวดหมู่: ${activeScopeLabel} — กดเพื่อเปลี่ยน`}
                className={cn(
                  'group inline-flex max-w-full items-center gap-2 rounded-full border bg-white/90 py-1 pl-1.5 pr-1.5 shadow-[0_1px_3px_rgba(91,33,182,0.08)] backdrop-blur-sm transition-all',
                  scopeOpen
                    ? 'border-brand-purple/45 ring-2 ring-brand-purple/15'
                    : 'border-brand-purple/25 hover:border-brand-purple/40 hover:shadow-[0_2px_8px_rgba(91,33,182,0.12)]',
                )}
              >
                <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple/12 text-brand-purple'>
                  <ActiveScopeIcon size={13} strokeWidth={2.25} />
                </span>
                <span className='min-w-0 truncate text-[12px] font-semibold text-brand-navy-ink sm:text-[13px]'>
                  {activeScopeLabel}
                </span>
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple transition-colors group-hover:bg-brand-purple/15',
                    scopeOpen && 'bg-brand-purple/15',
                  )}
                >
                  <ChevronDown
                    size={12}
                    strokeWidth={2.5}
                    className={cn('transition-transform duration-200', scopeOpen && 'rotate-180')}
                    aria-hidden
                  />
                </span>
              </button>

              {scopeOpen
                ? createPortal(
                    <div
                      ref={scopeDropdownRef}
                      role='listbox'
                      aria-label='เลือกประเภทหมวดหมู่'
                      className='fixed z-[9999] w-56 overflow-hidden rounded-2xl border border-brand-purple/15 bg-white p-1.5 shadow-[0_8px_28px_rgba(15,23,42,0.12)]'
                      style={{ top: scopeDropdownPos.top, left: scopeDropdownPos.left }}
                    >
                      <p className='px-2.5 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400'>
                        เปลี่ยนประเภท
                      </p>
                      {HUB_SCOPES.map((scope) => {
                        const selected = scope === activeScope;
                        const ScopeIcon = SCOPE_ICONS[scope];
                        return (
                          <button
                            key={scope}
                            type='button'
                            role='option'
                            aria-selected={selected}
                            onClick={() => {
                              onScopeChange(scope === 'all' ? null : scope);
                              setScopeOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors',
                              selected
                                ? 'bg-brand-purple/10'
                                : 'hover:bg-brand-lavender-chip/80',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                selected
                                  ? 'bg-brand-purple text-white'
                                  : 'bg-brand-purple/8 text-brand-purple',
                              )}
                            >
                              <ScopeIcon size={14} strokeWidth={2.25} />
                            </span>
                            <span className='min-w-0 flex-1'>
                              <span
                                className={cn(
                                  'block text-[13px] leading-tight',
                                  selected
                                    ? 'font-semibold text-brand-purple'
                                    : 'font-medium text-slate-700',
                                )}
                              >
                                {SCOPE_LABELS[scope]}
                              </span>
                              <span className='mt-0.5 block text-[10px] leading-tight text-slate-400'>
                                {SCOPE_HINTS[scope]}
                              </span>
                            </span>
                            {selected ? (
                              <Check
                                size={14}
                                strokeWidth={2.5}
                                className='shrink-0 text-brand-purple'
                                aria-hidden
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>,
                    document.body,
                  )
                : null}
            </div>
          ) : (
            <span className='inline-flex max-w-full items-center gap-1.5 truncate text-[12px] font-medium text-slate-500'>
              <Layers size={14} className='shrink-0 text-brand-purple/60' strokeWidth={2.25} />
              {activeScopeLabel}
            </span>
          )}
        </div>

        <span
          className={factoryBadgeClass({
            variant: 'count',
            className: 'mt-0.5 shrink-0 bg-white/70 text-slate-600 backdrop-blur-sm',
          })}
        >
          {count}
        </span>
      </div>

      {canSwitchHub ? (
        <div className='-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-hide'>
          <button
            type='button'
            onClick={() =>
              onHubChange?.(null, activeScope === 'all' ? undefined : activeScope)
            }
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
              selectedHubId === null
                ? 'border-brand-purple/40 bg-brand-purple/10 text-brand-purple'
                : 'border-brand-purple/20 bg-white text-brand-purple/80 hover:border-brand-purple/35 hover:bg-brand-purple/5',
            )}
          >
            <LayoutGrid size={14} strokeWidth={2} />
            ทั้งหมด
          </button>

          {scopedHubs.map((hub) => {
            const Icon = resolveHubIcon(hub.name);
            const active = selectedHubId === hub.hub_id;
            return (
              <button
                key={hub.hub_id}
                type='button'
                onClick={() =>
                  onHubChange?.(hub.hub_id, (hub.scope as HubScope | undefined) ?? undefined)
                }
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
                  active
                    ? 'border-brand-purple/40 bg-brand-purple/10 text-brand-purple'
                    : 'border-brand-purple/20 bg-white text-brand-purple/80 hover:border-brand-purple/35 hover:bg-brand-purple/5',
                )}
              >
                <Icon size={14} strokeWidth={2} />
                <span className='max-w-[9.5rem] truncate'>{hub.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <h1 className='truncate text-[16px] font-semibold leading-snug text-brand-navy-ink sm:text-lg'>
          {title}
        </h1>
      )}
    </div>
  );
}
