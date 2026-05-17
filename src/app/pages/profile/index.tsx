import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { ProfileMobile } from '@/pages/profile/Profile.mobile.tsx';
import { ProfileDesktop } from '@/pages/profile/Profile.desktop.tsx';

export function Profile() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <ProfileDesktop /> : <ProfileMobile />;
}
