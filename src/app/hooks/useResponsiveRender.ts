import { useIsDesktop } from '@/hooks/useIsDesktop';
import type { ReactNode } from 'react';

export function useResponsiveRender() {
  const isDesktop = useIsDesktop();

  return {
    isDesktop,
    render: (mobile: ReactNode, desktop: ReactNode) => (isDesktop ? desktop : mobile),
    mobile: (component: ReactNode) => (isDesktop ? null : component),
    desktop: (component: ReactNode) => (isDesktop ? component : null),
  };
}
