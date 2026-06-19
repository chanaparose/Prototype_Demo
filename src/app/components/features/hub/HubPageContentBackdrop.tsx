import { cn } from '@lib/utils';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';

type HubPageContentBackdropProps = {
  className?: string;
};

/** Subtle animated grid backdrop, used as a quiet texture behind content. */
export function HubPageContentBackdrop({ className }: HubPageContentBackdropProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-[#FBF8FF]', className)}
      aria-hidden
    >
      <div className='absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFAFF_34%,#F8F4FF_100%)]' />

      <AnimatedGridPattern
        width={72}
        height={72}
        numSquares={12}
        maxOpacity={0.055}
        duration={5.8}
        repeatDelay={2.2}
        className={cn(
          'inset-x-[-18%] inset-y-[-18%] h-[128%] w-[136%] skew-y-6 fill-brand-purple/[0.045] stroke-brand-purple/[0.05] text-brand-purple/[0.13]',
          '[mask-image:linear-gradient(to_bottom,transparent_0%,white_10%,white_36%,transparent_68%)]',
        )}
      />

      <div className='absolute inset-0 bg-[radial-gradient(720px_circle_at_18%_18%,rgba(162,56,255,0.035),transparent_56%),radial-gradient(640px_circle_at_88%_12%,rgba(242,120,48,0.028),transparent_54%)]' />
      <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.62)_28%,rgba(251,248,255,0.90)_62%,#FBF8FF_100%)]' />
    </div>
  );
}
