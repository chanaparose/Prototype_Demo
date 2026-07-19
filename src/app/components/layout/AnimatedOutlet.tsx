import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@lib/utils';

/**
 * Page transition — soft content reveal (ไม่เร็วจนตาเมื่อย)
 *   • Exit  — fade-out เท่านั้น ~180ms
 *   • Enter — fade-in + เลื่อนขึ้นเบาๆ ~480–520ms ease-out ช้าปลาย
 */

// Decelerate ชัดตอนท้าย — ลดความรู้สึก “เด้งเข้ามา”
const EASE_ENTER = [0.16, 1, 0.3, 1] as const;

type AnimatedOutletProps = {
  className?: string;
};

export function AnimatedOutlet({ className }: AnimatedOutletProps) {
  const location = useLocation();
  const outlet = useOutlet();
  const isDesktop = useIsDesktop();
  const reduceMotion = usePrefersReducedMotion();
  // Use pathname only — search params change when filters/tabs update
  // and should NOT trigger the full page enter/exit animation.
  const routeKey = location.pathname;

  /** `transform` on this wrapper breaks `position: fixed/sticky` for page chrome. */
  const skipYMotion =
    routeKey === '/' ||
    routeKey === '/create-rfq' ||
    routeKey === '/product-detail' ||
    routeKey === '/idea-detail' ||
    routeKey === '/orders';

  // Scroll to top on every route change so new pages start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [routeKey]);

  /* ── Reduced-motion: fade only, no movement ─────────────────────────── */
  if (reduceMotion) {
    return (
      <AnimatePresence mode='wait' initial={false}>
        <motion.div
          key={routeKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeOut' } }}
          className={cn('min-h-0', className)}
        >
          {outlet}
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ── Full animation ──────────────────────────────────────────────────── */
  const enterY = isDesktop ? 5 : 8;
  const enterDuration = isDesktop ? 0.48 : 0.52;

  if (skipYMotion) {
    return (
      <AnimatePresence mode='wait' initial={false}>
        <motion.div
          key={routeKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeOut' } }}
          className={cn('min-h-0', className)}
        >
          {outlet}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode='wait' initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: enterY }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { duration: enterDuration, ease: EASE_ENTER },
        }}
        exit={{
          opacity: 0,
          transition: { duration: 0.18, ease: 'easeOut' },
        }}
        className={cn('min-h-0', className)}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
