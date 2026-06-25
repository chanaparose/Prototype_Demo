import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';

type FactoryIdeasViewModeToggleProps = {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
};

export function FactoryIdeasViewModeToggle({
  viewMode,
  onViewModeChange,
  className,
}: FactoryIdeasViewModeToggleProps) {
  return (
    <div
      className={cn(
        'flex h-8 shrink-0 items-center justify-center gap-0.5 rounded-full border border-gray-200/90 bg-white/80 p-0.5',
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
          'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
          viewMode === 'grid'
            ? 'bg-white text-brand-purple shadow-sm'
            : 'text-slate-400 hover:text-slate-600',
        )}
        aria-label='มุมมองตาราง'
        aria-pressed={viewMode === 'grid'}
      >
        <LayoutGrid size={13} strokeWidth={2.25} />
      </Button>
      <Button
        variant='unstyled'
        type='button'
        onClick={() => onViewModeChange('list')}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
          viewMode === 'list'
            ? 'bg-white text-brand-purple shadow-sm'
            : 'text-slate-400 hover:text-slate-600',
        )}
        aria-label='มุมมองรายการ'
        aria-pressed={viewMode === 'list'}
      >
        <List size={13} strokeWidth={2.25} />
      </Button>
    </div>
  );
}
