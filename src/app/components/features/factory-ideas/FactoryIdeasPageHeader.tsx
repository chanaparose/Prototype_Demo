import { ArrowLeft, Layers } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { getFactoryIdeasHubPath } from '@/components/features/factory-ideas/factoryIdeasHubNav';
import { factoryBadgeClass } from '@/pages/factory-portal/factoryUi';

type FactoryIdeasPageHeaderProps = {
  title: string;
  count: string;
  hubScope?: 'PD' | 'MT';
  showBack?: boolean;
  className?: string;
};

/** Soft brand wash — use on the parent section, not inside a bordered card. */
export function FactoryIdeasHeaderBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      <div className='absolute inset-0 bg-gradient-to-br from-brand-purple/[0.11] via-[var(--brand-page)] to-brand-orange/[0.08]' />
      <div className='absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white/90' />
      <div className='absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/[0.09] blur-3xl' />
      <div className='absolute -left-12 top-6 h-36 w-36 rounded-full bg-brand-purple/[0.07] blur-3xl' />
    </div>
  );
}

export function FactoryIdeasPageHeader({
  title,
  count,
  hubScope,
  showBack = false,
  className,
}: FactoryIdeasPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className='min-w-0'>
        <div className='mb-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-400'>
          {showBack ? (
            <>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate(getFactoryIdeasHubPath(hubScope))}
                className='-ml-1 inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-brand-purple'
              >
                <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
                กลับหมวดหมู่
              </Button>
              <span className='h-3 w-px shrink-0 bg-slate-200/80' aria-hidden />
            </>
          ) : null}
          <Layers size={14} className='shrink-0 text-brand-purple/60' strokeWidth={2.25} />
          <span className='truncate'>Discover</span>
        </div>
        <h1 className='truncate text-[16px] font-bold leading-snug text-brand-navy-ink sm:text-lg'>
          {title}
        </h1>
      </div>

      <span
        className={factoryBadgeClass({
          variant: 'count',
          className: 'mt-0.5 shrink-0 bg-white/70 text-slate-600 backdrop-blur-sm',
        })}
      >
        {count}
      </span>
    </div>
  );
}
