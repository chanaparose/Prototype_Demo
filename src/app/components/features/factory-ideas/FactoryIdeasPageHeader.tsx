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

export function FactoryIdeasPageHeader({
  title,
  count,
  hubScope,
  showBack = false,
  className,
}: FactoryIdeasPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('border-b border-slate-200/70 pb-4', className)}>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='mb-1.5 flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-400'>
            {showBack ? (
              <>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => navigate(getFactoryIdeasHubPath(hubScope))}
                  className='-ml-1 inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1 text-xs font-medium text-slate-500 transition-colors hover:text-brand-purple'
                >
                  <ArrowLeft size={15} strokeWidth={2.25} aria-hidden />
                  กลับหมวดหมู่
                </Button>
                <span className='h-3 w-px shrink-0 bg-slate-200' aria-hidden />
              </>
            ) : null}
            <Layers size={16} className='shrink-0 text-brand-purple/70' strokeWidth={1.9} />
            <span className='truncate'>Discover</span>
          </div>
          <h1 className='truncate text-xl font-bold text-slate-950 sm:text-2xl'>{title}</h1>
        </div>

        <span
          className={factoryBadgeClass({
            variant: 'count',
            className: 'mt-0.5 shrink-0 bg-slate-100 text-slate-700',
          })}
        >
          {count}
        </span>
      </div>
    </div>
  );
}
