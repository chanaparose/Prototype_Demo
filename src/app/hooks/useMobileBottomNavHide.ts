import { useEffect, useRef, useState, type CSSProperties } from 'react';

/** Clearance for floating dock bottom nav (full size) */
export const MOBILE_BOTTOM_NAV_CLEARANCE = '4.5rem';

/** Scale when user scrolls down — keeps aspect ratio, shrinks in place */
export const MOBILE_BOTTOM_NAV_COMPACT_SCALE = 0.82;

/** Approx clearance when nav is compact (4.5rem × scale + gap) */
export const MOBILE_BOTTOM_NAV_COMPACT_CLEARANCE = '4rem';

/** Bar height (h-14) + gap above safe area (0.5rem) */
export const MOBILE_SHOWCASE_ACTION_BAR_CLEARANCE = 'calc(3.5rem + 0.5rem)';

export function isMobileCustomBottomBarRoute(pathname: string): boolean {
  return pathname === '/product-detail' || pathname === '/idea-detail';
}

export function mobileShowcaseDetailPaddingBottom(): string {
  return `calc(${MOBILE_SHOWCASE_ACTION_BAR_CLEARANCE} + env(safe-area-inset-bottom, 0px))`;
}

/** Shared fixed bottom + scale-on-scroll styles for floating mobile nav bars */
export function mobileBottomNavCompactStyles(compact: boolean): CSSProperties {
  return {
    bottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
    transform: compact ? `scale(${MOBILE_BOTTOM_NAV_COMPACT_SCALE})` : 'scale(1)',
    transformOrigin: 'bottom center',
    opacity: compact ? 0.94 : 1,
  };
}

/** Gap between FAB and bottom nav when nav is visible */
export const MOBILE_FAB_GAP = '1rem';

/**
 * Shrinks mobile bottom nav on scroll down (scale, same aspect ratio).
 * Use with `mobileFabBottomOffset()` so FABs track the smaller bar.
 */
export function useMobileBottomNavHide() {
  const [compact, setCompact] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current + 10 && y > 60) {
        setCompact(true);
      } else if (y < lastY.current - 6) {
        setCompact(false);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return compact;
}

export function mobileFabBottomOffset(bottomNavCompact: boolean): string {
  const clearance = bottomNavCompact
    ? MOBILE_BOTTOM_NAV_COMPACT_CLEARANCE
    : MOBILE_BOTTOM_NAV_CLEARANCE;
  return `calc(${clearance} + ${MOBILE_FAB_GAP} + env(safe-area-inset-bottom, 0px))`;
}

/** Bottom offset for fixed action bars above the main bottom nav */
export function mobileActionBarBottomOffset(bottomNavCompact: boolean): string {
  const clearance = bottomNavCompact
    ? MOBILE_BOTTOM_NAV_COMPACT_CLEARANCE
    : MOBILE_BOTTOM_NAV_CLEARANCE;
  return `calc(${clearance} + 0.5rem + env(safe-area-inset-bottom, 0px))`;
}

/** Padding-bottom for in-flow bars above the mobile bottom nav (e.g. chat composer) */
export function mobileBottomNavPadding(extra = '0.75rem'): string {
  return `calc(${extra} + ${MOBILE_BOTTOM_NAV_CLEARANCE} + env(safe-area-inset-bottom, 0px))`;
}
