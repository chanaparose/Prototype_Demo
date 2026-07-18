import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useExploreData } from '@/hooks/useExploreData';
import { useManualApiPageGate } from '@/hooks/useManualApiPageGate';
import { ManualApiDevGate } from '@/components/shared/ManualApiDevGate';
import { useAuth } from '@/stores/useAuthStore';
import { ExploreMobile } from '@/pages/explore/Explore.mobile';
import { ExploreDesktop } from '@/pages/explore/Explore.desktop';

export function Explore() {
  const isDesktop = useIsDesktop(768);
  const { showGate, pageApisReady, setPageApisReady } = useManualApiPageGate();
  const { isAuthenticated } = useAuth();
  const {
    exploreFactories,
    promoSlides,
    isLoading,
  } = useExploreData({ enablePageApis: pageApisReady });

  if (showGate) {
    return <ManualApiDevGate pageLabel='Explore' onLoad={() => setPageApisReady(true)} />;
  }

  const guestConnecting = !isAuthenticated && isLoading;

  if (isDesktop) {
    return (
      <ExploreDesktop
        factories={exploreFactories}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ExploreMobile
      factories={exploreFactories}
      explorePromoCodes={[]}
      promoSlides={promoSlides}
      isLoading={isLoading || guestConnecting}
    />
  );
}
