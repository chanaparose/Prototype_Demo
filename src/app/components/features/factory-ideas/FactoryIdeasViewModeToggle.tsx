import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { factoryIdeasToolbarSecondarySurfaceClass } from '@/components/features/factory-ideas/factoryIdeasTheme';

type FactoryIdeasViewModeToggleProps = {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  compact?: boolean;
  className?: string;
};

export function FactoryIdeasViewModeToggle({
  viewMode,
  onViewModeChange,
  compact = false,
  className,
}: FactoryIdeasViewModeToggleProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center gap-px p-0.5',
        compact
          ? cn('h-8', factoryIdeasToolbarSecondarySurfaceClass)
          : cn('h-8 rounded-lg border border-gray-200/80 bg-gray-50/80'),
        className,
      )}
      role='group'
      aria-label='มุมมองรายการ'
    >
      <Button
        variant='unstyled'
        type='button'
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
          viewMode === 'grid'
            ? 'bg-brand-lavender-chip/80 text-brand-purple shadow-sm'
            : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700',
        )}
        aria-label='มุมมองตาราง'
        aria-pressed={viewMode === 'grid'}
      >
        <LayoutGrid size={12} strokeWidth={2.25} />
      </Button>
      <Button
        variant='unstyled'
        type='button'
        onClick={() => onViewModeChange('list')}
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
          viewMode === 'list'
            ? 'bg-brand-lavender-chip/80 text-brand-purple shadow-sm'
            : 'text-slate-500 hover:bg-gray-50 hover:text-slate-700',
        )}
        aria-label='มุมมองรายการ'
        aria-pressed={viewMode === 'list'}
      >
        <List size={12} strokeWidth={2.25} />
      </Button>
    </div>
  );
}
