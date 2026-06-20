import { Factory, Package } from 'lucide-react';
import { cn } from '@lib/utils';
import { HUB_SCOPE_LABELS, type HubScope } from '@/components/features/hub/hubRowShared';

const SCOPE_META: Record<HubScope, { description: string; icon: typeof Factory }> = {
  PD: { description: 'ค้นหาโรงงานผลิตสินค้า', icon: Factory },
  MT: { description: 'ค้นหาแหล่งวัตถุดิบ', icon: Package },
};

type HubScopeTabsProps = {
  activeScope: HubScope;
  onScopeChange: (scope: HubScope) => void;
  className?: string;
  sticky?: boolean;
};

export function HubScopeTabs({
  activeScope,
  onScopeChange,
  className,
  sticky = false,
}: HubScopeTabsProps) {
  return (
    <div
      className={cn(
        'w-full border-b border-slate-200/70 bg-[var(--brand-page)]',
        sticky && 'sticky top-14 z-20 lg:top-0',
        className,
      )}
    >
      <div className='px-4 pb-3 lg:px-8 2xl:px-10'>
        <div className='grid grid-cols-2 gap-2'>
          {(['PD', 'MT'] as const).map((scope) => {
            const label = HUB_SCOPE_LABELS[scope] ?? scope;
            const meta = SCOPE_META[scope];
            const Icon = meta.icon;
            const isActive = activeScope === scope;
            return (
              <button
                key={scope}
                type='button'
                onClick={() => onScopeChange(scope)}
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  isActive
                    ? 'border-brand-purple/35 bg-white text-brand-purple'
                    : 'border-brand-purple/15 bg-transparent text-slate-600 hover:border-brand-purple/30 hover:bg-brand-lavender-muted/30 hover:text-brand-purple',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                    isActive
                      ? 'border-brand-purple/20 bg-brand-lavender-muted/60 text-brand-purple'
                      : 'border-brand-purple/15 bg-white/60 text-brand-purple',
                  )}
                >
                  <Icon size={16} strokeWidth={2.1} aria-hidden />
                </span>
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-semibold leading-tight'>
                    {label}
                  </span>
                  <span className='mt-0.5 hidden truncate text-[11px] leading-tight text-slate-400 sm:block'>
                    {meta.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
