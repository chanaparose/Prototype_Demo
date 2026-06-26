import { Building2, Lightbulb, Package, ShoppingBag, type LucideIcon } from 'lucide-react';
import { cn } from '@lib/utils';
import { type FactoryIdeasContentType } from '@/components/features/factory-ideas/factoryIdeasTheme';

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

const TAB_ICONS: Partial<Record<FactoryIdeasContentType, LucideIcon>> = {
  product: ShoppingBag,
  material: Package,
  idea: Lightbulb,
  factory: Building2,
};

function FactoryIdeasTypeTabButton({
  tab,
  active,
  onClick,
  className,
}: {
  tab: FactoryIdeasTypeTab;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  const Icon = TAB_ICONS[tab.id];

  return (
    <button
      type='button'
      role='tab'
      aria-selected={active}
      data-tour={`tab-${tab.id}`}
      onClick={onClick}
      className={cn(
        'relative flex min-w-0 items-center justify-center gap-1.5 px-3 py-3 text-center transition-colors',
        active ? 'text-brand-violet-deep' : 'text-slate-500 hover:text-brand-violet-deep',
        className,
      )}
    >
      {Icon ? (
        <Icon
          size={15}
          strokeWidth={2.1}
          className={cn('shrink-0', active ? 'text-brand-violet-deep' : 'text-slate-400')}
          aria-hidden
        />
      ) : null}
      <span className='relative min-w-0'>
        <span
          className={cn(
            'block truncate text-[12px] font-semibold leading-tight',
            active ? 'text-brand-violet-deep' : 'text-slate-500',
          )}
        >
          {tab.label}
        </span>
      </span>
      {active ? (
        <span
          className='absolute inset-x-4 bottom-[-1px] h-0.5 rounded-full bg-brand-violet-deep'
          aria-hidden
        />
      ) : null}
    </button>
  );
}

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
          className='grid border-b border-slate-200 bg-white'
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((type) => (
            <FactoryIdeasTypeTabButton
              key={type.id}
              tab={type}
              active={activeType === type.id}
              onClick={() => onTypeChange(type.id)}
            />
          ))}
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
      {tabs.map((type) => (
        <FactoryIdeasTypeTabButton
          key={type.id}
          tab={type}
          active={activeType === type.id}
          onClick={() => onTypeChange(type.id)}
          className='shrink-0'
        />
      ))}
    </div>
  );
}
