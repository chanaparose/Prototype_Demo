import { cn } from '@lib/utils';
import { HUB_SCOPE_LABELS, type HubScope } from '@/components/features/hub/hubRowShared';

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
        'border-b border-gray-200 bg-white',
        sticky && 'sticky top-14 z-20 lg:top-0',
        className,
      )}
    >
      <div className='flex overflow-x-auto scrollbar-hide'>
        {(['PD', 'MT'] as const).map((scope) => {
          const label = HUB_SCOPE_LABELS[scope] ?? scope;
          const isActive = activeScope === scope;
          return (
            <button
              key={scope}
              type='button'
              onClick={() => onScopeChange(scope)}
              className='relative min-w-0 flex-1 shrink-0 px-2 py-3 text-center'
            >
              <span
                className={cn(
                  'text-[14px] leading-none whitespace-nowrap',
                  isActive ? 'font-bold text-[var(--brand-navy)]' : 'font-medium text-gray-400',
                )}
              >
                {label}
              </span>
              {isActive ? (
                <span
                  className='absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full'
                  style={{ background: 'var(--brand-purple)' }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
