import { cn } from '@lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DESKTOP_ROW_SLOTS,
  hubRowCardClass,
  hubSectionDividerClass,
  hubSectionShellClass,
} from '@/components/features/hub/hubRowShared';

export function HubSectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(hubSectionShellClass, className)}>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2.5'>
          <Skeleton className='h-8 w-1 rounded-full bg-white/55' />
          <div className='space-y-1.5'>
            <Skeleton className='h-3.5 w-28 bg-white/55' />
            <Skeleton className='h-2.5 w-20 bg-white/45' />
          </div>
        </div>
        <Skeleton className='h-7 w-16 rounded-full bg-white/50' />
      </div>
      <div
        className={cn(
          'flex flex-nowrap items-stretch gap-2.5 overflow-hidden pb-2 lg:gap-3',
          hubSectionDividerClass,
        )}
      >
        {Array.from({ length: DESKTOP_ROW_SLOTS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              hubRowCardClass,
              'space-y-2 border border-white/70 bg-white/55 shadow-[0_8px_24px_rgba(46,34,82,0.04)]',
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
