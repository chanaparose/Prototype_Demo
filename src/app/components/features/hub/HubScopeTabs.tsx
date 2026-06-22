import { Building2, Package } from 'lucide-react';
import { cn } from '@lib/utils';
import { HUB_SCOPE_LABELS, type HubScope } from '@/components/features/hub/hubRowShared';

const SCOPE_META: Record<HubScope, { description: string; icon: typeof Building2 }> = {
  PD: { description: 'ค้นหาโรงงานผลิตสินค้า', icon: Building2 },
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
      <div className='px-4 lg:px-8 2xl:px-10'>
        <div
          role='tablist'
          aria-label='เลือกประเภทหมวดหมู่'
          className='grid grid-cols-2 border-b border-slate-200'
        >
          {(['PD', 'MT'] as const).map((scope) => {
            const label = HUB_SCOPE_LABELS[scope] ?? scope;
            const meta = SCOPE_META[scope];
            const Icon = meta.icon;
            const isActive = activeScope === scope;
            return (
              <button
                key={scope}
                type='button'
                role='tab'
                aria-selected={isActive}
                onClick={() => onScopeChange(scope)}
                className={cn(
                  'relative flex min-w-0 items-center justify-center gap-1.5 px-3 py-3 text-center transition-colors',
                  isActive
                    ? 'text-brand-violet-deep'
                    : 'text-slate-500 hover:text-brand-violet-deep',
                )}
              >
                <Icon
                  size={15}
                  strokeWidth={2.1}
                  className={cn('shrink-0', isActive ? 'text-brand-violet-deep' : 'text-slate-400')}
                  aria-hidden
                />
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-semibold leading-tight md:text-[15px]'>
                    {label}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 hidden truncate text-[11px] font-normal leading-tight sm:block',
                      isActive ? 'text-brand-violet-deep/70' : 'text-slate-400',
                    )}
                  >
                    {meta.description}
                  </span>
                </span>
                {isActive ? (
                  <span className='absolute inset-x-4 bottom-[-1px] h-0.5 rounded-full bg-brand-violet-deep' />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
