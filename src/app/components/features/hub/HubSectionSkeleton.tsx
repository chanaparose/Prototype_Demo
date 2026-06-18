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
      <div className='flex items-center justify-between px-3.5 pb-2.5 pt-3.5'>
        <Skeleton className='h-4 w-28 bg-white/40' />
        <Skeleton className='h-6 w-16 rounded-full bg-white/40' />
      </div>
      <div
        className={cn(
          'flex flex-nowrap items-stretch gap-2.5 overflow-hidden px-3.5 py-3.5 lg:gap-3',
          hubSectionDividerClass,
        )}
      >
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
