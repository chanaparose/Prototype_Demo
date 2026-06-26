import { ArrowLeft, ChevronDown, Layers } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { getFactoryIdeasHubPath } from '@/components/features/factory-ideas/factoryIdeasHubNav';
import { factoryBadgeClass } from '@/pages/factory-portal/factoryUi';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

type FactoryIdeasPageHeaderProps = {
  title: string;
  count: string;
  hubScope?: 'PD' | 'MT';
  showBack?: boolean;
  currentHubId?: number;
  onHubChange?: (hubId: number, scope: 'PD' | 'MT' | undefined) => void;
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
  className,
}: FactoryIdeasPageHeaderProps) {
  const navigate = useNavigate();
  const { data: allHubs = [] } = useLbiHubsQuery();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setDropdownPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((v) => !v);
  };

  const canSwitch = !!(onHubChange && allHubs.length > 0);

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className='min-w-0'>
        <div className='mb-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-400'>
          {showBack ? (
            <>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate(getFactoryIdeasHubPath(hubScope))}
                className='-ml-1 inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-brand-purple'
              >
                <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
                กลับหมวดหมู่
              </Button>
              <span className='h-3 w-px shrink-0 bg-slate-200/80' aria-hidden />
            </>
          ) : null}
          <Layers size={14} className='shrink-0 text-brand-purple/60' strokeWidth={2.25} />
          <span className='truncate'>Discover</span>
        </div>

        {canSwitch ? (
          <div className='relative'>
            <button
              ref={triggerRef}
              type='button'
              onClick={handleToggle}
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
                  open && 'rotate-180',
                )}
              />
            </button>

            {open ? createPortal(
              <div
                ref={dropdownRef}
                className='fixed z-[9999] w-52 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg'
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
              >
                {allHubs.map((hub) => (
                  <button
                    key={hub.hub_id}
                    type='button'
                    onClick={() => {
                      onHubChange(hub.hub_id, hub.scope as 'PD' | 'MT' | undefined);
                      setOpen(false);
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
