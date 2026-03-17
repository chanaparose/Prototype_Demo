import React from 'react';

export function useIsDesktop(breakpoint: number = 1024): boolean {
  const [isDesktop, setIsDesktop] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoint;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      setIsDesktop(window.innerWidth >= breakpoint);
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);

  return isDesktop;
}

