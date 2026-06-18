import { cn } from '@lib/utils';

type HubPageContentBackdropProps = {
  className?: string;
};

/** Soft brand backdrop: subtle enough to keep hub headings readable. */
export function HubPageContentBackdrop({ className }: HubPageContentBackdropProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-[#FBF8FF]', className)}
      aria-hidden
    >
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(162,56,255,0.075),transparent_26%),radial-gradient(circle_at_92%_14%,rgba(242,120,48,0.055),transparent_24%),radial-gradient(circle_at_58%_78%,rgba(81,133,212,0.055),transparent_32%),linear-gradient(180deg,#FFFFFF_0%,#FCFAFF_30%,#F8F3FF_100%)]' />
      <div className='absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle,rgba(46,34,82,0.16)_1px,transparent_1.4px)] [background-size:46px_46px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_38%,transparent_100%)]' />

      <div className='absolute -bottom-28 -left-20 h-72 w-[145%] rotate-[8deg] rounded-[45%] bg-[linear-gradient(90deg,rgba(242,120,48,0.075),rgba(255,113,131,0.06),rgba(162,56,255,0.045))]' />
      <div className='absolute -bottom-12 right-[-28%] h-52 w-[92%] -rotate-[8deg] rounded-[45%] bg-[linear-gradient(90deg,rgba(162,56,255,0.06),rgba(81,133,212,0.055),rgba(255,255,255,0.06))]' />
      <div className='absolute bottom-[-8rem] left-[8%] h-80 w-80 rounded-full bg-[rgba(242,120,48,0.07)] blur-3xl' />
      <div className='absolute bottom-[-9rem] right-[-4rem] h-96 w-96 rounded-full bg-brand-purple/[0.055] blur-3xl' />

      <div className='absolute -left-20 top-28 h-60 w-60 rounded-full bg-brand-purple/[0.045] blur-3xl' />
      <div className='absolute -right-20 top-52 h-56 w-56 rounded-full bg-[rgba(242,120,48,0.045)] blur-3xl' />
      <div className='absolute right-[6%] top-[46%] h-32 w-32 rounded-full bg-white/[0.45] blur-2xl' />
      <div className='absolute left-[8%] top-[60%] h-20 w-20 rotate-12 rounded-[2rem] border border-white/70 bg-white/18 shadow-[0_24px_80px_rgba(162,56,255,0.06)] backdrop-blur-sm' />
      <div className='absolute right-[10%] top-[24%] h-16 w-16 -rotate-12 rounded-[1.5rem] border border-white/70 bg-white/16 shadow-[0_24px_80px_rgba(242,120,48,0.06)] backdrop-blur-sm' />
    </div>
  );
}
