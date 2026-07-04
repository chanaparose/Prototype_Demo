import { ArrowLeft, ChevronDown, Layers } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { getFactoryIdeasHubPath } from '@/components/features/factory-ideas/factoryIdeasHubNav';
import { factoryBadgeClass } from '@/pages/factory-portal/factoryUi';
import { type HubScope } from '@/components/features/hub/hubRowShared';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ScopeOption = HubScope | 'all';
const HUB_SCOPES: ScopeOption[] = ['all', 'PD', 'MT'];
const SCOPE_LABELS: Record<ScopeOption, string> = {
  all: 'ทั้งหมด',
  PD: 'โรงงานรับผลิต',
  MT: 'วัตถุดิบ',
};

type FactoryIdeasPageHeaderProps = {
  title: string;
  count: string;
  hubScope?: HubScope;
  showBack?: boolean;
  currentHubId?: number;
  onHubChange?: (hubId: number, scope: HubScope | undefined) => void;
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
  const [hubOpen, setHubOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const hubDropdownRef = useRef<HTMLDivElement>(null);
  const hubTriggerRef = useRef<HTMLButtonElement>(null);
  const scopeDropdownRef = useRef<HTMLDivElement>(null);
  const scopeTriggerRef = useRef<HTMLButtonElement>(null);
  const [hubDropdownPos, setHubDropdownPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [scopeDropdownPos, setScopeDropdownPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const activeScope: ScopeOption = hubScope ?? 'all';
  const activeScopeLabel = SCOPE_LABELS[activeScope] ?? activeScope;

  useEffect(() => {
    if (!hubOpen && !scopeOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideHub =
        hubDropdownRef.current?.contains(target) || hubTriggerRef.current?.contains(target);
      const insideScope =
        scopeDropdownRef.current?.contains(target) || scopeTriggerRef.current?.contains(target);
      if (!insideHub) setHubOpen(false);
      if (!insideScope) setScopeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [hubOpen, scopeOpen]);

  const handleHubToggle = () => {
    setScopeOpen(false);
    if (!hubOpen) {
      const rect = hubTriggerRef.current?.getBoundingClientRect();
      if (rect) setHubDropdownPos({ top: rect.bottom + 6, left: rect.left });
    }
    setHubOpen((v) => !v);
  };

  const handleScopeToggle = () => {
    setHubOpen(false);
    if (!scopeOpen) {
      const rect = scopeTriggerRef.current?.getBoundingClientRect();
      if (rect) setScopeDropdownPos({ top: rect.bottom + 6, left: rect.left });
    }
    setScopeOpen((v) => !v);
  };

  const canSwitchHub = !!(onHubChange && allHubs.length > 0);
  const canSwitchScope = !!onScopeChange;

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className='min-w-0'>
        <div className='mb-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-400'>
          {showBack ? (
            <>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate(getFactoryIdeasHubPath(activeScope === 'all' ? undefined : activeScope))}
                className='-ml-1 inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-brand-purple'
              >
                <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
                กลับหมวดหมู่
              </Button>
              <span className='h-3 w-px shrink-0 bg-slate-200/80' aria-hidden />
            </>
          ) : null}
          <Layers size={14} className='shrink-0 text-brand-purple/60' strokeWidth={2.25} />
          {canSwitchScope ? (
            <div className='relative min-w-0'>
              <button
                ref={scopeTriggerRef}
                type='button'
                onClick={handleScopeToggle}
                aria-haspopup='listbox'
                aria-expanded={scopeOpen}
                className='inline-flex max-w-full items-center gap-0.5 rounded-md px-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-brand-purple'
              >
                <span className='truncate'>{activeScopeLabel}</span>
                <ChevronDown
                  size={12}
                  strokeWidth={2.25}
                  className={cn('shrink-0 transition-transform', scopeOpen && 'rotate-180')}
                  aria-hidden
                />
              </button>

              {scopeOpen
                ? createPortal(
                    <div
                      ref={scopeDropdownRef}
                      role='listbox'
                      aria-label='เลือกประเภทหมวดหมู่'
                      className='fixed z-[9999] w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg'
                      style={{ top: scopeDropdownPos.top, left: scopeDropdownPos.left }}
                    >
                      {HUB_SCOPES.map((scope) => (
                        <button
                          key={scope}
                          type='button'
                          role='option'
                          aria-selected={scope === activeScope}
                          onClick={() => {
                            onScopeChange(scope === 'all' ? null : scope);
                            setScopeOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-brand-lavender-chip',
                            scope === activeScope
                              ? 'font-semibold text-brand-purple'
                              : 'font-medium text-slate-700',
                          )}
                        >
                          {scope === activeScope ? (
                            <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple' />
                          ) : (
                            <span className='h-1.5 w-1.5 shrink-0' aria-hidden />
                          )}
                          <span>{SCOPE_LABELS[scope] ?? scope}</span>
                        </button>
                      ))}
                    </div>,
                    document.body,
                  )
                : null}
            </div>
          ) : (
            <span className='truncate'>{activeScopeLabel}</span>
          )}
        </div>

        {canSwitchHub ? (
          <div className='relative'>
            <button
              ref={hubTriggerRef}
              type='button'
              onClick={handleHubToggle}
              className='flex items-center gap-1 text-left'
            >
              <h1 className='truncate text-[16px] font-semibold leading-snug text-brand-navy-ink sm:text-lg'>
                {title}
              </h1>
              <ChevronDown
                size={16}
                strokeWidth={2.25}
                className={cn(
                  'shrink-0 text-brand-purple transition-transform',
                  hubOpen && 'rotate-180',
                )}
              />
            </button>

            {hubOpen ? createPortal(
              <div
                ref={hubDropdownRef}
                className='fixed z-[9999] w-52 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg'
                style={{ top: hubDropdownPos.top, left: hubDropdownPos.left }}
              >
                {(activeScope === 'all' ? allHubs : allHubs.filter((hub) => hub.scope === activeScope))
                  .map((hub) => (
                  <button
                    key={hub.hub_id}
                    type='button'
                    onClick={() => {
                      onHubChange?.(hub.hub_id, hub.scope as HubScope | undefined);
                      setHubOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-brand-lavender-chip',
                      hub.hub_id === currentHubId
                        ? 'font-semibold text-brand-purple'
                        : 'font-medium text-slate-700',
                    )}
                  >
                    {hub.hub_id === currentHubId && (
                      <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple' />
                    )}
                    <span className={hub.hub_id === currentHubId ? '' : 'pl-3.5'}>{hub.name}</span>
                  </button>
                ))}
              </div>,
              document.body,
            ) : null}
          </div>
        ) : (
          <h1 className='truncate text-[16px] font-semibold leading-snug text-brand-navy-ink sm:text-lg'>
            {title}
          </h1>
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
  );
}
