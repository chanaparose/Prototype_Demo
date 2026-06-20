import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { factoryButtonClass } from '@/pages/factory-portal/factoryUi';
import type { FactoryIdeasContentType } from '@/components/features/factory-ideas/factoryIdeasTheme';

type FactoryIdeasTypeTab = {
  id: FactoryIdeasContentType;
  label: string;
};

type FactoryIdeasTypeTabsProps = {
  tabs: FactoryIdeasTypeTab[];
  activeType: FactoryIdeasContentType;
  onTypeChange: (type: FactoryIdeasContentType) => void;
  className?: string;
};

export function FactoryIdeasTypeTabs({
  tabs,
  activeType,
  onTypeChange,
  className,
}: FactoryIdeasTypeTabsProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-hide', className)}>
      {tabs.map((type) => {
        const active = activeType === type.id;
        return (
          <Button
            variant='unstyled'
            key={type.id}
            type='button'
            data-tour={`tab-${type.id}`}
            onClick={() => onTypeChange(type.id)}
            className={factoryButtonClass({
              variant: active ? 'primary' : 'toolbar',
              size: 'sm',
              className: cn(
                'whitespace-nowrap rounded-lg px-3.5 font-semibold',
                active
                  ? 'shadow-[0_4px_12px_rgba(122,75,148,0.18)]'
                  : 'text-slate-600 hover:border-brand-purple/30 hover:text-brand-purple',
              ),
            })}
          >
            {type.label}
          </Button>
        );
      })}
    </div>
  );
}
