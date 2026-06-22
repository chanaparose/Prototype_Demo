import { Building2, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@lib/utils';

type ExploreFactoryRegisterCtaProps = {
  onRegister: () => void;
  className?: string;
  variant?: 'mobile' | 'desktop';
};

export function ExploreFactoryRegisterCta({
  onRegister,
  className,
  variant = 'mobile',
}: ExploreFactoryRegisterCtaProps) {
  const isDesktop = variant === 'desktop';

  return (
    <section className={cn(isDesktop ? undefined : 'px-4 mt-10', className)}>
      <button
        type='button'
        onClick={onRegister}
        className={cn(
          'group relative w-full overflow-hidden rounded-2xl border border-brand-purple/25 text-left',
          'bg-[linear-gradient(135deg,var(--brand-navy-deep)_0%,#4A267D_52%,#5b2d8a_100%)]',
          'shadow-[0_8px_24px_rgba(46,34,82,0.12)]',
          'transition-all duration-200 hover:shadow-[0_12px_32px_rgba(122,75,148,0.2)] active:scale-[0.99]',
          isDesktop ? 'flex items-center justify-between gap-4 p-4 md:p-5' : 'flex items-center gap-3 p-3',
        )}
      >
        <div
          className='pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-[var(--brand-orange-hot)] opacity-30 blur-xl mix-blend-screen'
          aria-hidden
        />
        <div
          className='pointer-events-none absolute -bottom-3 left-1/4 h-14 w-14 rounded-full bg-brand-purple opacity-35 blur-lg'
          aria-hidden
        />

        <div className='relative z-10 flex min-w-0 flex-1 items-center gap-3'>
          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 md:h-10 md:w-10'>
            <Building2 size={isDesktop ? 18 : 16} className='text-white' strokeWidth={2.25} />
          </span>
          <div className='min-w-0'>
            <p className='text-[12px] font-bold leading-snug text-white md:text-[13px]'>
              เป็นโรงงานพาร์ทเนอร์ Tryly
            </p>
            <p className='mt-0.5 text-[10px] leading-snug text-[#EBD3FF]/90 md:text-[11px]'>
              ลงทะเบียนฟรี · รับลูกค้าจริงจากแพลตฟอร์ม
            </p>
          </div>
        </div>

        <span
          className={cn(
            'relative z-10 inline-flex shrink-0 items-center gap-1 rounded-lg font-bold text-white',
            'bg-white/15 ring-1 ring-white/25 backdrop-blur-sm',
            isDesktop ? 'px-4 py-2 text-sm' : 'px-2.5 py-1.5 text-[11px]',
          )}
        >
          <Sparkles
            size={isDesktop ? 14 : 12}
            className='text-white/90 group-hover:rotate-12 transition-transform duration-200'
          />
          สมัครเลย
          <ChevronRight
            size={isDesktop ? 14 : 13}
            className='text-white/90 group-hover:translate-x-0.5 transition-transform duration-200'
          />
        </span>
      </button>
    </section>
  );
}
