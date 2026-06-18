import { cn } from '@lib/utils';

type HubPageContentBackdropProps = {
  className?: string;
};

/** Light version of a graphic livestream-style backdrop: soft waves + glass-friendly glow. */
export function HubPageContentBackdrop({ className }: HubPageContentBackdropProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-[#F8F4FF]', className)}
      aria-hidden
    >
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(162,56,255,0.18),transparent_24%),radial-gradient(circle_at_90%_12%,rgba(242,120,48,0.13),transparent_22%),radial-gradient(circle_at_58%_76%,rgba(81,133,212,0.13),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#FBF7FF_22%,#F4ECFF_100%)]' />
      <div className='absolute inset-0 opacity-[0.34] [background-image:radial-gradient(circle,rgba(46,34,82,0.18)_1px,transparent_1.4px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_42%,transparent_100%)]' />

      <div className='absolute -bottom-24 -left-20 h-72 w-[145%] rotate-[8deg] rounded-[45%] bg-[linear-gradient(90deg,rgba(242,120,48,0.20),rgba(255,113,131,0.20),rgba(162,56,255,0.12))] blur-[1px]' />
      <div className='absolute -bottom-10 right-[-28%] h-52 w-[92%] -rotate-[8deg] rounded-[45%] bg-[linear-gradient(90deg,rgba(162,56,255,0.16),rgba(81,133,212,0.18),rgba(255,255,255,0.10))]' />
      <div className='absolute bottom-[-8rem] left-[8%] h-80 w-80 rounded-full bg-[rgba(242,120,48,0.18)] blur-3xl' />
      <div className='absolute bottom-[-9rem] right-[-4rem] h-96 w-96 rounded-full bg-brand-purple/[0.16] blur-3xl' />

      <div className='absolute -left-20 top-28 h-60 w-60 rounded-full bg-brand-purple/[0.13] blur-3xl' />
      <div className='absolute -right-20 top-52 h-56 w-56 rounded-full bg-[rgba(242,120,48,0.11)] blur-3xl' />
      <div className='absolute right-[6%] top-[46%] h-32 w-32 rounded-full bg-white/[0.62] blur-2xl' />
      <div className='absolute left-[8%] top-[60%] h-20 w-20 rotate-12 rounded-[2rem] border border-white/70 bg-white/25 shadow-[0_24px_80px_rgba(162,56,255,0.12)] backdrop-blur-sm' />
      <div className='absolute right-[10%] top-[24%] h-16 w-16 -rotate-12 rounded-[1.5rem] border border-white/70 bg-white/20 shadow-[0_24px_80px_rgba(242,120,48,0.12)] backdrop-blur-sm' />
    </div>
  );
}
