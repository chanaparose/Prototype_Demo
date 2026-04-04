import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { ProfileMobile } from './Profile.mobile.tsx';
import { ProfileDesktop } from './Profile.desktop.tsx';

export function Profile() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <ProfileDesktop /> : <ProfileMobile />;
}

