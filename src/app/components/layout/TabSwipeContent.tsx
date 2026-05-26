import { useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@lib/utils';

const EASE_ENTER = [0.16, 1, 0.3, 1] as const;
const EASE_EXIT = [0.4, 0, 0.2, 1] as const;
const SLIDE_PX = 28;

function getTabDirection(
  prevKey: string,
  nextKey: string,
  tabOrder: readonly string[],
): number {
  const prevIndex = tabOrder.indexOf(prevKey);
  const nextIndex = tabOrder.indexOf(nextKey);
  if (prevIndex < 0 || nextIndex < 0 || prevIndex === nextIndex) return 1;
  return nextIndex > prevIndex ? 1 : -1;
}

type TabSwipeContentProps = {
  activeKey: string;
  tabOrder: readonly string[];
  children: ReactNode;
  className?: string;
};

/** Horizontal slide when switching in-page tabs (left/right by tab index). */
export function TabSwipeContent({
  activeKey,
  tabOrder,
  children,
  className,
}: TabSwipeContentProps) {
  const reduceMotion = usePrefersReducedMotion();
  const prevKeyRef = useRef(activeKey);
  const direction = getTabDirection(prevKeyRef.current, activeKey, tabOrder);
  prevKeyRef.current = activeKey;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-x-hidden', className)}>
      <AnimatePresence mode='wait' initial={false}>
        <motion.div
          key={activeKey}
          initial={{ opacity: 0, x: direction * SLIDE_PX }}
          animate={{
            opacity: 1,
            x: 0,
            transition: { duration: 0.32, ease: EASE_ENTER },
          }}
          exit={{
            opacity: 0,
            x: direction * -SLIDE_PX,
            transition: { duration: 0.22, ease: EASE_EXIT },
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
