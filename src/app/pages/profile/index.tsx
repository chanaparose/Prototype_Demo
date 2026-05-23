import React from 'react';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { ProfileMobile } from '@/pages/profile/Profile.mobile.tsx';
import { ProfileDesktop } from '@/pages/profile/Profile.desktop.tsx';

export function Profile() {
  const { render } = useResponsiveRender();
  return render(<ProfileMobile />, <ProfileDesktop />);
}
