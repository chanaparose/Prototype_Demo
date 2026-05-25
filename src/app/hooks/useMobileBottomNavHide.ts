import { useEffect, useRef, useState } from 'react';

/** Matches main `pb-16` clearance for the mobile bottom nav */
export const MOBILE_BOTTOM_NAV_CLEARANCE = '4rem';

/** Gap between FAB and bottom nav when nav is visible */
export const MOBILE_FAB_GAP = '1rem';

/**
 * Hides mobile bottom nav on scroll down (same behavior as Layout).
 * Use with `mobileFabBottomOffset()` so FABs sit above the bar and slide down when it hides.
 */
export function useMobileBottomNavHide() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current + 10 && y > 60) {
        setHidden(true);
      } else if (y < lastY.current - 6) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return hidden;
}

export function mobileFabBottomOffset(bottomNavHidden: boolean): string {
  return bottomNavHidden
    ? `calc(1.5rem + env(safe-area-inset-bottom, 0px))`
    : `calc(${MOBILE_BOTTOM_NAV_CLEARANCE} + ${MOBILE_FAB_GAP} + env(safe-area-inset-bottom, 0px))`;
}
