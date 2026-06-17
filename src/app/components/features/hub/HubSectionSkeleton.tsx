import { cn } from '@lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DESKTOP_ROW_SLOTS, hubRowCardClass } from '@/components/features/hub/hubRowShared';

export function HubSectionSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm',
        className,
      )}
    >
      <div className='mb-3 flex items-center justify-between'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-6 w-16 rounded-full' />
      </div>
      <div className='flex flex-nowrap items-stretch gap-2.5 overflow-hidden bg-[var(--brand-page)]/50 p-3.5 lg:gap-3'>
        {Array.from({ length: DESKTOP_ROW_SLOTS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              hubRowCardClass,
              'space-y-2 border border-brand-purple/10 bg-[var(--brand-lavender-chip)]',
            )}
          >
            <Skeleton className='h-3 w-full bg-brand-purple/10' />
            <Skeleton className='h-2 w-4/5 bg-brand-purple/10' />
            <Skeleton className='h-2 w-2/3 bg-brand-purple/10' />
          </div>
        ))}
      </div>
    </div>
  );
}
