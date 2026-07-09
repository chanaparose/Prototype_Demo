import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@lib/utils';

type ExploreCustomMadeSectionProps = {
  onCreateRfq: () => void;
  className?: string;
  variant?: 'mobile' | 'desktop';
};

export function ExploreCustomMadeSection({
  onCreateRfq,
  className,
  variant = 'desktop',
}: ExploreCustomMadeSectionProps) {
  const isMobile = variant === 'mobile';

  return (
    <section className={cn(isMobile ? 'px-4' : '', className)}>
      <motion.button
        type='button'
        onClick={onCreateRfq}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'group relative block w-full overflow-hidden rounded-2xl border border-white/80 bg-white text-left shadow-[0_12px_34px_rgba(46,34,82,0.08)] transition-shadow hover:shadow-[0_16px_42px_rgba(46,34,82,0.12)]',
          isMobile ? 'h-[76px]' : 'h-[112px]',
        )}
        aria-label='เริ่มสั่งทำสินค้า custom made'
      >
        <img
          src='/assets/tryly_custom_made_banner.svg'
          alt='สั่งทำได้หลายแบบ ไม่ใช่แค่ B2B'
          className={cn(
            'h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]',
            isMobile ? 'object-[20%_center]' : 'object-center',
          )}
          draggable={false}
        />
        <span
          className={cn(
            'absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-brand-navy-ink/92 text-white shadow-sm backdrop-blur transition-colors group-hover:bg-brand-purple',
            isMobile ? 'px-2.5 py-1.5 text-[10px]' : 'px-4 py-2 text-xs',
          )}
        >
          เริ่ม
          <ArrowRight className={cn(isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        </span>
      </motion.button>
    </section>
  );
}
