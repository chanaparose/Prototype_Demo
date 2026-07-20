import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@lib/utils';
import { ExploreCategoryBrowseSheet } from '@/components/features/explore/ExploreCategoryBrowseSheet';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import {
  factoryIdeasFilterButtonClass,
  factoryIdeasFilterButtonSizeClass,
  factoryIdeasTheme as COLORS,
} from '@/components/features/factory-ideas/factoryIdeasTheme';

type FactoryIdeasCategoryBrowseButtonProps = {
  variant: 'desktop' | 'mobile';
  label: string;
  categoryActive: boolean;
  activeScope: HubScope;
  initialHubId?: number;
  className?: string;
};

export function FactoryIdeasCategoryBrowseButton({
  variant,
  label,
  categoryActive,
  activeScope,
  initialHubId,
  className,
}: FactoryIdeasCategoryBrowseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative z-30', variant === 'mobile' ? 'min-w-0' : 'shrink-0', className)}>
      <Button
        variant='unstyled'
        type='button'
        onClick={() => setOpen(true)}
        aria-label='เลือกหมวดหมู่'
        aria-expanded={open}
        className={cn(
          variant === 'mobile'
            ? `inline-flex w-full items-center justify-between gap-1.5 rounded-lg border transition-colors ${factoryIdeasFilterButtonSizeClass} ${factoryIdeasFilterButtonClass(categoryActive)}`
            : 'flex h-9 w-44 shrink-0 items-center justify-between gap-1.5 rounded-lg border px-3 text-xs transition-all',
        )}
        style={
          variant === 'desktop'
            ? {
                borderColor: categoryActive ? COLORS.purple : 'var(--neutral-border)',
                backgroundColor: categoryActive ? COLORS.lightPurpleBg : COLORS.gray,
                color: categoryActive ? COLORS.purple : '#4B5563',
                fontWeight: categoryActive ? 600 : 400,
              }
            : undefined
        }
      >
        <span className='min-w-0 truncate text-left'>{label}</span>
        <ChevronDown
          size={variant === 'mobile' ? 13 : 12}
          strokeWidth={2.25}
          className={cn(
            'shrink-0 transition-transform duration-200',
            open && 'rotate-180',
            variant === 'mobile' && (categoryActive ? 'text-brand-purple' : 'text-slate-400'),
          )}
        />
      </Button>

      <ExploreCategoryBrowseSheet
        open={open}
        onOpenChange={setOpen}
        activeScope={activeScope}
        initialHubId={initialHubId}
      />
    </div>
  );
}
