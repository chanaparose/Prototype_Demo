import { cn } from '@lib/utils';
import {
  factoryIdeasTypeTabsActiveIndicatorClass,
  factoryIdeasTypeTabsActiveLabelClass,
  factoryIdeasTypeTabsChromeClass,
  factoryIdeasTypeTabsIdleLabelClass,
  type FactoryIdeasContentType,
} from '@/components/features/factory-ideas/factoryIdeasTheme';

type FactoryIdeasTypeTab = {
  id: FactoryIdeasContentType;
  label: string;
};

type FactoryIdeasTypeTabsProps = {
  tabs: FactoryIdeasTypeTab[];
  activeType: FactoryIdeasContentType;
  onTypeChange: (type: FactoryIdeasContentType) => void;
  variant?: 'underline' | 'segmented';
  className?: string;
};

export function FactoryIdeasTypeTabs({
  tabs,
  activeType,
  onTypeChange,
  variant = 'underline',
  className,
}: FactoryIdeasTypeTabsProps) {
  if (variant === 'segmented') {
    return (
      <div className={cn(className)}>
        <div
          role='tablist'
          aria-label='ประเภทรายการ'
          className={cn(
            'flex min-w-0 items-stretch overflow-x-auto scrollbar-hide',
            factoryIdeasTypeTabsChromeClass,
          )}
        >
          {tabs.map((type) => {
            const active = activeType === type.id;
            return (
              <button
                key={type.id}
                type='button'
                role='tab'
                aria-selected={active}
                data-tour={`tab-${type.id}`}
                onClick={() => onTypeChange(type.id)}
                className={cn(
                  'relative min-w-0 flex-1 shrink-0 whitespace-nowrap px-3 pb-3 pt-2.5 text-[14px] shadow-none transition-colors',
                  active
                    ? factoryIdeasTypeTabsActiveLabelClass
                    : factoryIdeasTypeTabsIdleLabelClass,
                )}
              >
                {type.label}
                {active ? (
                  <span
                    className={cn(
                      'absolute bottom-0 left-1/2 h-[2px] w-[58%] max-w-[3rem] -translate-x-1/2 rounded-full',
                      factoryIdeasTypeTabsActiveIndicatorClass,
                    )}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      role='tablist'
      aria-label='ประเภทรายการ'
      className={cn(
        'flex min-w-0 items-stretch overflow-x-auto border-b border-slate-200 scrollbar-hide',
        className,
      )}
    >
      {tabs.map((type) => {
        const active = activeType === type.id;
        return (
          <button
            key={type.id}
            type='button'
            role='tab'
            aria-selected={active}
            data-tour={`tab-${type.id}`}
            onClick={() => onTypeChange(type.id)}
            className={cn(
              'relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-colors',
              active ? 'text-brand-violet-deep' : 'text-slate-500 hover:text-brand-violet-deep',
            )}
          >
            {type.label}
            {active ? (
              <span className='absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-violet-deep' />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
