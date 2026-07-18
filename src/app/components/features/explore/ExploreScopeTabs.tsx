import { cn } from '@lib/utils';
import type { HubScope } from '@/components/features/hub/hubRowShared';

const SCOPE_TABS: Array<{ scope: HubScope; label: string }> = [
  { scope: 'PD', label: 'ผลิตสินค้า' },
  { scope: 'MT', label: 'วัตถุดิบ' },
];

type ExploreScopeTabsProps = {
  activeScope: HubScope;
  onScopeChange: (scope: HubScope) => void;
  className?: string;
};

/** Scope tabs for Explore — matches the simple underline style in the product mock. */
export function ExploreScopeTabs({
  activeScope,
  onScopeChange,
  className,
}: ExploreScopeTabsProps) {
  return (
    <div
      className={cn('w-full border-b border-slate-200/80', className)}
      data-tour='categories'
    >
      <div
        role='tablist'
        aria-label='เลือกประเภทสินค้า'
        className='grid grid-cols-2'
      >
        {SCOPE_TABS.map(({ scope, label }) => {
          const isActive = activeScope === scope;
          return (
            <button
              key={scope}
              type='button'
              role='tab'
              aria-selected={isActive}
              onClick={() => onScopeChange(scope)}
              className={cn(
                'relative flex h-11 items-center justify-center px-3 text-[14px] font-semibold transition-colors',
                isActive
                  ? 'text-brand-navy-ink'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              {label}
              {isActive ? (
                <span className='absolute inset-x-8 bottom-[-1px] h-[2.5px] rounded-full bg-brand-purple' />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
